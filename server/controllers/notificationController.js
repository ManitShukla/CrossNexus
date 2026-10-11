const webpush = require('web-push');
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');

// Configure Web Push VAPID credentials
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BCIuu9KUzOncf_NhpFQFyPi-A9PpRrr60ID0A5aGpmP-73VWdHs-r-94Z3z2Jrnxz8Tauf5arjX_ed2p55pigek';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'wO2cG9PicLW4Rvp0SCFqG1OjLNoq51Y51GX9czaAvr4';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@nsut.ac.in';

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.warn('[VAPID_INIT_WARN] Failed configuring VAPID details:', err.message);
}

// In-memory subscription backup buffer for resilient offline/mock operations
const inMemorySubscriptions = new Map();

/**
 * GET /api/notifications/vapid-key
 * Returns public VAPID key for browser subscription
 */
const getVapidPublicKey = (req, res) => {
  return res.status(200).json({
    success: true,
    publicKey: vapidPublicKey,
  });
};

/**
 * POST /api/notifications/subscribe
 * Registers or updates push subscription in MongoDB / in-memory cache
 */
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_FAILURE',
        message: 'Valid push subscription object with endpoint and keys is required.',
      });
    }

    const userId = req.user?._id || req.user?.id || null;

    if (mongoose.connection.readyState === 1) {
      try {
        await Subscription.findOneAndUpdate(
          { endpoint: subscription.endpoint },
          {
            userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        console.warn('[PUSH_DB_WARN] Failed persisting to Mongo, buffering in memory:', dbErr.message);
        inMemorySubscriptions.set(subscription.endpoint, {
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        });
      }
    } else {
      inMemorySubscriptions.set(subscription.endpoint, {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      });
    }

    console.log(`[PUSH_SUBSCRIBED] Endpoint registered: ${subscription.endpoint.slice(0, 30)}...`);

    return res.status(201).json({
      success: true,
      status: 'SUBSCRIPTION_ACTIVE',
      message: 'Push notification subscription established successfully.',
    });
  } catch (err) {
    console.error('[PUSH_SUBSCRIBE_ERR]', err);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: err.message || 'Failed saving push subscription.',
    });
  }
};

/**
 * Dispatches push notifications across all registered subscriptions
 */
const broadcastPushNotification = async (payload) => {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  let targetSubscriptions = [];

  if (mongoose.connection.readyState === 1) {
    try {
      targetSubscriptions = await Subscription.find({});
    } catch (err) {
      console.warn('[PUSH_BROADCAST_DB_WARN]', err.message);
      targetSubscriptions = Array.from(inMemorySubscriptions.values());
    }
  } else {
    targetSubscriptions = Array.from(inMemorySubscriptions.values());
  }

  if (targetSubscriptions.length === 0) {
    console.log('[PUSH_BROADCAST] Zero active subscriptions found. Skipping push broadcast.');
    return [];
  }

  console.log(`[PUSH_BROADCAST] Dispatching notification to ${targetSubscriptions.length} subscriptions...`);

  const results = await Promise.allSettled(
    targetSubscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        };
        return await webpush.sendNotification(pushSubscription, payloadString);
      } catch (pushErr) {
        // If subscription is 404 or 410 (expired/unregistered), delete from DB
        if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
          if (mongoose.connection.readyState === 1) {
            Subscription.deleteOne({ endpoint: sub.endpoint }).catch(() => {});
          }
          inMemorySubscriptions.delete(sub.endpoint);
        }
        throw pushErr;
      }
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`[PUSH_BROADCAST_COMPLETE] Succeeded: ${succeeded} | Failed: ${failed}`);
  return results;
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  broadcastPushNotification,
};
