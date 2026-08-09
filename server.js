/**
 * server.js - Express API Server for AI Interview Agent
 * Build the interviewer, not the interview.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const agent = require('./agent');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. GET /api/candidates
app.get('/api/candidates', (req, res) => {
  try {
    const { candidatesData } = agent.loadData();
    res.json(candidatesData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load candidates data', message: err.message });
  }
});

// 2. GET /api/curriculum
app.get('/api/curriculum', (req, res) => {
  try {
    const { curriculumData } = agent.loadData();
    res.json(curriculumData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load curriculum data', message: err.message });
  }
});

// 3. POST /api/interview/start
app.post('/api/interview/start', async (req, res) => {
  try {
    const { candidate_id, persona } = req.body;
    if (!candidate_id) {
      return res.status(400).json({ error: 'candidate_id is required' });
    }

    const sessionData = await agent.startSession(candidate_id, persona || 'senior_architect');
    res.json(sessionData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to start interview session', message: err.message });
  }
});

// 3.1 POST /api/interview/persona (Update active session persona live)
app.post('/api/interview/persona', (req, res) => {
  try {
    const { session_id, persona } = req.body;
    if (!session_id || !persona) {
      return res.status(400).json({ error: 'session_id and persona are required' });
    }
    const updated = agent.updateSessionPersona(session_id, persona);
    res.json({ success: updated, persona });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update session persona', message: err.message });
  }
});

// 3.5. POST /api/candidates (Add New Candidate Profile)
app.post('/api/candidates', async (req, res) => {
  try {
    const { name, experience_level, completed_missions, skipped_topics, strongest_topics } = req.body;
    if (!name || !experience_level) {
      return res.status(400).json({ error: 'name and experience_level are required' });
    }

    const candidatesPath = path.join(__dirname, 'candidates.json');
    const rawData = fs.readFileSync(candidatesPath, 'utf-8');
    const data = JSON.parse(rawData);

    const newId = `cand_${String((data.candidates || []).length + 1).padStart(3, '0')}`;
    const newCandidate = {
      id: newId,
      name,
      experience_level,
      completed_missions: Array.isArray(completed_missions) ? completed_missions : [1, 2, 6, 11, 16, 21],
      skipped_topics: Array.isArray(skipped_topics) ? skipped_topics : [],
      learning_signals: {
        strongest_topics: Array.isArray(strongest_topics) ? strongest_topics : ["LLM Architecture", "RAG Systems"],
        areas_for_growth: ["Production Telemetry"]
      }
    };

    data.candidates.push(newCandidate);
    fs.writeFileSync(candidatesPath, JSON.stringify(data, null, 2));

    res.json({ message: 'Candidate created successfully', candidate: newCandidate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create candidate profile', message: err.message });
  }
});

// 4. POST /api/interview/turn
app.post('/api/interview/turn', async (req, res) => {
  try {
    const { session_id, candidate_response } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }
    if (typeof candidate_response !== 'string') {
      return res.status(400).json({ error: 'candidate_response string is required' });
    }

    const turnData = await agent.processTurn(session_id, candidate_response);
    res.json(turnData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process interview turn', message: err.message });
  }
});

// 5. POST /api/interview/finish
app.post('/api/interview/finish', async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const session = agent.getSession(session_id);
    if (!session) {
      return res.status(404).json({ error: `Session ${session_id} not found` });
    }

    if (session.status !== 'completed') {
      session.status = 'completed';
      const feedback = await agent.generateFeedback(session);
      session.feedback = feedback;
    }

    res.json({
      session_id: session.session_id,
      status: 'completed',
      total_questions_asked: session.total_questions_asked,
      covered_days: session.covered_days,
      feedback: session.feedback
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to finish interview session', message: err.message });
  }
});

// 5.5. POST /api/interview/disqualify (Disqualify Candidate for Cheating)
app.post('/api/interview/disqualify', async (req, res) => {
  try {
    const { session_id, reason, violations } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const session = agent.getSession(session_id);
    if (!session) {
      return res.status(404).json({ error: `Session ${session_id} not found` });
    }

    session.status = 'disqualified';
    session.disqualification_reason = reason || 'Cheating / Digital Device Violation';
    session.feedback = {
      overall_score: 0,
      hiring_recommendation: 'DISQUALIFIED',
      summary: `⛔ CANDIDATE DISQUALIFIED: ${reason || 'Detected multiple cheating violations during live proctoring (tab switching / external digital device usage).'}.`,
      rubric_scores: {
        technical_accuracy: 0,
        system_design_depth: 0,
        communication_clarity: 0,
        tool_mastery: 0
      },
      key_strengths: [],
      growth_areas: ['Academic Integrity & Anti-Cheat Policy Violation'],
      day_breakdown: []
    };

    // Update candidates.json
    try {
      const candidatesPath = path.join(__dirname, 'candidates.json');
      const rawData = fs.readFileSync(candidatesPath, 'utf-8');
      const data = JSON.parse(rawData);
      const cand = data.candidates.find(c => c.id === session.candidate_id);
      if (cand) {
        cand.status = 'Disqualified';
        cand.cheating_violations = violations || 3;
        fs.writeFileSync(candidatesPath, JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.error('Failed to update candidate record:', e.message);
    }

    res.json({
      session_id: session.session_id,
      status: 'disqualified',
      feedback: session.feedback
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disqualify session', message: err.message });
  }
});
app.get('/api/interview/session/:session_id', (req, res) => {
  try {
    const { session_id } = req.params;
    const session = agent.getSession(session_id);
    if (!session) {
      return res.status(404).json({ error: `Session ${session_id} not found` });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session', message: err.message });
  }
});

// 6. DELETE /api/candidates/:id (Delete Candidate from Database)
app.delete('/api/candidates/:id', (req, res) => {
  try {
    const { id } = req.params;
    let candidates = agent.getCandidates();
    const existingCandidate = candidates.find(c => c.id === id);

    if (!existingCandidate) {
      return res.status(404).json({ error: `Candidate ${id} not found` });
    }

    candidates = candidates.filter(c => c.id !== id);
    const candidatesPath = path.join(__dirname, 'candidates.json');
    fs.writeFileSync(candidatesPath, JSON.stringify(candidates, null, 2));
    agent.loadData();

    res.json({
      success: true,
      message: `Candidate ${existingCandidate.name} (${id}) deleted successfully`,
      deleted_id: id,
      remaining_count: candidates.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete candidate', message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 AI Technical Interview Agent Server Running!`);
  console.log(`🌐 Web UI: http://localhost:${PORT}`);
  console.log(`📡 API Specs: http://localhost:${PORT}/api/candidates`);
  console.log(`====================================================`);
});
