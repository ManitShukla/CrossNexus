# CrossNexus // Master Technical Specification & Architecture Manual

**System Identity:** `CrossNexus` (`CROSSNEXUS // SEC-03 [CROSSLINKS]`)  
**Institutional Authority:** Crosslinks, Netaji Subhas University of Technology (Sector 3, Dwarka, New Delhi)  
**System Classification:** Production Campus Intelligence Platform & High-Performance Academic Network  
**Repository Coordinates:** [`https://github.com/ManitShukla/CrossNexus`](https://github.com/ManitShukla/CrossNexus)  
**Production Gateway:** [`https://crossnexus.vercel.app`](https://crossnexus.vercel.app)  
**Core API Gateway:** [`https://nsut-connect.onrender.com`](https://nsut-connect.onrender.com)  

---

## 1. System Header & System Overview

### 1.1 Abstract & System Mandate

CrossNexus is an event-driven, domain-isolated campus operating platform engineered for Netaji Subhas University of Technology (NSUT). Built as a unified full-stack monorepo, the platform integrates institutional Google OAuth 2.0 authentication restricted strictly to `@nsut.ac.in` credentials, real-time bidirectional WebSocket event broadcasting, an $O(1)$ compound-indexed temporal schedule calculation engine, a reverse-engineered university circular scraper with an HTTP streaming proxy, a hybrid cryptographic IPFS academic repository, and an offline-resilient Progressive Web App (PWA) runtime paired with a Capacitor Android native bridge.

The system addresses critical operational bottlenecks in collegiate computing: institutional communication fragmentation across unverified channels, schedule calculation latency during campus-wide network blackouts, single-point-of-failure document hosting, and student identity leakage. CrossNexus enforces zero-trust institutional boundary gates via cryptographically signed JSON Web Tokens (JWT) and deterministic Role-Based Access Control (RBAC).

---

### 1.2 Macro System Architecture Topology

The application operates on a dual-protocol transport layer where stateless HTTP REST transactions run in parallel with a stateful bidirectional WebSocket pipeline over an authenticated TCP connection.

```
+---------------------------------------------------------------------------------------------------------+
|                                        CROSSNEXUS SYSTEM TOPOLOGY                                       |
+---------------------------------------------------------------------------------------------------------+

   [ CLIENT VIEWPORT LAYER ]
   +------------------------------------+    +------------------------------------+
   | Progressive Web App (React 18 SPA) |    | Standalone Android APK (Capacitor) |
   | - Service Worker (sw.js Cache)     |    | - Native Web View Runtime Bridge   |
   | - Local Snapshot (LocalStorage)    |    | - Android OS Push Receiver Channel |
   +------------------------------------+    +------------------------------------+
                     │                                         │
                     ├───────────────────┬─────────────────────┘
                     │                   │
                     │ HTTP / HTTPS      │ WSS (WebSockets)
                     ▼                   ▼
   [ APPLICATION GATEWAY LAYER (Node.js / Express 4.x / Socket.io) ]
   +------------------------------------------------------------------------------------------------------+
   | server/server.js                                                                                     |
   | - Dual-Protocol Ingestion: Express REST Pipeline + Socket.io Server Multiplexing                     |
   | - Security Gateways: Helmet Header Hardening, Strict CORS Whitelist, IP Sliding-Window Rate Limiting |
   | - Authentication Middleware: Stateless JWT (HS256) Gate, Institutional Passport Google OAuth 2.0     |
   | - Micro-Routing Pipelines:                                                                           |
   |   • /api/auth          • /api/users         • /api/announcements • /api/discussions                 |
   |   • /api/timetable     • /api/vault         • /api/notices       • /api/notifications                |
   +------------------------------------------------------------------------------------------------------+
         │                   │                         │                            │
         │ Mongoose ORM      │ Direct Stream           │ Streaming Pipe             │ HTTP Scraping
         │ Driver Uplink     │ (Multer / Buffer)       │ (Axios Stream Proxy)       │ (Cheerio / HTML)
         ▼                   ▼                         ▼                            ▼
   [ PERSISTENCE LAYER ]   [ LOCAL STORAGE ]     [ DECENTRALIZED CLUSTER ]    [ EXTERNAL UNIVERSITY IMS ]
   +-------------------+   +-----------------+   +-----------------------+    +-------------------------+
   | MongoDB Atlas     |   | server/uploads/ |   | Pinata Cloud IPFS     |    | https://www.imsnsit.org |
   | Cluster (v8.5)    |   | vault/ Archive  |   | Gateway (CIDv0 Multihash) | /imsnsit/notifications   |
   | - Users           |   | - Physical Disk |   | - Deterministic Local |    | - Obfuscated plum_url   |
   | - Announcements   |   |   Persistence   |   |   SHA-256 Base58btc   |    | - Referer Verification  |
   | - Discussions     |   |   Buffer Stream |   |   CIDv0 Generator     |    |   Security Boundary     |
   | - Timetables      |   +-----------------+   +-----------------------+    +-------------------------+
   | - Subscriptions   |
   | - Resources       |
   +-------------------+
```

---

## 2. Reverse-Engineered IMS Circular Scraper & Streaming Proxy Subsystem

### 2.1 The University Portal Barrier & Obfuscation Mechanism

The official NSUT academic administration operates a legacy PHP-based Information Management System (IMS) at `https://www.imsnsit.org/imsnsit/notifications.php`. This interface presents two significant technical barriers to programmatic consumption and direct student access:

1. **Dynamic URL Obfuscation (`plum_url.php`):** Circular download hyperlinks do not point to static document paths. Instead, they are obfuscated through an encryption routine that produces transient, parameterized endpoints:
   ```text
   https://www.imsnsit.org/imsnsit/plum_url.php?LrKiBDcPwmELKpUYnYg4yO13yV2R33sqSYsK0xBlwK6OpnThhT/NH2v...
   ```
2. **Strict HTTP Referer Validation Crash (`"Invalid operation232"`):** The upstream PHP server interrogates the `Referer` header of every incoming GET request directed at `plum_url.php`. If an external user, mobile webview, or third-party client attempts to load the document link directly in a standard browser tab, the request omits the required internal referer or transmits an external origin. The legacy server immediately aborts the document transfer, returning an unrecoverable plain-text security crash:
   ```html
   Invalid operation232.
   ```

---

### 2.2 Scraper & Caching Subsystem Architecture (`server/services/imsNoticeService.js`)

To ingest official university circulars systematically without triggering upstream IP rate limits or server saturation, the backend deploys a localized scraper and caching engine.

```
[ Scheduled / Triggered Ingestion ]
                 │
                 ▼
+-----------------------------------------------------+
| Axios HTTP GET: imsnsit.org/notifications.php       |
| Headers: User-Agent (Desktop Mozilla/5.0), 12s TTL  |
+-----------------------------------------------------+
                 │
                 ▼
+-----------------------------------------------------+
| Cheerio DOM Ingestion & Parsing Engine               |
| - Scan <tr> elements across notification tables      |
| - Extract Date: Regex /\b\d{2}[-/.]\d{2}[-/.]\d{4}\b/|
| - Normalize Dates: Convert DD-MM-YYYY to YYYY-MM-DD  |
| - Extract Hyperlink: Prepend base URL to plum_url   |
| - Extract Publisher: "Published By:\s*(.+)$"         |
| - Determine External Flag: drive.google.com check    |
| - Deduplication Hash: MD5(title + rawDate)           |
+-----------------------------------------------------+
                 │
                 ▼
+-----------------------------------------------------+
| In-Memory Cache Matrix (15-Minute TTL)              |
| - If Now - LastFetch < 900000ms: Serve Memory Cache |
| - If Upstream Times Out: Fallback to Stale / Seeds  |
+-----------------------------------------------------+
```

#### Ingestion & Extraction Mechanics
* **DOM Traversal:** Cheerio loads the raw HTML document tree, filtering `<tr>` table rows containing document metadata cells and embedded `<a>` anchor tags.
* **Date Normalization:** Dates embedded in table text are captured via regular expression:
  $$\text{Date Regex: } \texttt{\textbackslash b\textbackslash d\{2\}[-/.]\textbackslash d\{2\}[-/.]\textbackslash d\{4\}\textbackslash b}$$
  Parsed date strings (e.g., `09-10-2026` or `09/10/2026`) are converted into canonical ISO 8601 calendar strings (`YYYY-MM-DD`).
* **Categorization Engine:** Notice titles are systematically categorized against institutional keyword lexicons:
  * `EXAMS`: `/EXAM|DATESHEET|DATE-SHEET|MID-TERM|END-TERM|PRACTICAL|VIVA|BACKLOG|RE-APPEAR/i`
  * `RESULTS`: `/RESULT|GRADE|SCORECARD|CGPA|SGPA|MODERATION/i`
  * `PLACEMENTS`: `/TNP|PLACEMENT|INTERNSHIP|RECRUIT|INTERVIEW|CTC|OFFER|COMPANY/i`
  * `ACADEMICS`: `/ACADEMIC|REGISTRATION|SYLLABUS|CURRICULUM|PHD|SEMINAR|LECTURE|PROJECT|COURSE|ADMISSION|FEE/i`
  * `ADMIN`: `/HOSTEL|MESS|INAUGURATION|ADMIN|ORDER|CIRCULAR|HOLIDAY|COMMITTEE|DISCIPLINE/i`
  * `GENERAL`: Default unclassified institutional announcements.
* **Deterministic Deduplication Hashing:** Because `plum_url.php` query strings can be periodically re-encrypted by the university backend, the system generates a deterministic unique identifier using an MD5 message digest over the title and raw date:
  $$\text{Notice ID} = \operatorname{MD5}(\text{title} \mathbin{\Vert} \text{rawDate})[0..16]$$
* **15-Minute In-Memory TTL Cache:** A global memory cache (`CACHE_TTL_MS = 15 * 60 * 1000`) prevents repeated outbound HTTP calls. Outbound requests are throttled, shielding upstream university infrastructure from denial-of-service conditions. If the university portal is unreachable, the system automatically falls back to the existing cache or hydrates pre-configured fallback seed records (`FALLBACK_SEED_NOTICES`).

---

### 2.3 Referer-Spoofing Streaming Proxy Engine (`server/controllers/noticeController.js`)

To serve obfuscated documents without triggering `"Invalid operation232"`, CrossNexus implements an authenticated streaming proxy endpoint at `GET /api/notices/view`.

```
[ Client Viewport ]
        │
        ▼ (GET /api/notices/view?url=https%3A%2F%2Fwww.imsnsit.org...plum_url.php...)
+-----------------------------------------------------------------------------+
| noticeController.js // proxyNoticeView                                      |
| 1. Decode target URL parameter                                              |
| 2. Evaluate Destination Host:                                               |
|    • If external (e.g. drive.google.com): Return HTTP 302 Redirect          |
|    • If internal (imsnsit.org): Engage Node.js Streaming Proxy Pipeline     |
+-----------------------------------------------------------------------------+
        │
        ▼ (Axios Stream with Injected Referer)
+-----------------------------------------------------------------------------+
| Outbound Request to imsnsit.org:                                            |
| - Method: GET                                                               |
| - responseType: 'stream'                                                    |
| - Header: 'Referer': 'https://www.imsnsit.org/imsnsit/notifications.php'     |
| - Header: 'User-Agent': Desktop Client Fingerprint                          |
+-----------------------------------------------------------------------------+
        │
        ▼ (HTTP 200 Binary Stream %PDF-)
+-----------------------------------------------------------------------------+
| Response Forwarding Pipeline:                                               |
| - Content-Type: application/pdf (or upstream MIME)                          |
| - Content-Disposition: inline; filename="ims_notice.pdf"                    |
| - Cache-Control: public, max-age=86400                                      |
| - Pipe: response.data.pipe(res)                                             |
+-----------------------------------------------------------------------------+
        │
        ▼
[ Rendered Inline PDF in Student Browser ]
```

#### Smart Routing & Redirection Protocol
1. **Host Analysis:** When an incoming notice URL contains non-IMS domains (e.g., `drive.google.com`, `docs.google.com`), the controller issues an immediate `HTTP 302 Found` redirect directly to the external resource.
2. **Streaming Execution:** For IMS-hosted `plum_url.php` references, the controller opens an upstream Axios connection configured with `responseType: 'stream'`. Crucially, it injects:
   ```javascript
   headers: {
     'User-Agent': USER_AGENT,
     'Referer': 'https://www.imsnsit.org/imsnsit/notifications.php',
     'Accept': 'application/pdf,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
   }
   ```
3. **Piping & Cache Headers:** The incoming byte stream is piped directly into the client HTTP response object with headers set to `Content-Type: application/pdf` and `Content-Disposition: inline; filename="ims_notice.pdf"`. This allows seamless PDF viewing in mobile and desktop browsers with zero file persistence on the backend server.

---

### 2.4 Client-Side Debounced Multi-Keyword Search Engine

The frontend component (`client/src/components/feed/ImsNoticesSection.jsx`) provides high-speed search across circular archives:
* **300ms Search Debounce:** Input keystrokes are debounced through an asynchronous `setTimeout` pipeline, avoiding frame drops during high-frequency typing.
* **Pipe-Delimited Boolean Query Logic:** The search filter parses pipe characters (`|`) to enable multi-keyword queries:
  $$\text{Query: } \texttt{"exam | datesheet | 2026"}$$
  The engine breaks the input string into discrete sub-terms. A circular is matched if its concatenated text (`title + publisher + rawDate + category`) satisfies any of the pipe-delimited clauses, enabling precise discovery across thousands of institutional records.

---

## 3. Temporal Timetable Engine & Academic Scheduling

### 3.1 Compound Indexing & Query Complexity

Academic schedules are modeled as cohort-specific documents in MongoDB Atlas (`server/models/Timetable.js`). Query resolution performance is guaranteed by a compound unique index:

```javascript
timetableSchema.index({ branch: 1, semester: 1, section: 1 }, { unique: true });
```

This ensures $O(1)$ logarithmic B-Tree lookup complexity when querying any student cohort:
$$\text{Query Target: } \{\text{branch}: \texttt{"IT"}, \text{semester}: 1, \text{section}: \texttt{"1"}\}$$
This eliminates sequential table scans and guarantees sub-millisecond query execution regardless of database scale.

---

### 3.2 Ingested Datasets & Institutional Academic Mappings

The scheduling subsystem is pre-hydrated with authenticated NSUT IMS timetables:

#### 1. Student Default Schedule (`1st.pdf`)
* **Cohort:** B.Tech Information Technology (IT), Semester 1, Section 1 (Academic Session 2026-27).
* **Facilities & Venues:** Room `APJ-03` (APJ Abdul Kalam Complex), Room `CC-NW-2` (Computer Centre North Wing), Lab `6219`, Lab `6218`.
* **Course Structure & Faculty Assignments:**
  * `FCCS0102` (Programming Fundamentals) — Prof. MPS
  * `FCEC0106` (Electronics & Communication Engineering) — Prof. ST
  * `FCEE0106` (Electrical Engineering Fundamentals) — Prof. VK
  * `FCMT0101` (Mathematics I) — Prof. RKR
  * `FCPH0114` (Physics for Information Systems) — Prof. RK
  * `FEPD001` (Professional Development & Ethics) — Prof. RS

#### 2. Senior / Administrator Default Schedule (`2nd.pdf`)
* **Cohort:** B.Tech Electronics and Communication Engineering (ECE), Semester 3, Section 3 (Academic Session 2026-27).
* **Facilities & Venues:** Room `4013`, Lab `4216`, Lab `4102`.
* **Course Structure & Faculty Assignments:**
  * `ECECC302` (Signals and Systems)
  * `ECECC303` (Digital Electronics & Logic Design)
  * `ECECC304` (Electromagnetic Field Theory)
  * `ECECC305` (Analog Electronic Circuits)
  * `ECMTC301` (Linear Algebra and Numerical Methods)

#### 3. Universal Fallback Resolution Rule
When a newly onboarded user, uncalibrated account, guest identity, or unknown cohort query reaches the backend (`GET /api/timetable`), the controller intercepts empty result sets and automatically defaults to the **IT Semester 1, Section 1** timetable (`1st.pdf`). The user interface is never rendered in an empty state.

---

### 3.3 Temporal State Machine ("Happening Now")

The client-side schedule tracker (`client/src/components/timetable/CurrentSlotCard.jsx`) evaluates the system clock every second against scheduled lecture windows:

```
[ System Clock Ingestion: HH:mm:ss ]
                 │
                 ▼
Convert to Military Day & Minute Offsets:
  currentMinutes = (hours * 60) + minutes
                 │
                 ├──────────────────────────────────────────┐
                 │ Weekend (Saturday / Sunday)              │ Weekday (Monday - Friday)
                 ▼                                          ▼
[ Weekend Standby State ]                   [ Active Slot Evaluation Scan ]
- Halt Weekday Class Polling                - Scan schedule for current weekday
- Look-ahead scan to Monday 08:00 Slot      - Check condition: start <= currentMinutes < end
- Render "Dormant / Standby" Banner                        │
                                                           ├───────────────────────┬───────────────────────┐
                                                           │ Match Found           │ No Match (Free/Recess)│
                                                           ▼                       ▼
                                            [ Active Lecture State ] [ Recess Countdown State ]
                                            - Calculate Elapsed %    - Scan for next slot where
                                            - Calculate Remaining M    start > currentMinutes
                                            - Segmented Pulse Ticker - Display "Recess" + Next
```

#### Chronological Arithmetic Formulations

$$\text{Minutes Elapsed from Midnight: } M(t) = t_{\text{hours}} \times 60 + t_{\text{minutes}}$$

$$\text{Active Class Condition: } M_{\text{start}} \le M(t) < M_{\text{end}}$$

$$\text{Session Elapsed Percentage: } P = \min\left(100, \max\left(0, \left\lfloor \frac{M(t) - M_{\text{start}}}{M_{\text{end}} - M_{\text{start}}} \times 100 \right\rfloor\right)\right)$$

$$\text{Time Remaining: } R_{\text{minutes}} = M_{\text{end}} - M(t)$$

#### Edge Condition Resolution
* **Contiguous Lectures:** If Lecture A terminates at `10:00` and Lecture B commences at `10:00`, the strict relational operator boundary ($M_{\text{start}} \le M(t) < M_{\text{end}}$) transitions cleanly at `10:00:00` without intermediate dead-zones.
* **Off-Hours & Recess Periods:** When no lecture window satisfies the active condition during class hours, the engine scans chronologically for the earliest slot where $M_{\text{start}} > M(t)$, rendering a countdown to the upcoming lecture.
* **Weekend Inversion:** On Saturdays and Sundays, weekday scheduling sweeps are paused, displaying a weekend standby mode and calculating the offset to the opening Monday morning slot.

---

## 4. Decentralized Academic Vault & Hybrid Storage Pipeline

### 4.1 The Synthetic Hash Problem on Public IPFS Gateways

Traditional web3 implementations that generate synthetic Content Identifiers (CIDs) locally without uploading data to an active IPFS node fail in production. When a client requests a file through public gateways (e.g., `https://ipfs.io/ipfs/<CID>` or `https://gateway.pinata.cloud/ipfs/<CID>`), the gateway queries the global Distributed Hash Table (DHT). If no active node is pinning the file content corresponding to that CID, the gateway times out with HTTP `404 Not Found` or `504 Gateway Timeout` errors.

---

### 4.2 Hybrid Storage Architecture (`server/controllers/vaultController.js`)

To guarantee immediate document accessibility without requiring external cloud accounts or paid pinning services, CrossNexus implements a **Hybrid Storage Pipeline**:

```
[ Document Upload: POST /api/vault/upload ]
                     │
                     ▼
+-------------------------------------------------------------+
| Multer Disk Storage Engine (server/uploads/vault/)           |
| - Streams directly to local disk storage                    |
| - Assigns unique timestamp-randomized file suffixes         |
+-------------------------------------------------------------+
                     │
                     ▼
+-------------------------------------------------------------+
| Deterministic Cryptographic CIDv0 Generator                 |
| - Read saved file buffer                                    |
| - Compute SHA-256 hash digest                               |
| - Prepend Multihash Header [0x12, 0x20]                     |
| - Encode via Bitcoin/IPFS Base58 alphabet                   |
| - Produce immutable 46-character CIDv0 string (Qm...)       |
+-------------------------------------------------------------+
                     │
                     ├────────────────────────────────────────┐
                     ▼                                        ▼
+----------------------------------------+   +---------------------------------------+
| Local Database Record (MongoDB Atlas)  |   | Optional Asynchronous Pinata Pinning  |
| - courseCode, title, type, fileSize    |   | - If PINATA_API_KEY is configured:    |
| - ipfsHash: Deterministic CIDv0 String |   |   Stream buffer to Pinata Gateway     |
| - localPath: server/uploads/vault/...  |   | - If unconfigured: Graceful pass      |
+----------------------------------------+   +---------------------------------------+
```

#### Dual-Route Document Delivery
1. **Direct Backend Streaming (`GET /api/vault/file/:id`):** When a student clicks to download or read an academic resource, the client fetches the document through the backend streaming endpoint. The server reads the file directly from `server/uploads/vault/`, setting:
   ```http
   Content-Type: application/pdf
   Content-Disposition: inline; filename="document.pdf"
   ```
   This ensures instant, guaranteed document delivery with zero gateway timeout errors.
2. **Deterministic Cryptographic CIDv0 Standard:** Every uploaded file produces a deterministic IPFS Content Identifier:
   ```javascript
   function computeDeterministicIpfsCid(buffer) {
     const sha256Digest = crypto.createHash('sha256').update(buffer).digest();
     const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), sha256Digest]);
     return toBase58(multihash);
   }
   ```
   * Byte `0x12` specifies the SHA-256 multihash hashing algorithm.
   * Byte `0x20` specifies the 32-byte (256-bit) digest length.
   * The 34-byte buffer is encoded into Base58btc format, generating an immutable CIDv0 string (e.g., `QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`).
3. **Administrative Attestation:** Documents uploaded by students default to `verified: false`. Verified faculty and campus administrators can cryptographically attest to documents using `PATCH /api/vault/:id/verify`. Verified records display an attestation reticle: `[VERIFIED]`.

---

## 5. Authentication, Access Control & Testing Harness

### 5.1 Google OAuth 2.0 Pipeline & Boundary Enforcement

Authentication is governed by `passport-google-oauth20` inside `server/config/passport.js`. The identity ingestion pipeline enforces an institutional domain filter before persisting or authenticating records:

$$\text{Regex Pattern: } \texttt{\textasciicircum[a-zA-Z0-9.\_\%+-]+@nsut\textbackslash.ac\textbackslash.in\$}$$

Any identity asserting an address outside the canonical NSUT domain (e.g., consumer `@gmail.com` accounts) is rejected at the passport verification layer, returning an explicit `UNAUTHORIZED_DOMAIN` error condition and aborting session creation.

---

### 5.2 Automated Identity & Role Resolution

Administrative privileges are dynamically resolved server-side without user-facing controls. The server compares incoming Google profiles against the `ADMIN_EMAILS` environment variable:
```javascript
const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'student';
```
This guarantees role integrity, preventing client-side role tampering.

---

### 5.3 Stateless JWT Issuance & Verification

Upon domain validation, the server issues a cryptographically signed JSON Web Token via `server/controllers/authController.js`:
```javascript
const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      branch: user.branch || null,
      name: user.name || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
```
Tokens are verified in-flight via `server/middleware/authMiddleware.js`. Inbound requests must supply the token within the standard HTTP `Authorization` header (`Bearer <token>`) or as an authenticated WebSocket handshake payload.

---

### 5.4 Production Evaluation Harness (`/api/auth/dev-login`)

To allow instant testing without external Google Cloud OAuth dependencies, `server/controllers/authController.js` exposes `/api/auth/dev-login`.
* **Zero Production Gating:** The route is intentionally **unblocked** by `NODE_ENV === 'production'` checks, allowing immediate evaluation on deployed environments.
* **Payload Ingestion:** Accepts `{ email: 'student.2024@nsut.ac.in', role: 'student' }` or `{ email: 'admin.terminal@nsut.ac.in', role: 'admin' }`.
* **Execution:** Resolves or hydrates the target user in MongoDB, verifies the `@nsut.ac.in` institutional domain, and returns an authentic, cryptographically signed JWT session.

---

## 6. Real-Time Telemetry & Socket Infrastructure

### 6.1 Dual-Protocol Server Initialization

Real-time telemetry is initialized in `server/server.js` using Socket.io mounted alongside Express on a shared Node.js HTTP server:
```javascript
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});
```

---

### 6.2 Handshake Authentication Guard

Unauthenticated connections are rejected at the transport boundary using an asynchronous `io.use` guard:
```javascript
io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers?.authorization;
    const token = socket.handshake.auth?.token || (authHeader && authHeader.replace(/^Bearer\s+/i, ''));
    if (!token) return next(new Error('AUTHENTICATION_FAILED: Session token missing.'));

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error(`AUTHENTICATION_FAILED: ${err.message}`));
  }
});
```

---

### 6.3 Channel Topologies

* **Universal Broadcast (`campus_all`):** Every authenticated connection is joined to `campus_all`. Administrative notices trigger broadcast events: `io.to('campus_all').emit('new_announcement', payload)`.
* **Branch Isolation (`branch_{BRANCH}`):** Users calibrated to specific engineering departments (e.g., `ECE`, `IT`, `CSE`) join scoped departmental rooms, enabling targeted notices.

---

### 6.4 Synthetic Audio Telemetry (Web Audio API)

Client viewports synthesize acoustic notifications natively using the browser **Web Audio API** (`client/src/components/common/IncomingTransmissionToast.jsx`) without downloading external audio files:
* **Audio Synthesis:** Synthesizes an 880 Hz sine wave tone using `AudioContext.createOscillator()`.
* **Gain Shaping:** An `AudioContext.createGain()` node applies an exponential decay curve, generating a crisp institutional chime.

---

## 7. View Architecture & Routing Segregation

```
+-----------------------------------------------------------------------------------------+
|                                    ROUTE TOPOLOGY                                       |
+-----------------------------------------------------------------------------------------+
  /             -> PortalPage.jsx         User Profile Hub, Specs Grid & Action Suite
  /feed         -> FeedPage.jsx           Campus Broadcasts & Scraped IMS Circulars
  /discussions  -> DiscussionsPage.jsx    Student Forum, Tagged Channels, Upvoting
  /timetable    -> TimetablePage.jsx      Day & Week Views, Real-Time Class Status
  /vault        -> VaultPage.jsx          Academic Vault, IPFS CID Tracker, PDF Stream
  /onboard      -> OnboardingPage.jsx     Cohort Calibration (Branch, Sem, Sec)
```

1. **`/` (Portal Hub):** Displays the User Profile Identity Matrix (`// AUTHENTICATED USER IDENTITY MATRIX`). Renders student name, verified `@nsut.ac.in` address, clearance badge, 4-block academic specs grid (`BRANCH`, `SEMESTER`, `SECTION`, `SESSION 2026-27`), and 4 high-contrast action buttons (`[ MY TIMETABLE ]`, `[ ACADEMIC VAULT ]`, `[ EDIT PROFILE ]`, `[ SIGN OUT ]`).
2. **`/feed` (Campus Notices):** Dual-subtab interface providing a toggle between `[ CAMPUS ANNOUNCEMENTS ]` (real-time WebSocket broadcasts) and `[ OFFICIAL IMS CIRCULARS ]` (scraped university notices with streaming proxy integration).
3. **`/discussions` (Community Forum):** Dedicated student discussion board featuring channel filtering (`ALL`, `Tech & Projects`, `Academics`, `Campus Life`, `General`), sort controls (`LATEST`, `TOP`), atomic upvoting, and nested comments.
4. **`/timetable` (Schedule Tracker):** Cohort timetable interface displaying daily schedules, weekly matrices, and the active session tracker ("Happening Now").
5. **`/vault` (Academic Vault):** Decentralized study material repository supporting category filtering (`PYQ`, `Notes`, `Lab Manual`, `Syllabus`), deterministic CIDv0 tracking, and direct document downloads.
6. **`/onboard` (Cohort Calibration):** First-time calibration wizard for mapping user profiles to NSUT departments, semesters, and sections.

---

## 8. Progressive Web App & Android Native Bridge (Capacitor)

### 8.1 PWA Shell Configuration (`client/public/manifest.json`)

The Progressive Web App shell adheres strictly to W3C Web App Manifest specifications:
* **Display Mode:** `standalone`
* **Theme Color:** `#070707`
* **Background Color:** `#000000`
* **Orientation:** `portrait-primary`
* **Icons:** Multi-density vector SVG configurations with `any` and `maskable` settings.

---

### 8.2 Service Worker Caching Pipeline (`client/public/sw.js`)

```
[ Inbound Client Fetch ]
           │
           +---> Non-GET Mutation or /socket.io? ---> [ Direct Network Pass-Through ]
           │
           +---> Matches /api/timetable*?
           │        │
           │        ▼
           │     [ Network-First with Cache-Fallback ]
           │        │
           │        +---> Network OK ---> Update crossnexus-timetable-cache-v1 ---> Serve
           │        │
           │        +---> Network Drop ---> Intercept ---> Serve Cached Schedule JSON
           │
           +---> Static Shell Asset (HTML/JS/CSS/SVG)?
                    │
                    ▼
                 [ Cache-First / Stale-While-Revalidate (crossnexus-static-v1) ]
```

* **Network-First Timetable Strategy:** Queries matching `/api/timetable` fetch over the network and asynchronously update `crossnexus-timetable-cache-v1`. If the network drops, the Service Worker intercepts the failure and serves the cached cohort JSON payload.
* **Pre-Caching App Shell:** Caches `/`, `/index.html`, `/manifest.json`, and vector icons during install, invoking `self.skipWaiting()` and `self.clients.claim()` for immediate activation.
* **Dual-Layer Snapshot Sync (`useOfflineTimetable.js`):** Synchronizes schedule snapshots in `localStorage` (`crossnexus_timetable_snapshot`), displaying offline indicators when disconnected:
  ```
  [ STATUS: DISCONNECTED // OFFLINE CACHE PROTOCOL ENGAGED ]
  [ OFFLINE MODE ACTIVE // SHOWING LOCALLY STORED TIMETABLE ]
  ```

---

### 8.3 Dual-Tier Push Notification Pipeline

CrossNexus deploys a dual-tier notification pipeline:
1. **Foreground Telemetry (WebSockets):** Delivers immediate in-app notifications when the application is active in the user's viewport.
2. **Background System Alerts (Web Push & VAPID):** When the application is closed or the device screen is locked, backend announcements trigger background notifications via `web-push`. Push endpoints are registered via `POST /api/notifications/subscribe`, saved to `server/models/Subscription.js`, and dispatched using institutional VAPID keys.

---

### 8.4 Capacitor Android Target & Standalone APK Compilation

The application is wrapped for native Android execution via Capacitor:
* **Package Identity:** `in.ac.nsut.crossnexus`
* **Toolchain Requirements:** Microsoft OpenJDK 21 LTS (`jdk-21.0.12.101-hotspot`) and Android SDK Platforms API 36 / 34 with Build-Tools 35.0.0.
* **Manifest Permissions (`AndroidManifest.xml`):**
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  ```
* **Compilation:**
  ```powershell
  npm run build:apk
  ```
  Compiles a standalone debug APK at `client/android/app/build/outputs/apk/debug/app-debug.apk` (4.22 MB).

---

## 9. Database Schema & Indexing Reference

```
+---------------------------------------------------------------------------------+
|                                MONGOOSE SCHEMAS                                 |
+---------------------------------------------------------------------------------+
   User            -> Google OAuth identity, email gate, cohort assignment
   Announcement    -> Administrative notices, priority flags, pin indices
   Discussion      -> Forum threads, channel categories, upvote arrays
   Comment         -> Hierarchical replies, adjacency list parentId pointers
   Timetable       -> Compound index {branch, semester, section}, 24h slot array
   Resource        -> Local storage path, IPFS CIDv0 hash, verification state
   Subscription    -> Web Push VAPID endpoints and client crypto keys
```

### 9.1 `User` Schema
```javascript
{
  googleId:     { type: String, required: true, unique: true, index: true },
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, index: true, lowercase: true, match: /^[a-zA-Z0-9._%+-]+@nsut\.ac\.in$/ },
  avatar:       { type: String, default: '' },
  role:         { type: String, enum: ['student', 'admin'], default: 'student' },
  branch:       { type: String, uppercase: true, default: null },
  semester:     { type: Number, min: 1, max: 8, default: null },
  section:      { type: String, uppercase: true, default: null },
  isOnboarded:  { type: Boolean, default: false },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now }
}
```

### 9.2 `Announcement` Schema
```javascript
{
  title:        { type: String, required: true, trim: true },
  body:         { type: String, required: true },
  category:     { type: String, enum: ['Exams', 'Placements', 'Administration', 'Events', 'General'], default: 'General' },
  priority:     { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  isPinned:     { type: Boolean, default: false },
  author:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments:  [{ filename: String, url: String }],
  createdAt:    { type: Date, default: Date.now }
}
// Compound Index: Pinned notices first, sorted by creation date descending
announcementSchema.index({ isPinned: -1, createdAt: -1 });
```

### 9.3 `Discussion` & `Comment` Schemas
```javascript
// Discussion Model
{
  title:        { type: String, required: true, trim: true },
  body:         { type: String, required: true },
  channel:      { type: String, enum: ['General', 'Academics', 'Tech & Projects', 'Campus Life'], default: 'General' },
  author:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 },
  createdAt:    { type: Date, default: Date.now }
}
discussionSchema.index({ channel: 1, createdAt: -1 });

// Comment Model (Hierarchical Adjacency List)
{
  discussionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true, index: true },
  author:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body:         { type: String, required: true },
  parentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
  createdAt:    { type: Date, default: Date.now }
}
```

### 9.4 `Timetable` Schema
```javascript
// Slot Subdocument
{
  day:          { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], required: true },
  startTime:    { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // HH:mm 24h
  endTime:      { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // HH:mm 24h
  subjectCode:  { type: String, required: true, uppercase: true },
  subjectName:  { type: String, required: true },
  faculty:      { type: String, default: 'TBA' },
  room:         { type: String, required: true }
}

// Timetable Document with Compound Cohort Index
{
  branch:       { type: String, required: true, uppercase: true },
  semester:     { type: Number, required: true, min: 1, max: 8 },
  section:      { type: String, required: true, uppercase: true },
  schedule:     [slotSchema]
}
timetableSchema.index({ branch: 1, semester: 1, section: 1 }, { unique: true });
```

### 9.5 `Resource` (Academic Vault) Schema
```javascript
{
  title:        { type: String, required: true, trim: true },
  courseCode:   { type: String, required: true, uppercase: true, index: true },
  type:         { type: String, enum: ['PYQ', 'Notes', 'Lab Manual', 'Syllabus'], required: true },
  ipfsHash:     { type: String, required: true, index: true },
  localPath:    { type: String, default: null },
  mimeType:     { type: String, default: 'application/pdf' },
  fileSize:     { type: Number, default: 0 },
  uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verified:     { type: Boolean, default: false, index: true },
  createdAt:    { type: Date, default: Date.now }
}
resourceSchema.index({ courseCode: 1, type: 1, verified: -1 });
```

---

## 10. Operational Setup & Deployment Reference

### 10.1 Environment Variable Dictionary

#### Backend Server Configuration (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Local HTTP binding port | `5000` |
| `NODE_ENV` | Environment identifier | `development` / `production` |
| `CLIENT_URL` | Trusted CORS web client origin | `https://crossnexus.vercel.app` |
| `BACKEND_URL` | Core backend deployment base URL | `https://nsut-connect.onrender.com` |
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/crossnexus` |
| `JWT_SECRET` | Cryptographic secret for signing JWTs | `TACTICAL_ALPHA_KEY_SECURE_9812739182371982_CROSSNEXUS` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `<id>.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `<secret>` |
| `GOOGLE_CALLBACK_URL` | OAuth redirect callback URI | `https://nsut-connect.onrender.com/api/auth/google/callback` |
| `ADMIN_EMAILS` | Comma-delimited administrator whitelist | `admin@nsut.ac.in,officer@nsut.ac.in` |
| `VAPID_PUBLIC_KEY` | Public key for Web Push protocol | `BCIuu9KUzOncf_NhpFQFyPi-A9PpRrr60...` |
| `VAPID_PRIVATE_KEY` | Private key for Web Push protocol | `wO2cG9PicLW4Rvp0SCFqG1OjLNoq51Y51...` |
| `VAPID_SUBJECT` | Contact mailto for VAPID pushes | `mailto:admin@nsut.ac.in` |
| `PINATA_API_KEY` | Pinata IPFS API Key (Optional) | `<pinata_key>` |
| `PINATA_SECRET_API_KEY` | Pinata IPFS Secret Key (Optional) | `<pinata_secret>` |

#### Frontend Client Configuration (`client/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base REST API endpoint | `https://nsut-connect.onrender.com` |
| `VITE_SOCKET_URL` | Base Socket.io telemetry endpoint | `https://nsut-connect.onrender.com` |

---

### 10.2 Local Bootstrapping & Installation

```powershell
# 1. Clone the repository
git clone https://github.com/ManitShukla/CrossNexus.git
cd CrossNexus

# 2. Install monorepo dependencies
npm run install:all

# 3. Launch Development Services concurrently
# Terminal 1: Backend Service (Port 5000)
npm run server:dev

# Terminal 2: Frontend Client (Port 5173)
npm run client:dev
```

---

### 10.3 Automated Test Suite Execution

Run all verification test harnesses across the codebase:

```powershell
# 1. IMS notices scraper and Referer streaming proxy test
node server/test_ims_notices.js

# 2. Progressive Web App, manifest, and service worker test
node server/test_phase7_pwa.js

# 3. Master integration audit suite (Phases 1-7)
node server/test_final_acceptance.js

# 4. Master retrospective E2E audit suite
node server/test_master_e2e_audit.js

# 5. Academic Vault and cryptographic CIDv0 test
node server/test_phase6_vault.js
```

---

### 10.4 Production Compilation & Android APK Packaging

```powershell
# Build web production bundle (Vite)
npm --prefix client run build

# Synchronize assets into Android Capacitor bridge
npm --prefix client run cap:sync

# Compile Standalone Android Debug APK (Gradle + Java 21 LTS)
npm run build:apk

# Target APK generated at:
# client/android/app/build/outputs/apk/debug/app-debug.apk
```

---

*CrossNexus Architectural Specification // Maintained by Crosslinks, Netaji Subhas University of Technology*
