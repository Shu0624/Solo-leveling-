# 🚀 LevelUp

**The AI-Powered Career Operating System for India's Next 100 Million Engineers**

Welcome to LevelUp! We built this platform with one simple mission in mind: to bridge the massive gap between what engineering students learn in college and what the tech industry actually expects them to know. 

Instead of jumping between disconnected YouTube tutorials, expensive coaching programs, and random mock interview websites, LevelUp gives you a single, unified place to master your craft and get job-ready.

---

## 🌟 Why Does This Exist?

Every year, millions of students graduate with an engineering degree, but only a small fraction feel truly confident walking into a technical interview. We wanted to fix that. 

LevelUp is designed to act as your **personal AI career coach**. It tracks how you study, scores your resume like a real recruiter does, grills you in technical mock interviews just like FAANG engineers would, and gives your college faculty the real-time data they need to support you.

---

## ✨ Features That Feel Like Magic

- **🤖 AI Resume Analyzer:** Upload your PDF resume, and our AI (powered by Groq & LLaMA 3.3 70B) will rip it apart and rebuild it. It scores you across 5 dimensions and gives you literal rewrite suggestions to beat ATS filters.
- **🎙️ Voice-Enabled AI Mock Interviews:** Practice technical and behavioral interviews in real-time. Pick a domain (Java, Python, DSA, System Design, etc.), turn on your mic, and practice answering out loud while the AI gives you instant feedback on your keywords and communication.
- **🗺️ Dynamic Career Roadmaps:** Stop guessing what to study. Tell us your target role, your current experience level, and your highly specific goals, and we'll generate a day-by-day, phase-by-phase learning plan just for you.
- **⏱️ Automated Study Analytics:** The moment you log into the platform, we start tracking your productivity. Jump into a learning module, take a quiz, or use the timer—your dashboard will organize everything into beautiful charts so you can visually see your progress and streaks.
- **👩‍🏫 Elite Faculty Dashboards:** Teachers and HODs have access to a powerful "Ask AI" dashboard. They can literally type *"Who are my top 5 at-risk students this week?"* and the system will pull live data, render charts, and show them exactly who needs help.
- **🏛️ Department Console:** The HOD view of a whole department — every CSE student's marks, subject-wise attendance against the 75% examination requirement, pending arrears, and placement eligibility, in one register you can filter and sort. Everything on screen exports to Excel, and the same workbook uploads back in: you get a row-by-row preview of what would change before anything is written. Cold detail (attendance ledgers, IA rows, old proctor notes) can be archived out to a workbook and pruned from the database, then restored by re-uploading it. See [docs/department-console.md](docs/department-console.md).
- **🎥 P2P Video Rooms:** Want to practice with a real human? Spin up a WebRTC video room instantly and peer-interview your classmates.

---

## 🛠️ The Tech Stack

This platform is a modern, high-performance web app built using:
- **Frontend:** React 18, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (with Mongoose)
- **AI Core:** Groq SDK (LLaMA 3.3 70B) + Local Heuristic Fallbacks 
- **Real-Time:** WebRTC (Peer-to-Peer video) & Web Speech API

---

## 🚀 Getting Started Locally

Want to spin this up on your own machine? It’s super easy.

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Shu0624/levelup.git
   cd levelup
   ```

2. **Setup the Backend:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` folder based on `.env.example`. You'll need a MongoDB URI and a Groq API Key.
   Start the backend:
   ```bash
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

4. **Open your browser!** 
   Head over to `http://localhost:5173` and start leveling up!

---

## ⚡ 1-Click Vercel Deployment

Deploying LevelUp to Vercel takes less than 2 minutes:
1. Push your code to GitHub and import the repository into [Vercel](https://vercel.com/new).
2. Set Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure 64+ char random string.
   - `GROQ_API_KEY`: Your Groq API key (optional for AI coaching).
3. Hit **Deploy**! Vercel will automatically build the client and host serverless API endpoints at `/api/*`.
4. Check out [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment details and persistent WebSocket options.

---

## ❤️ Built For You
LevelUp isn't just an app; it's a movement to democratize technical education and career preparation. No paywalls, no expensive coaching fees. Just pure, personalized learning. 

*Prepare intelligently. Interview confidently. Build your future.*
