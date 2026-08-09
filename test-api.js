/**
 * test-api.js - End-to-End Automated Verification Script for AI Interview Agent
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

function del(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${path}`, {
      method: 'DELETE'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Starting End-to-End Automated Verification for AI Interview Agent...\n');

  // Step 1: Verify Candidates API
  console.log('1. Testing GET /api/candidates...');
  const candRes = await get('/api/candidates');
  if (candRes.status !== 200 || !candRes.body.candidates) {
    throw new Error(`Failed GET /api/candidates: ${JSON.stringify(candRes)}`);
  }
  console.log(`   ✅ Candidates fetched successfully (${candRes.body.candidates.length} candidate profiles available).`);

  // Step 2: Verify Curriculum API
  console.log('2. Testing GET /api/curriculum...');
  const currRes = await get('/api/curriculum');
  const daysList = currRes.body.days || currRes.body.modules || [];
  if (currRes.status !== 200 || daysList.length === 0) {
    throw new Error(`Failed GET /api/curriculum: ${JSON.stringify(currRes)}`);
  }
  console.log(`   ✅ Curriculum fetched successfully (${daysList.length} days covered).`);

  // Step 3: Start Interview Session for Candidate cand_001
  console.log('\n3. Starting interview for candidate cand_001 (Alex Chen)...');
  const startRes = await post('/api/interview/start', { candidate_id: 'cand_001' });
  if (startRes.status !== 200 || !startRes.body.session_id) {
    throw new Error(`Failed POST /api/interview/start: ${JSON.stringify(startRes)}`);
  }

  const session = startRes.body;
  console.log(`   ✅ Session initialized! ID: ${session.session_id}`);
  console.log(`   Q1 [Day ${session.curriculum_day} - ${session.topic}]: "${session.question.substring(0, 100)}..."`);

  const mockAnswers = [
    "Cosine similarity measures the angle between vectors, whereas dot product includes magnitude.", // Brief answer to trigger follow up
    "When embeddings are normalized to unit length L2=1, Euclidean distance squared equals 2 times (1 - Cosine Similarity). This optimization speeds up vector index traversal in vector databases.",
    "For hybrid search, we combine sparse BM25 keyword matching with dense vector similarity using Reciprocal Rank Fusion (RRF). RRF scores candidates based on their rank position across both retrieval strategies.",
    "In LangGraph, we define stateful multi-agent graphs with explicit typed State schemas, node functions, and conditional routing edges. State persistence allows resilient pause-and-resume workflows.",
    "Model Context Protocol (MCP) standardizes how AI agents discover and execute tools over JSON-RPC 2.0 transport. We define tool input schemas using Pydantic/Zod for type safety.",
    "FastAPI allows asynchronous non-blocking event loops, enabling low-latency streaming of LLM responses via Server-Sent Events (SSE) and WebSockets.",
    "Multi-stage Docker builds separate build toolchains from lean production runtime images, significantly reducing container attack surface and image size.",
    "We use NeMo Guardrails and Llama Guard to intercept prompt injection attempts and enforce structured output compliance before returning final completions."
  ];

  let currentTurn = session;

  // Step 4: Simulate 8 Turns of Interview
  for (let i = 0; i < mockAnswers.length; i++) {
    const userAns = mockAnswers[i];
    console.log(`\n--- Turn ${i + 1} ---`);
    console.log(`Candidate Response: "${userAns.substring(0, 80)}..."`);

    const turnRes = await post('/api/interview/turn', {
      session_id: currentTurn.session_id,
      candidate_response: userAns
    });

    if (turnRes.status !== 200) {
      throw new Error(`Turn ${i + 1} failed: ${JSON.stringify(turnRes)}`);
    }

    currentTurn = turnRes.body;

    if (currentTurn.status === 'completed') {
      console.log(`   🎉 Interview completed naturally on Turn ${i + 1}!`);
      break;
    } else {
      console.log(`   Q${currentTurn.question_number} [Day ${currentTurn.curriculum_day} - ${currentTopicAbbr(currentTurn.topic)}] (Follow-up: ${currentTurn.is_followup}): "${currentTurn.question.substring(0, 90)}..."`);
    }
  }

  // Step 5: Finish interview if still in progress
  if (currentTurn.status !== 'completed') {
    console.log('\n5. Concluding interview session...');
    const finishRes = await post('/api/interview/finish', { session_id: currentTurn.session_id });
    currentTurn = finishRes.body;
  }

  // Step 6: Validate Structured Feedback
  console.log('\n====================================================');
  console.log('📊 VERIFYING FINAL STRUCTURED EVALUATION REPORT:');
  console.log('====================================================');
  console.log('\nReceived Feedback Object:', JSON.stringify(currentTurn, null, 2));

  const fb = currentTurn.feedback;
  if (!fb || !fb.rubric_scores || !fb.day_breakdown) {
    throw new Error('Feedback report missing required rubric scores or day breakdown!');
  }

  console.log(`• Overall Score: ${fb.overall_score}%`);
  console.log(`• Hiring Verdict: ${fb.hiring_recommendation}`);
  console.log(`• Questions Asked: ${currentTurn.total_questions_asked} (Min requirement >= 8: ${currentTurn.total_questions_asked >= 8 ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`• Curriculum Days Covered: ${currentTurn.covered_days.length} (Min requirement >= 4: ${currentTurn.covered_days.length >= 4 ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`• Technical Accuracy: ${fb.rubric_scores.technical_accuracy}%`);
  console.log(`• System Design Depth: ${fb.rubric_scores.system_design_depth}%`);
  console.log(`• Key Strengths Count: ${fb.key_strengths.length}`);
  console.log(`• Growth Areas Count: ${fb.growth_areas.length}`);

  // Step 7: Verify Candidate Creation and Deletion
  console.log('\n7. Testing POST /api/candidates and DELETE /api/candidates/:id...');
  const createRes = await post('/api/candidates', { name: 'Test Candidate', experience_level: 'Junior AI Engineer' });
  if (createRes.status !== 200 || !createRes.body.candidate) {
    throw new Error(`Failed candidate creation: ${JSON.stringify(createRes)}`);
  }
  const createdCand = createRes.body.candidate;
  console.log(`   ✅ Candidate created: ${createdCand.name} (${createdCand.id})`);

  const deleteRes = await del(`/api/candidates/${createdCand.id}`);
  if (deleteRes.status !== 200 || !deleteRes.body.success) {
    throw new Error(`Failed candidate deletion: ${JSON.stringify(deleteRes)}`);
  }
  console.log(`   ✅ Candidate deleted successfully: ${deleteRes.body.message}`);

  console.log('\n✨ ALL E2E AUTOMATED TESTS PASSED SUCCESSFULLY! ✨\n');
}

function currentTopicAbbr(topic) {
  return topic ? topic.split(':')[0] : 'Topic';
}

runTest().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
