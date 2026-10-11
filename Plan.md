
# CrossNexus: Full-Stack Implementation & Architecture Plan

This document outlines the systematic, step-by-step implementation plan for **CrossNexus**. It provides precise schemas, endpoint definitions, directory layouts, component structures, and validation criteria for automated or manual execution.

---

## 1. System Architecture & Tech Stack


```

[ Client: React + Vite + Tailwind CSS + PWA (Service Worker) ]
|  ^
HTTPS (REST)  |  |  WSS (Socket.io)
v  |
[ Backend: Node.js + Express + Passport.js (Google OAuth) ]
|
+-------------+-------------+
|                           |
[ MongoDB Atlas ]             [ IPFS / Pinata ]
(Users, Timetables,           (Immutable Study Vault)
Announcements, Posts)

```

*   **Frontend:** React (Vite), Tailwind CSS, Lucide React, Axios, Socket.io-client.
*   **PWA / Offline:** Workbox / Service Worker API with Cache Storage for timetables and static bundles.
*   **Backend:** Node.js, Express.js, Socket.io, Passport.js (`passport-google-oauth20`), JSON Web Tokens (`jsonwebtoken`).
*   **Database:** MongoDB Atlas with Mongoose ODM.
*   **Storage / Vault:** Pinata SDK / IPFS gateway for academic resource persistence.

---

## 2. Directory Structure

```text
crossnexus/
├── client/
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── RoleGuard.jsx
│   │   │   ├── feed/
│   │   │   │   ├── AnnouncementCard.jsx
│   │   │   │   ├── DiscussionCard.jsx
│   │   │   │   ├── CreatePostModal.jsx
│   │   │   │   └── CommentSection.jsx
│   │   │   ├── timetable/
│   │   │   │   ├── DayView.jsx
│   │   │   │   ├── WeekView.jsx
│   │   │   │   └── CurrentSlotCard.jsx
│   │   │   └── vault/
│   │   │       ├── ResourceCard.jsx
│   │   │       └── UploadResourceModal.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── TimetableContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSocket.js
│   │   │   └── useOfflineTimetable.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── OnboardingPage.jsx
│   │   │   ├── FeedPage.jsx
│   │   │   ├── TimetablePage.jsx
│   │   │   ├── VaultPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── timetableService.js
│   │   ├── utils/
│   │   │   ├── dateUtils.js
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── server/
    ├── config/
    │   ├── db.js
    │   ├── passport.js
    │   └── ipfs.js
    ├── controllers/
    │   ├── authController.js
    │   ├── announcementController.js
    │   ├── discussionController.js
    │   ├── timetableController.js
    │   └── vaultController.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── roleMiddleware.js
    │   └── errorMiddleware.js
    ├── models/
    │   ├── User.js
    │   ├── Announcement.js
    │   ├── Discussion.js
    │   ├── Comment.js
    │   ├── Timetable.js
    │   └── Resource.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── announcementRoutes.js
    │   ├── discussionRoutes.js
    │   ├── timetableRoutes.js
    │   └── vaultRoutes.js
    ├── sockets/
    │   └── announcementSockets.js
    ├── utils/
    │   └── domainValidator.js
    ├── .env.example
    ├── package.json
    └── server.js

```

---

## 3. Database Schema Models (Mongoose)

### 3.1 User (`server/models/User.js`)

```javascript
const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^[a-zA-Z0-9._%+-]+@nsut\.ac\.in$/ 
  },
  avatar: { type: String },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  branch: { type: String, uppercase: true, default: null }, // e.g., 'ECE', 'CSE', 'IT'
  semester: { type: Number, min: 1, max: 8, default: null },
  section: { type: String, uppercase: true, default: null }, // e.g., '1', '2'
  isOnboarded: { type: Boolean, default: false }
}, { timestamps: true });

```

### 3.2 Announcement (`server/models/Announcement.js`)

```javascript
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Exams', 'Placements', 'Administration', 'Events', 'General'], 
    default: 'General' 
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  isPinned: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [{ filename: String, url: String }]
}, { timestamps: true });

```

### 3.3 Discussion & Comment (`server/models/Discussion.js`, `server/models/Comment.js`)

```javascript
const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  channel: { 
    type: String, 
    enum: ['General', 'Academics', 'Tech & Projects', 'Campus Life'], 
    default: 'General' 
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  discussionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null } // Threading support
}, { timestamps: true });

```

### 3.4 Timetable (`server/models/Timetable.js`)

```javascript
const slotSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 
    required: true 
  },
  startTime: { type: String, required: true }, // Format "HH:mm" (24h), e.g., "09:00"
  endTime: { type: String, required: true },   // Format "HH:mm" (24h), e.g., "10:00"
  subjectCode: { type: String, required: true, uppercase: true },
  subjectName: { type: String, required: true },
  faculty: { type: String, default: 'TBA' },
  room: { type: String, required: true }      // e.g., "Block 4 - Room 102"
});

const timetableSchema = new mongoose.Schema({
  branch: { type: String, required: true, uppercase: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true, uppercase: true },
  schedule: [slotSchema]
}, { timestamps: true });

timetableSchema.index({ branch: 1, semester: 1, section: 1 }, { unique: true });

```

### 3.5 Academic Vault Resource (`server/models/Resource.js`)

```javascript
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  courseCode: { type: String, required: true, uppercase: true },
  type: { type: String, enum: ['PYQ', 'Notes', 'Lab Manual', 'Syllabus'], required: true },
  ipfsHash: { type: String, required: true },
  fileSize: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

```

---

## 4. Phase-by-Phase Implementation Roadmap

### Phase 1: Foundational Setup & Environment Configuration

1. Initialize monorepo root: Create `/client` and `/server`.
2. Backend bootstrap:
* Run `npm init -y` in `/server`.
* Install dependencies: `express`, `mongoose`, `cors`, `dotenv`, `passport`, `passport-google-oauth20`, `jsonwebtoken`, `socket.io`, `helmet`, `express-rate-limit`.
* Install dev dependencies: `nodemon`.
* Configure `server.js` with express JSON middleware, CORS, and MongoDB Atlas connection string.


3. Frontend bootstrap:
* Run `npm create vite@latest client -- --template react` in root.
* Install frontend dependencies: `axios`, `react-router-dom`, `lucide-react`, `socket.io-client`, `clsx`, `tailwind-merge`.
* Configure Tailwind CSS: Initialize `tailwind.config.js` and add `@tailwind` directives in `src/index.css`.
* Set up Axios base client in `src/services/api.js` pointing to `VITE_API_BASE_URL` with credentials enabled.



### Phase 2: Domain-Restricted Authentication & Access Control

1. **Google OAuth 2.0 Strategy (`server/config/passport.js`)**:
* Intercept Google profile data.
* Verify domain: Extract email. If `!email.endsWith('@nsut.ac.in')`, immediately invoke `done(new Error('Unauthorized domain'), null)`.
* Find or create user. If new, set `role: 'student'`.


2. **JWT Flow (`server/controllers/authController.js`)**:
* Issue JWT upon successful Google callback containing `{ id: user._id, role: user.role }`.
* Set secure HTTP-Only cookie or return token for client header injection.
* Redirect user to `http://localhost:5173/auth/callback?token=<JWT>`.


3. **Middleware Guards (`server/middleware/`)**:
* `authMiddleware.js`: Decode token, attach `req.user`. Return 401 if invalid/expired.
* `roleMiddleware.js`: Export `requireAdmin = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access required' })`.


4. **Client Auth Layer (`client/src/context/AuthContext.jsx`)**:
* Handle token persistence in localStorage/memory.
* Provide `user`, `login()`, `logout()`, `isAuthenticated`, and `role` to application tree.
* Create `ProtectedRoute.jsx` (redirects unauthenticated to `/login`) and `OnboardingRoute.jsx` (redirects users with `isOnboarded: false` to `/onboard`).



### Phase 3: Core API Layer Implementation

Implement REST controllers and routes in `/server`:

| Method | Endpoint | Access | Function |
| --- | --- | --- | --- |
| **GET** | `/api/auth/me` | Authenticated | Return profile, verify token freshness |
| **PUT** | `/api/users/onboard` | Authenticated | Update `branch`, `semester`, `section`, set `isOnboarded: true` |
| **GET** | `/api/announcements` | Authenticated | Fetch notices (filter by category, sorted by `isPinned` desc, date desc) |
| **POST** | `/api/announcements` | Admin Only | Create announcement and trigger Socket broadcast |
| **DELETE** | `/api/announcements/:id` | Admin Only | Remove announcement |
| **GET** | `/api/discussions` | Authenticated | Paginated feed, query param `?channel=&sort=(latest|top)` |
| **POST** | `/api/discussions` | Authenticated | Create discussion thread |
| **POST** | `/api/discussions/:id/upvote` | Authenticated | Toggle user ID in `upvotes` array |
| **GET** | `/api/discussions/:id/comments` | Authenticated | Fetch hierarchical comments for thread |
| **POST** | `/api/discussions/:id/comments` | Authenticated | Post top-level or reply comment (`parentId`) |
| **GET** | `/api/timetable` | Authenticated | Fetch document matching user's `branch`, `semester`, `section` |
| **POST** | `/api/timetable` | Admin Only | Bulk upsert timetable schedule |
| **GET** | `/api/vault` | Authenticated | Query resources by `courseCode` and `type` |
| **POST** | `/api/vault/upload` | Authenticated | Upload file to IPFS via Pinata, save CID & metadata |

### Phase 4: Real-Time Infrastructure (Socket.io)

1. **Server Setup (`server/sockets/announcementSockets.js`)**:
* Bind Socket.io to the Express HTTP server instance.
* Authenticate socket handshake using JWT.
* Create room architecture: Join authenticated sockets to room `'campus_all'`.
* In `announcementController.postAnnouncement`, invoke `io.to('campus_all').emit('new_announcement', createdAnnouncement)`.


2. **Client Setup (`client/src/context/SocketContext.jsx`)**:
* Initialize socket connection when `isAuthenticated === true`.
* Provide global listener that displays an immediate non-intrusive notification (toast) on event `'new_announcement'` and prepends data to the current announcements state.



### Phase 5: Client-Side UI Construction

1. **Layout & Shell (`Navbar.jsx`, `Sidebar.jsx`)**:
* Clean, high-contrast, minimalist layout.
* Permanent sidebar with links: **Feed**, **Timetable**, **Vault**, **Profile**.
* Top navigation showing user's Google avatar, name, and live connection status indicator.


2. **Authentication & Onboarding Flow**:
* `LoginPage.jsx`: Clean hero screen with CrossNexus branding, university background vector, and "Sign in with Google (@nsut.ac.in)" button.
* Error modal triggers on `403 Unauthorized Domain`.
* `OnboardingPage.jsx`: Dynamic selection form (Branch dropdown, Semester 1–8 selector, Section/Group toggle). Submitting calls `/api/users/onboard` and routes to `/feed`.


3. **Feed Screen (`FeedPage.jsx`)**:
* Two-column desktop grid: Left column = Discussions, Right column = Official Announcements.
* Admin view dynamically exposes a "+ Post Official Notice" button opening a modal with category and priority toggles.
* Thread detail view with upvote counters and nested discussion replies.


4. **Smart Timetable Screen (`TimetablePage.jsx`)**:
* Toggle between **Day View** and **Full Week Matrix**.
* **Real-time Class Detector**: Calculate current system time against slot arrays. Render a prominent "Happening Now" banner displaying:
* Subject, Faculty, Room location, and a live progress/remaining minutes bar.


* Future slots styled with muted slate; current active slot highlighted in electric emerald/indigo.



### Phase 6: Progressive Web App (PWA) & Offline Timetable

1. **Web App Manifest (`client/public/manifest.json`)**:
* Define `name: "CrossNexus"`, `display: "standalone"`, `theme_color: "#0f172a"`, and icons.


2. **Service Worker Implementation (`client/public/sw.js`)**:
* Cache critical assets (HTML, CSS, JS bundles) on install.
* Implement a **Network-First with Cache-Fallback** strategy for the endpoint `/api/timetable`:
* When online: Fetch fresh timetable, dynamically clone and update `caches.open('crossnexus-timetable-cache')`.
* When offline or request fails: Intercept request and immediately return cached JSON response.




3. **Frontend Cache Verification (`useOfflineTimetable.js`)**:
* Listen to `window.addEventListener('online')` and `window.addEventListener('offline')`.
* Expose an `isOffline` boolean to display an "Offline Mode — Serving Cached Schedule" badge if connection drops.



### Phase 7: Academic Vault (IPFS Integration)

1. Set up Pinata API credentials (`PINATA_API_KEY`, `PINATA_SECRET_API_KEY`) in `/server/.env`.
2. Create `/api/vault/upload` handling `multipart/form-data` via Multer.
3. Forward readable stream to Pinata's `pinFileToIPFS`.
4. Store resulting IPFS Content Identifier (CID / hash) in the `Resource` collection.
5. In `VaultPage.jsx`, render downloadable links using a public IPFS gateway: `https://gateway.pinata.cloud/ipfs/{ipfsHash}`.
6. Display a "Verified Cryptographic Hash" badge for each resource, rendering the CID in truncated monospace font with a copy button.

---

## 5. Execution & Verification Matrix

To verify that the implementation satisfies all technical criteria, execute the following test suites at each milestone:

```
[TEST 1: Domain Restriction Gate]
Attempt OAuth login with 'personal.account@gmail.com'
Expected: HTTP 403 / UI Error "Access restricted to official @nsut.ac.in accounts".
Attempt OAuth login with 'student@nsut.ac.in'
Expected: HTTP 200 / Redirection to Onboarding.

[TEST 2: Role-Based Authorization]
Authenticate as 'student@nsut.ac.in'
Execute POST /api/announcements
Expected: HTTP 403 Forbidden.
Authenticate as user with role: 'admin'
Execute POST /api/announcements
Expected: HTTP 201 Created.

[TEST 3: Real-Time Event Emission]
Open two client sessions (Window A: Student, Window B: Admin).
Admin submits notice in Window B.
Expected: Window A receives and renders notice instantly without browser reload.

[TEST 4: Offline Timetable Continuity]
Load TimetablePage while online.
Disconnect network adapter (DevTools -> Offline).
Refresh page.
Expected: Service Worker serves cached payload; timetable grid renders fully with "Offline Mode" badge.

```

---

## 6. Seed Data for Immediate Verification

Save as `server/utils/seedTimetable.json` to hydrate the database for testing:

```json
{
  "branch": "ECE",
  "semester": 1,
  "section": "1",
  "schedule": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:00",
      "subjectCode": "EC101",
      "subjectName": "Analog Electronics",
      "faculty": "Dr. S. Sharma",
      "room": "Block 6 - Room 204"
    },
    {
      "day": "Monday",
      "startTime": "10:00",
      "endTime": "11:00",
      "subjectCode": "MA101",
      "subjectName": "Engineering Mathematics I",
      "faculty": "Dr. R. Gupta",
      "room": "Block 6 - Room 204"
    },
    {
      "day": "Tuesday",
      "startTime": "11:00",
      "endTime": "13:00",
      "subjectCode": "EC102",
      "subjectName": "Electronics Circuit Lab",
      "faculty": "Prof. Verma",
      "room": "Lab 3"
    }
  ]
}

```

```
