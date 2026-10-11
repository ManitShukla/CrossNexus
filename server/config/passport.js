const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const NSUT_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]+@nsut\.ac\.in$/;

/**
 * Google OAuth 2.0 Strategy Configuration
 * Enforces strict @nsut.ac.in domain restriction gate and automated role resolution.
 */
const configurePassport = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendBase = (process.env.BACKEND_URL || 'https://nsut-connect.onrender.com').replace(/\/+$/, '');
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${backendBase}/api/auth/google/callback`;

  if (!clientID || !clientSecret || clientID.includes('your-google-client-id') || clientID.includes('mock-google-client-id')) {
    console.warn('\x1b[33m%s\x1b[0m', '[AUTH_WARN] Google OAuth 2.0 credentials not fully hydrated in server environment.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase().trim() : null;

          // =====================================================================
          // CRITICAL SECURITY GATE: DOMAIN RESTRICTION CHECK VIA CANONICAL REGEX
          // =====================================================================
          if (!email || !NSUT_DOMAIN_REGEX.test(email)) {
            console.warn('\x1b[31m%s\x1b[0m', `[ACCESS_DENIED] Rejected authentication attempt from non-NSUT domain: ${email}`);
            return done(null, false, {
              message: 'UNAUTHORIZED_DOMAIN',
              details: 'Access strictly restricted to @nsut.ac.in institutional accounts.',
            });
          }

          const googleId = profile.id;
          const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Cadet';
          const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

          // Automated Institutional Role Detection
          const adminEmails = (process.env.ADMIN_EMAILS || 'admin@nsut.ac.in,command@nsut.ac.in,admin.terminal@nsut.ac.in')
            .split(',')
            .map((e) => e.trim().toLowerCase());

          const isInstitutionalAdmin = adminEmails.includes(email);

          let user = await User.findOne({ $or: [{ googleId }, { email }] });

          if (user) {
            if (!user.googleId) user.googleId = googleId;
            if (avatar && user.avatar !== avatar) user.avatar = avatar;
            if (isInstitutionalAdmin && user.role !== 'admin') {
              user.role = 'admin';
            }
            await user.save();
            return done(null, user);
          }

          const assignedRole = isInstitutionalAdmin ? 'admin' : 'student';

          user = await User.create({
            googleId,
            name,
            email,
            avatar,
            role: assignedRole,
            isOnboarded: false,
          });

          console.log('\x1b[32m%s\x1b[0m', `[CADET_ENLISTED] New NSUT user registered: ${email} (${user._id}) [ROLE: ${assignedRole.toUpperCase()}]`);
          return done(null, user);
        } catch (error) {
          console.error('[PASSPORT_ERROR] Critical failure in GoogleStrategy callback:', error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = configurePassport;