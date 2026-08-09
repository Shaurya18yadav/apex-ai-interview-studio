# Technical Specification - AI Interview Agent API Contract

## Overview
This specification details the REST API contract and behavioral specification for **The Interview Agent** hackathon project. The AI Interview Agent conducts personalized, multi-turn technical interviews for candidates of the 31-Day AI Engineering Cohort.

---

## Key Requirements & Enforcement Rules

1. **Conversational Experience**: Real-time, multi-turn dialogue with adaptive phrasing.
2. **Minimum Question Threshold**: The agent MUST ask at least **8 technical questions** per interview session.
3. **Curriculum Coverage**: Questions MUST cover at least **4 distinct curriculum days** selected from the candidate's completed missions.
4. **Adaptive Follow-Up Generation**: The agent MUST inspect the candidate's response and dynamically ask follow-up questions if:
   - The response lacks technical depth (e.g., misses key algorithms, tools, or architectural trade-offs).
   - The response is incomplete or vague.
   - The candidate mentions a specific trade-off that warrants deeper technical probing.
5. **Contextual Memory**: Full state retention across turns (conversation transcript, covered topics, candidate strengths/weaknesses).
6. **Structured Evaluation & Feedback**: Upon interview completion, produce a comprehensive evaluation containing rubric scores, candidate strengths, growth areas, and hiring recommendation.

---

## API Endpoints Contract

### 1. `POST /api/interview/start`
Starts a new interview session for a selected candidate.

#### Request Body
```json
{
  "candidate_id": "cand_001"
}
```

#### Response Body (`200 OK`)
```json
{
  "session_id": "sess_9823f4a1-89bc-4a02",
  "candidate_id": "cand_001",
  "candidate_name": "Alex Chen",
  "experience_level": "Mid-Level AI Engineer",
  "status": "in_progress",
  "question_number": 1,
  "curriculum_day": 5,
  "topic": "Vector Embeddings & Cosine Similarity",
  "question": "Welcome Alex! Let's kick off your technical interview. On Day 5 of the cohort, you explored vector embeddings and similarity search algorithms. Can you explain how cosine similarity differs from dot product and Euclidean distance when querying high-dimensional dense embeddings?",
  "is_followup": false,
  "covered_days": [5],
  "total_questions_asked": 1
}
```

---

### 2. `POST /api/interview/turn`
Processes candidate response, updates interview memory, and returns the next question or completion signal.

#### Request Body
```json
{
  "session_id": "sess_9823f4a1-89bc-4a02",
  "candidate_response": "Cosine similarity measures the angle between vectors normalized to unit length, while dot product also takes vector magnitude into account. Euclidean distance measures straight-line distance."
}
```

#### Response Body (`200 OK` - Interview In Progress)
```json
{
  "session_id": "sess_9823f4a1-89bc-4a02",
  "status": "in_progress",
  "question_number": 2,
  "curriculum_day": 5,
  "topic": "Vector Embeddings & Cosine Similarity",
  "question": "Good explanation! To follow up: when normalized embeddings are used, what is the exact mathematical relationship between cosine similarity and Euclidean distance, and why does this matter for vector DB query performance?",
  "is_followup": true,
  "covered_days": [5],
  "total_questions_asked": 2,
  "feedback": null
}
```

#### Response Body (`200 OK` - Interview Completed after 8+ Questions)
```json
{
  "session_id": "sess_9823f4a1-89bc-4a02",
  "status": "completed",
  "total_questions_asked": 9,
  "covered_days": [5, 9, 18, 22],
  "feedback": {
    "overall_score": 92,
    "hiring_recommendation": "Strong Hire",
    "summary": "Alex demonstrated exceptional practical understanding of Hybrid Search (Day 9), Multi-Agent State Graphs (Day 18), and MCP Server implementation (Day 22). Expressed deep architectural nuance on vector normalization.",
    "rubric_scores": {
      "technical_accuracy": 94,
      "system_design_depth": 90,
      "communication_clarity": 92,
      "tool_mastery": 92
    },
    "key_strengths": [
      "Deep understanding of Dense vs Sparse retrieval and Reciprocal Rank Fusion",
      "Proficient in constructing stateful multi-agent workflows using LangGraph",
      "Hands-on experience developing custom MCP tool interfaces"
    ],
    "growth_areas": [
      "Could deepen understanding of Neo4j GraphRAG multi-hop querying (Day 13)",
      "Production Kubernetes telemetry and pod autoscaling deployment (Day 30)"
    ],
    "day_breakdown": [
      {
        "day": 5,
        "topic": "Vector Embeddings & Cosine Similarity",
        "performance": "Excellent",
        "notes": "Answered vector geometry questions accurately including follow-up."
      },
      {
        "day": 9,
        "topic": "Hybrid Search: Combining Sparse (BM25) & Dense Retrieval",
        "performance": "Excellent",
        "notes": "Explained Reciprocal Rank Fusion (RRF) formula clearly."
      },
      {
        "day": 18,
        "topic": "Multi-Agent Collaboration Frameworks",
        "performance": "Good",
        "notes": "Demonstrated solid understanding of LangGraph state transitions."
      },
      {
        "day": 22,
        "topic": "Building Custom MCP Servers",
        "performance": "Excellent",
        "notes": "Detailed tool JSON schemas and async transport execution."
      }
    ]
  }
}
```

---

### 3. `GET /api/candidates`
Returns candidate profiles from `candidates.json`.

---

### 4. `GET /api/curriculum`
Returns cohort curriculum from `curriculum.json`.

---

### 5. `GET /api/interview/session/:session_id`
Retrieves current session transcript and status.
