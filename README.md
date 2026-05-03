# Founder Brain 🧠

**Founder Brain** is an AI-powered coordination intelligence platform designed to eliminate miscommunication and strategic drift between cross-functional leaders (e.g., Business Owners vs. Tech Leads).

When multiple leaders steer a single project, conflicting priorities often go unnoticed until they cause delays. Founder Brain monitors project updates in real-time and uses **Google's Gemini AI** to automatically detect contradictory statements, flagging "Coordination Gaps" before they turn into costly mistakes.

---

## 🌟 Key Features

- **Real-Time Alignment**: A shared timeline where project leaders post their latest updates, status changes, and decisions.
- **AI Conflict Detection**: Integrates with Google Generative AI (Gemini 1.5 Pro) to semantically compare updates from different roles (Owner vs. Tech Lead) and detect strategic drift.
- **Automated Resolution Suggestions**: When a conflict is detected, the AI provides a customized, actionable resolution path to get both leaders back on the same page.
- **Strict Data Isolation**: Built-in multi-tenancy ensures that organizations only have access to their own projects, logs, and conflicts.
- **Fallback Detection Mechanism**: Includes a robust keyword and sentiment analysis fallback system if the AI service is temporarily unavailable.

---

## 🛠️ Tech Stack

- **Frontend framework**: [Next.js](https://nextjs.org/) (App Router, React)
- **Styling**: Tailwind CSS (with custom Glassmorphism and animated blobs)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (with a local `state.json` sync mechanism for rapid prototyping)
- **AI Engine**: [Google Generative AI](https://ai.google.dev/) (`@google/generative-ai` SDK)

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- A Firebase Project (with Firestore enabled)
- A Google Gemini API Key

### 2. Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"

# Authentication
AUTH_SESSION_SECRET=a_secure_random_string_for_cookies
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to start using the application.

---

## 🧠 How It Works

1. **Organization Registration**: Two members of an organization sign up. One selects the **Owner** role (Business), and the other selects the **Tech Lead** role (Technical).
2. **Project Creation**: A shared project is created under the organization's workspace.
3. **Ingestion**: The Owner posts an update about the project's direction.
4. **Coordination Monitoring**: Later, the Tech Lead posts their own update. Founder Brain intercepts the Tech Lead's update and compares it to the Owner's most recent update.
5. **Analysis**: The AI analyzes the semantics of both statements.
   - If they are aligned (e.g., both agree on launching), the log is added normally.
   - If they conflict (e.g., Owner wants to launch tomorrow, Tech Lead says they need a week to refactor), a **Coordination Gap** is flagged on the dashboard alongside an AI-suggested resolution.

---

## 🧪 Test Scenarios

To see the AI Conflict Detection in action, try the following scenarios using two accounts within the same organization (one **Owner** and one **Tech Lead**):

### Scenario 1: The Timeline Clash (🔴 Triggers Conflict)
* **Owner Update**: "Marketing is ready! We are officially shipping the new dashboard to all users tomorrow morning."
* **Tech Lead Update**: "We discovered a critical memory leak in the dashboard. I'm putting a hold on the release; we need at least 3 days to fix and test."
* **Result**: **Conflict Detected.** The AI recognizes that the business timeline (tomorrow) directly contradicts the technical reality (needs 3 days). It will flag a Coordination Gap and suggest an immediate sync.

### Scenario 2: Perfect Alignment (🟢 No Conflict)
* **Owner Update**: "We've agreed to push the launch to next Tuesday so engineering has time to ensure stability."
* **Tech Lead Update**: "Refactoring is going well. We are on track for the revised Tuesday launch date."
* **Result**: **No Conflict.** The AI understands that both leaders share the same timeline and expectations.

### Scenario 3: The Scope Creep (🔴 Triggers Conflict)
* **Tech Lead Update**: "We've finalized the MVP scope. We are strictly delivering the core payment gateway this sprint without the analytics dashboard."
* **Owner Update**: "Just promised the enterprise client that they will have the new analytics dashboard included in this week's delivery."
* **Result**: **Conflict Detected.** The AI catches the discrepancy in deliverables and alerts the team that the promised scope does not match the engineering plan.

### Scenario 4: Non-Overlapping Updates (🟢 No Conflict)
* **Owner Update**: "Had a great call with our new enterprise lead. They love the product direction."
* **Tech Lead Update**: "Migrated the database to the new cluster. Latency has dropped by 40ms."
* **Result**: **No Conflict.** The statements discuss entirely different contexts (Sales vs. Infrastructure) and do not contradict each other.

---

## 🔐 Security & Data Isolation

Founder Brain is built with strict multi-tenancy. 
- **Isolated Workspaces**: All projects, logs, and conflicts are strictly bound to the `organization` string provided during registration.
- **Session Verification**: The backend verifies the session cookie on every API request. A user from "Organization A" cannot query, clear, or delete data belonging to "Organization B".
- **Secure Password Hashing**: Passwords are cryptographically salted and hashed using `scrypt` before being stored.

---

*Built with ❤️ for cross-functional teams that want to move fast without breaking alignment.*
