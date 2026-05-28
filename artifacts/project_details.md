# 🚀 LevelUp — Project Reference Manual

**The AI-Powered Career Operating System for India's Next 100 Million Engineers**

This document provides a detailed breakdown of the **LevelUp** platform, structured specifically for academic review, project presentations, and external evaluations.

---

## 🏗️ System Architecture & Data Flow

Before diving into individual modules, here is how the entire LevelUp ecosystem communicates across the frontend, backend, database, and AI layers.

```mermaid
graph TD
    subgraph "Frontend Layer (React 18 PWA)"
        A[Student Dashboard]
        B[Resume Analyzer UI]
        C[Interview Studio UI]
        D[Learning Hub UI]
        E[AI Roadmap UI]
        F[Faculty "Ask AI" Dashboard]
    end

    subgraph "Backend Controller Layer (Node.js + Express)"
        G[Auth Middleware]
        H[AI Service Layer]
        I[NLP Query Engine]
        J[Activity & Session Tracker]
        K[Socket.io Signaling Server]
    end

    subgraph "Database Layer (MongoDB Atlas)"
        L[(Users Collection)]
        M[(Resumes Collection)]
        N[(Activity Logs)]
        O[(Quiz Attempts)]
        P[(Interview Sessions)]
    end

    subgraph "AI & External Services"
        Q[Groq Cloud: LLaMA 3.3 70B]
        R[Web Speech API: STT/TTS]
        S[Cloudinary: Resume Storage]
    end

    %% Frontend to Backend Connections
    A -->|Route Updates| J
    B -->|Upload PDF| H
    C -->|Voice STT Answers| H
    D -->|Quiz Results| J
    E -->|Profile Inputs| H
    F -->|Natural Language| I
    C -.->|WebRTC Signaling| K

    %% Backend to Database Connections
    G --> L
    H --> M
    I --> N
    I --> O
    J --> N
    J --> O
    H --> P

    %% Service connections
    H -->|JSON Schema Prompt| Q
    H -->|Media Storage| S
    C -->|Local speech synth| R
    I -->|MongoDB Aggregations| N
```

---

## 📦 Detailed Module-by-Module Breakdown

---

### 1. Interactive Student Dashboard & Activity Tracker

#### A. Problem to Solve
Engineering students often prepare for placements in an unstructured, unmeasured manner. They spend hours hopping between YouTube videos or websites without tracking their active study hours, establishing a regular routine, or maintaining accountability. This leads to preparation burnout and inconsistent learning.

#### B. Our Solution
A gamified central dashboard that serves as a student's personal study command center. It automatically logs their active preparation hours, manages their daily task checklist, tracks study streaks to build consistency, and visualizes progress over time using interactive data charts.

#### C. Working
- **Route Tracker:** A background listener in React monitors the user's active page.
- **Focus Sessions:** Students can start a Pomodoro focus timer to log dedicated study blocks.
- **Sync to Cloud:** The frontend sends active study duration updates in the background. The server records these as activity entries in MongoDB.
- **Data Visualization:** The dashboard pulls the historical data and renders daily study trends, streaks, and subject-wise breakdowns using Recharts.
- **Streak Calculation:** Calculated automatically during login by checking the day difference between the current date and the user's last recorded activity.

#### D. Comparable Platforms (Competitors)
- **LeetCode** (for daily streaks and activity heatmaps)
- **Toggl / RescueTime** (for automated time tracking and analytics)
- **Notion** (for daily checklists and task boards)

#### E. Technical Specifications & Details
- **Database Model (`Activity`):**
  ```javascript
  {
    user: mongoose.Schema.Types.ObjectId,
    classroomCode: String,
    department: String,
    college: String,
    category: String, // 'dsa', 'fullstack', 'interview', 'resume'
    label: String,    // e.g., 'Completed React Basics Quiz'
    duration: Number, // In seconds
    type: String,     // 'study' or 'focus'
    date: Date
  }
  ```
- **Streak Logic:** Checks the timestamp of the last activity. If `difference == 1 day`, the streak increments. If `difference > 1 day`, the streak resets to 0. If `difference == 0`, the streak remains active but does not increment.

---

### 2. AI Resume Analyzer

#### A. Problem to Solve
Over 85% of college resumes are rejected at the initial screening phase by Applicant Tracking Systems (ATS). Students struggle with formatting, fail to include target industry keywords, write passive bullet points, or list generic job duties instead of quantifying their impact (e.g., writing "helped build a web app" instead of "optimized SQL queries to reduce load times by 40%").

#### B. Our Solution
An intelligent resume parser and auditor. It scores student resumes across five core dimensions (Tone, Content, Structure, ATS, and Skills), identifies missing industry keywords for their target role, and provides direct, line-by-line rewrite suggestions to help them bypass ATS filters.

#### C. Working
1. The student uploads their resume in PDF format.
2. The backend extracts raw text from the buffer using `pdf-parse`.
3. The extracted text is sanitized to block prompt injection and sent to the **Groq LLaMA 3.3-70B** API.
4. The AI evaluates the resume using a structured system prompt, outputting a precise JSON report containing dimension-specific scores, strengths, weaknesses, missing keywords, and rewritten bullet points.
5. The resume document and its version history are stored in MongoDB, and the PDF is hosted securely on Cloudinary.
6. A global leaderboard displays the top 15 highest-scoring resumes to encourage healthy competition.

#### D. Comparable Platforms (Competitors)
- **ResumeWorded**
- **VMock**
- **Jobscan**

#### E. Technical Specifications & Details
- **AI Model & Parameters:** Groq Cloud LLaMA 3.3 70B (`llama-3.3-70b-versatile`) in JSON mode. Temperature set to `0.3` for consistent, analytical scoring.
- **Rate Limiting:** Managed via `express-rate-limit` (capped at 10 resume reviews per hour per IP) to prevent API key abuse and control operational costs.
- **Offline Heuristic Fallback:** A custom 400+ line TF-IDF (Term Frequency-Inverse Document Frequency) keyword analysis engine. If the AI service is offline, it matches the resume against a database of 100+ action verbs, soft skills, and tech keywords, calculating a robust fallback score.

---

### 3. Voice-Enabled AI Mock Interview Studio

#### A. Problem to Solve
Walking into a technical interview is highly stressful. Students often struggle to explain concepts verbally, even if they understand the code. Mock interviews with senior developers are expensive, and typical online prep platforms are limited to text-only Q&A.

#### B. Our Solution
A voice-enabled interactive interview platform. It simulates real-life technical or behavioral rounds in 10+ domains (Java, Python, DSA, System Design, React, Node.js, SQL, OS, DBMS, CN, and HR) or grills students on their self-declared project architecture.

#### C. Working
1. **Lobby Selection:** The student chooses a technical topic or enters a project description.
2. **Voice Setup:** The platform requests access to the microphone and initiates the Web Speech API.
3. **Conversational Flow:** The AI interviewer reads the first question using Speech Synthesis (TTS).
4. **Speech-to-Text:** The student answers the question verbally. The browser's Speech Recognition (STT) converts their voice into text.
5. **Backend Evaluation:** The transcribed response is sent to the backend alongside the chat history and question index.
6. **Grades & Feedback:** LLaMA 3.3-70B evaluates the answer, assigns a score (1-10), provides constructive feedback, and returns a detailed mock model answer alongside the next question.

#### D. Comparable Platforms (Competitors)
- **Google Interview Warmup**
- **Pramp** (mock interviews)
- **Interviewing.io**

#### E. Technical Specifications & Details
- **Project Deep-Dive Sequence:** A structured 10-question sequence that guides the student through their project's problem statement, differentiation, system architecture, core algorithms, scalability bottlenecks, security, limitations, and future improvements.
- **Response Format:** Enforced using a strict Markdown schema in the JSON payload:
  ```json
  {
    "message": "**ANSWER EVALUATION**\n\n**Status:** [CORRECT/PARTIALLY CORRECT/INCORRECT]...",
    "nextQuestionIndex": 3,
    "type": "question",
    "score": 8
  }
  ```
- **Local Fallback Engine:** Features a predefined question bank (5 to 8 questions per domain) and checks the user's answer against specific key terms (e.g., matching "immutable" and "constant" for a Java question about the `final` keyword).

---

### 4. Dynamic AI Career Roadmap Generator

#### A. Problem to Solve
When planning their career paths, students struggle to find structured guidance. Static roadmaps (like roadmap.sh) are useful but generic; they do not adjust for a student's prior knowledge, target timeline, or the specific hiring criteria of different companies.

#### B. Our Solution
A personalized career counselor that builds custom, phase-by-phase learning paths. The roadmaps dynamically adapt based on the student's target role, current experience level, preparation timeline, and target company type.

#### C. Working
1. The student enters their target role, timeline (in months), experience level, current skills, and target company type.
2. The parameters are sent to the backend. LLaMA 3.3-70B evaluates the input and generates a custom preparation curriculum.
3. The roadmap includes monthly milestone tasks, weekly study routines, portfolio project suggestions, a gap analysis of skills to learn, and curated learning resources.
4. The React frontend renders this plan as an interactive timeline.

#### D. Comparable Platforms (Competitors)
- **Roadmap.sh**
- **Kickresume Career Path**

#### E. Technical Specifications & Details
- **Company-Type Adaptability:** The system uses distinct prompts depending on the company tier selected:
  - *FAANG:* Focuses on advanced algorithms (graphs, dynamic programming), distributed systems design, and behavioral preparation (Amazon Leadership Principles).
  - *Indian Product Companies/Startups:* Focuses on full-stack web development (MERN/Spring Boot), live deployments, and medium-level DSA.
  - *Indian IT Services (TCS, Infosys):* Focuses on core CS fundamentals (OOP, OS, DBMS, CN), quantitative aptitude, and basic coding tasks.
  - *Remote MNCs:* Focuses on open-source contributions, clean code on GitHub, and take-home engineering assignments.
- **Local Fallback:** A rule-based decision tree that evaluates the student's profile and returns a structured roadmap path using local templates.

---

### 5. Learning Hub & Quiz Engine

#### A. Problem to Solve
Fragmented studying across YouTube playlists lacks structured validation. Students can watch tutorials without testing their understanding, and faculty have no way to verify whether students are retaining what they study.

#### B. Our Solution
A built-in classroom learning hub with 14+ technical domains. It features modular lesson chapters and interactive quizzes that record scores and log attempts to track student progress.

#### C. Working
1. Students browse technical modules and study individual chapters.
2. At the end of each module, they take a timed multiple-choice quiz.
3. The backend calculates the final score percentage and saves the attempt in MongoDB.
4. These quiz results update the student's progress bar on their dashboard and feed into the faculty performance report.

#### D. Comparable Platforms (Competitors)
- **Udemy / Coursera Quizzes**
- **LeetCode Quizzes**

#### E. Technical Specifications & Details
- **Database Model (`QuizAttempt`):**
  ```javascript
  {
    user: mongoose.Schema.Types.ObjectId,
    moduleCode: String,      // e.g., 'react_basics'
    score: Number,           // Correct answers
    total: Number,           // Total questions
    percentage: Number,      // Score percentage
    date: Date
  }
  ```
- **Module Coverage:** 14+ domains including Frontend (React, HTML/CSS), Backend (Node.js, Express), Databases (SQL, MongoDB, Redis), CS Core (OS, DBMS, CN, OOP), and Cloud/DevOps (AWS, Docker).

---

### 6. Faculty Dashboard & "Ask AI" Analytics Engine

#### A. Problem to Solve
Faculty members, Department Heads, and Placement Officers waste hours manually collecting student performance records on Excel spreadsheets. They have no simple way to track study hours, identify struggling students, or analyze classroom preparation levels in real time.

#### B. Our Solution
An administrative command center with cohort performance charts, student comparison tools, and a Natural Language Query engine ("Ask AI"). It allows faculty to query the database using plain English to get immediate visual reports.

#### C. Working
1. A faculty member logs in and enters a plain English query (e.g., *"Who are the top performers in CSE-3A?"* or *"Which students are at risk?"*).
2. The query is processed by a local NLP engine that matches the request's intent using regular expressions.
3. The engine maps the intent to a preconfigured MongoDB aggregation pipeline, incorporating any specified filters (like classroom codes, departments, or time periods).
4. The aggregation pipeline runs, and the database returns structured results.
5. The engine wraps the database output in a UI metadata payload, specifying the best chart type (Line, Bar, Pie, Radar, or Table) and labels.
6. The frontend reads the payload and dynamically renders the appropriate Recharts visualization.

#### D. Comparable Platforms (Competitors)
- **Tableau / PowerBI**
- **Moodle Learning Analytics**

#### E. Technical Specifications & Details
- **Local NLP Pattern Matcher:** Utilizes 10 specialized pattern-regex handlers (study time, quiz scores, resume analysis, top performers, comparisons, attendance, trends, dashboard overview, category breakdown) to execute fast, predictable queries and avoid LLM hallucinations.
- **Security & Scoping Middleware (`scopeData`):** Automatically injects restrictions into the student search filter. A CSE faculty member is programmatically blocked from querying MECH or ECE student records, ensuring strict privacy control.
- **At-Risk Flagging Algorithm:** Calculates a composite risk score based on:
  - Study hours: $< 2$ hours in the last 14 days ($+3$ risk points).
  - Quiz average: $< 40\%$ ($+3$ risk points).
  - Inactivity: $> 7$ days since last active ($+4$ risk points).
  - Streak: $0$ active streak ($+1$ risk point).
  - *Risk Levels:* $\ge 7$ points is flagged as **HIGH RISK**, $\ge 4$ points as **MEDIUM RISK**.

---

### 7. P2P WebRTC Video Rooms

#### A. Problem to Solve
While AI mock interviews provide excellent practice, peer-to-peer human interaction is crucial. Students need to practice conducting interviews, learn through peer review, and collaborate on shared workspaces to simulate live technical panel rounds.

#### B. Our Solution
An instant peer-to-peer virtual meeting space. Students can generate a room code, turn on their camera and microphone, and conduct mock interviews with classmates using a shared workspace.

#### C. Working
1. A student creates a session room, which generates a unique room code.
2. Another classmate enters the code to join.
3. The Node/Express server and Socket.io manage the signaling channel, exchanging SDP offers, answers, and ICE candidates between the browsers.
4. Once signaled, the peer connection is established directly between the two browsers using WebRTC.
5. Real-time video/audio streams are exchanged alongside a shared, synchronized notepad.

#### D. Comparable Platforms (Competitors)
- **Zoom / Google Meet**
- **Pramp** (Peer mode)

#### E. Technical Specifications & Details
- **Signaling Server:** Relays messages via Socket.io events: `join-room`, `signal-peer`, `peer-connected`, and `leave-room`.
- **Media Optimization:** Standard WebRTC peer connection constraints configured for low latency, prioritizing voice clarity and stable video frames over high-definition resolutions.

---

## 🎓 Teacher Q&A Preparation (Viva Voce)

Here are the toughest questions an external examiner or teacher might ask about the project, along with winning technical answers.

### Q1. How does this differ from a simple ChatGPT API wrapper?
**Answer:** ChatGPT is a general-purpose chatbot. It has no persistent database state, cannot automate user activity tracking, does not parse PDF files into structured resume entities, cannot manage multi-role institutional dashboards, and cannot generate real-time MongoDB aggregations. 

LevelUp is a full-stack Career Operating System. It integrates 15 data models (Users, Resumes, Activities, Quiz attempts, Interview sessions, etc.) in MongoDB, features an automated background time tracker, and utilizes a custom NLP query engine that converts natural language into database aggregation queries. Furthermore, it operates fully on custom local heuristics if the Groq API keys are unavailable.

### Q2. How did you convert natural language into database charts without security risks like NoSQL Injection?
**Answer:** We did not pass raw user text to the database or rely on an LLM to write raw MongoDB queries, which could lead to hallucinations or database vulnerabilities. Instead, we built a **local regex-based NLP query parser** in the backend. 

The parser extracts parameters (such as classroom codes, departments, and time periods) and maps them to predefined, parameterized MongoDB aggregation templates. The queries are filtered through our `scopeData` security middleware, ensuring that a user can only access data within their authorized scope.

### Q3. How does the time-tracking system handle user inactivity or page abandonment?
**Answer:** The tracking system relies on two mechanisms:
1. **Frontend Active Listener:** The tracking code detects route changes and page visibility states. If a student leaves the tab, minimizes the window, or remains inactive for more than 5 minutes, the timer pauses.
2. **Heartbeat Sync:** When active, the client sends periodic heartbeat updates to the backend. The backend validates and commits these active sessions to MongoDB, ensuring that accidental tab closures do not result in inflated study metrics.

### Q4. What happens if the internet is slow or the Groq API goes down?
**Answer:** We designed the system with **local heuristic fallbacks** for all AI features:
- **Resume Analyzer:** Falls back to a local TF-IDF parser that scans the resume for 100+ industry-standard tech keywords and action verbs.
- **Career Roadmap:** Generates structured paths using a rule-based decision tree that evaluates the user's experience and target company type.
- **Interview Studio:** Switches to a local database of 60+ technical questions and evaluates answers using keyword matching.

### Q5. How does the WebRTC signaling system operate?
**Answer:** WebRTC establishes direct peer-to-peer connections for media streaming, but the browsers need an initial way to locate each other. 

We used **Express and Socket.io** as our signaling server. When a student creates a room, they join a socket room. When the second peer enters the room code, the signaling server exchanges the Session Description Protocol (SDP) offers and ICE candidates. Once the connection is established, the server steps back, and the media streams travel directly between the two browsers, minimizing server load.

---
