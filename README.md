# 🚀 Apex AI - Enterprise AI Technical Interview Agent Studio

> **An Autonomous, Multi-Turn AI Technical Interviewer & Proctoring Platform built for the 31-Day AI Engineering Cohort.**  
> *Powered by Google Gemini 2.5 Flash API, Express.js, HTML5 Canvas, WebRTC, and Web Speech Synthesis.*

---

## 🌟 Key Features

1. **🤖 Adaptive Multi-Turn AI Technical Interviewer (`agent.js`)**:
   - Dynamic prompt synthesis adapting to candidate experience levels (Junior, Mid-Level, Senior Architect).
   - Adaptive curriculum progression across 31 cohort days (LLM Architectures, RAG, Fine-tuning, LangGraph, MCP, Telemetry, and Guardrails).
   - Evaluates technical concept accuracy, system design depth, communication clarity, and tool mastery.
   - Generates follow-up probes if a candidate's answer lacks technical depth.

2. **🎭 Multi-Persona Switcher**:
   - Switch between **Senior Architect**, **Cohort Mentor**, and **FAANG Lead Manager** live during interview sessions.

3. **💻 Live Code Sandbox**:
   - Code snippet execution environment for testing JavaScript algorithms and inserting code blocks into candidate answers.

4. **🔊 AI Voice Speech Synthesis (Text-to-Speech)**:
   - Reads interview questions aloud using browser speech synthesis with animated voice equalizer bars.

5. **📋 1-Click Code Copy**:
   - Rendered code blocks feature 1-click clipboard copy buttons with visual confirmation.

6. **📹 Live AI Video Proctor & Computer Vision Anti-Cheat Engine**:
   - WebRTC live camera feed + HTML5 Canvas computer vision frame analyzer.
   - Detects head gaze positioning (`Centered` vs `Looking Away`).
   - Detects mobile phones / secondary display screen luminance in video feed (`Device: Mobile Phone Detected! ⚠️`).

7. **🚨 3-Strike Security Sentinel & Disqualification Engine**:
   - Detects tab switching (`visibilitychange`, `window.blur`) and suspicious clipboard pastes.
   - 12-second calibration grace period + 2.5-second focus loss debounce + 15-second mobile phone cooldown.
   - Automated candidate disqualification report generator (`POST /api/interview/disqualify`).

8. **🏆 Assessment Certificate Modal**:
   - SVG radial score gauge ring, rubric breakdown, key strengths, recommended growth areas, and 1-click **Print / Export PDF Certificate**.

---

## 🏗️ Architecture & Project Structure

```
interview-agent/
├── server.js              # Express REST API Server
├── agent.js               # Core Gemini AI State Machine & Rubric Evaluator
├── candidates.json        # Candidate Profiles Database (Disk Persistent)
├── curriculum.json        # 31-Day AI Engineering Cohort Curriculum
├── public/                # Web Studio Frontend Application
│   ├── index.html         # Responsive Studio UI & Modals
│   ├── app.js             # Client Logic, WebRTC, Speech Synthesis & Anti-Cheat
│   └── style.css          # Realistic Enterprise Dark Slate Styling System
├── test-api.js            # Automated End-to-End Test Suite
├── PROMPTS.md             # Official AI Build Verification Log & Prompt Transcript
├── README.md              # Project Documentation & Setup Guide
└── package.json           # Node.js Dependencies & Run Scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Gemini API Key** (Optional): Set `GEMINI_API_KEY` in `.env` file (Fallback heuristics active if key is not provided).

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/interview-agent.git
   cd interview-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in Browser:**
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Automated Verification Testing

To execute the automated end-to-end verification test suite:

```bash
node test-api.js
```

### Verification Criteria Checklist:
- [x] `GET /api/candidates` returns candidate profiles.
- [x] `GET /api/curriculum` returns 31-day curriculum.
- [x] Session initialization (`POST /api/interview/start`).
- [x] Multi-turn interview turn processing (`POST /api/interview/turn`).
- [x] Evaluation report generation (`POST /api/interview/finish`).
- [x] Anti-cheat disqualification handling (`POST /api/interview/disqualify`).

---

## 📜 AI Usage & Vibe-Coding Logs

This repository was genuinely vibe-coded. For complete prompt history, AI agent trajectories, tool execution steps, and verification outputs, view:  
📄 **[PROMPTS.md](PROMPTS.md)**

---

## 📄 License
MIT License © 2026 Apex AI Engineering Cohort.
