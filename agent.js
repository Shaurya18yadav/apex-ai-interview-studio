/**
 * agent.js - AI Technical Interview Agent Core Engine
 * Build the interviewer, not the interview.
 */

const fs = require('fs');
const path = require('path');

// Load Data
const curriculumPath = path.join(__dirname, 'curriculum.json');
const candidatesPath = path.join(__dirname, 'candidates.json');

function loadData() {
  const curriculumRaw = fs.readFileSync(curriculumPath, 'utf-8');
  const candidatesRaw = fs.readFileSync(candidatesPath, 'utf-8');
  return {
    curriculumData: JSON.parse(curriculumRaw),
    candidatesData: JSON.parse(candidatesRaw)
  };
}

/**
 * In-memory active interview sessions map
 * Key: session_id
 * Value: Session state object
 */
const sessions = new Map();

/**
 * Call Gemini API using native fetch if GEMINI_API_KEY environment variable is set.
 * Provides fallback smart AI generation if key is unconfigured.
 */
async function callLLM(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null; // Signals fallback engine
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn(`Gemini API returned status ${res.status}. Using agent fallback.`);
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (err) {
    console.error('LLM Call error:', err.message);
    return null;
  }
}

/**
 * Select 4 target curriculum days for candidate based on their completed & skipped missions
 */
function selectTargetDays(candidate, curriculum) {
  const completed = candidate.completed_missions || [];
  const daysList = (curriculum && (curriculum.curriculum || curriculum.curriculum_days)) ? (curriculum.curriculum || curriculum.curriculum_days) : [];
  
  if (!daysList || daysList.length === 0) {
    return [
      { day: 1, title: "LLM Fundamentals & Transformer Architectures", module: "M1", tools: ["Python", "HuggingFace", "PyTorch"], objectives: ["Understand self-attention mechanisms"] },
      { day: 6, title: "Document Processing & Chunking Strategies", module: "M2", tools: ["Unstructured", "PyPDF", "LangChain"], objectives: ["Master semantic chunking"] },
      { day: 11, title: "Advanced RAG: Query Decomposition & HyDE", module: "M3", tools: ["LangChain", "LlamaIndex", "OpenAI"], objectives: ["Implement HyDE"] },
      { day: 16, title: "Agentic AI Concepts & ReAct Framework", module: "M4", tools: ["LangGraph", "CrewAI", "Python"], objectives: ["Build ReAct loop"] }
    ];
  }

  // Available days candidate completed
  const candidateDays = daysList.filter(d => completed.includes(d.day));
  
  if (candidateDays.length < 4) {
    // Fallback to all curriculum days if completed list is small
    return daysList.slice(0, 4);
  }

  // Ensure selection spans distinct modules if possible
  const selected = [];
  const moduleMap = new Map();

  for (const item of candidateDays) {
    if (!moduleMap.has(item.module)) {
      moduleMap.set(item.module, []);
    }
    moduleMap.get(item.module).push(item);
  }

  // Take one day from as many distinct modules as possible
  for (const [modId, items] of moduleMap.entries()) {
    if (selected.length < 4) {
      selected.push(items[0]);
    }
  }

  // Fill up to 4 if necessary
  if (selected.length < 4) {
    for (const item of candidateDays) {
      if (!selected.find(s => s.day === item.day) && selected.length < 4) {
        selected.push(item);
      }
    }
  }

  return selected.length > 0 ? selected.sort((a, b) => a.day - b.day) : daysList.slice(0, 4);
}

/**
 * Start a new interview session
 */
async function startSession(candidateId, persona = 'senior_architect') {
  const { curriculumData, candidatesData } = loadData();
  const candidate = candidatesData.candidates.find(c => c.id === candidateId);
  if (!candidate) {
    throw new Error(`Candidate with ID ${candidateId} not found`);
  }

  let targetDays = selectTargetDays(candidate, curriculumData);
  if (!targetDays || targetDays.length === 0) {
    targetDays = selectTargetDays(candidate, {});
  }

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const currentTopicItem = targetDays[0];

  let personaTitle = "Lead AI Systems Architect";
  if (persona === 'cohort_mentor') personaTitle = "Supportive AI Cohort Lead Mentor";
  if (persona === 'faang_lead') personaTitle = "Senior FAANG AI Engineering Lead Manager";

  // System instructions for initial question
  const systemPrompt = `You are Apex AI, a ${personaTitle} and Technical Interviewer for the Enterprise AI Engineering Cohort.
You are interviewing candidate ${candidate.name} (${candidate.experience_level}).
Target Curriculum Day: Day ${currentTopicItem.day} - ${currentTopicItem.title}.
Module: ${currentTopicItem.module}.
Tools Used: ${currentTopicItem.tools.join(', ')}.
Objectives: ${currentTopicItem.objectives.join('; ')}.

Generate a welcoming yet technically challenging opening question for Day ${currentTopicItem.day}. The question must assess their engineering decisions and architectural understanding. Keep it focused and concise (2-4 sentences max).`;

  let openingQuestion = await callLLM(`Ask opening question for candidate ${candidate.name} on Day ${currentTopicItem.day}.`, systemPrompt);

  if (!openingQuestion) {
    // Intelligent fallback opening question generator
    openingQuestion = `Welcome ${candidate.name}! Let's kick off your technical interview for the AI Engineering Cohort. On Day ${currentTopicItem.day} (${currentTopicItem.title}), you worked with ${currentTopicItem.tools.join(' and ')}. Can you walk me through how you implemented ${currentTopicItem.objectives[0].toLowerCase()} and the key architectural trade-offs you considered?`;
  }

  const session = {
    session_id: sessionId,
    candidate_id: candidate.id,
    candidate_name: candidate.name,
    experience_level: candidate.experience_level,
    persona: persona,
    status: 'in_progress',
    target_days: targetDays,
    current_day_index: 0,
    consecutive_followups: 0,
    questions_asked: [
      {
        question_number: 1,
        curriculum_day: currentTopicItem.day,
        topic: currentTopicItem.title,
        question: openingQuestion,
        is_followup: false,
        candidate_response: null
      }
    ],
    covered_days: [currentTopicItem.day],
    total_questions_asked: 1
  };

  sessions.set(sessionId, session);

  return {
    session_id: session.session_id,
    candidate_id: session.candidate_id,
    candidate_name: session.candidate_name,
    experience_level: session.experience_level,
    status: session.status,
    question_number: 1,
    curriculum_day: currentTopicItem.day,
    topic: currentTopicItem.title,
    question: openingQuestion,
    is_followup: false,
    covered_days: session.covered_days,
    total_questions_asked: session.total_questions_asked
  };
}

/**
 * Process a turn in an ongoing interview session
 */
async function processTurn(sessionId, candidateResponse) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ID ${sessionId} not found`);
  }

  if (session.status === 'completed') {
    return {
      session_id: session.session_id,
      status: 'completed',
      total_questions_asked: session.total_questions_asked,
      covered_days: session.covered_days,
      feedback: session.feedback
    };
  }

  // Save response for current turn
  const lastTurnIndex = session.questions_asked.length - 1;
  session.questions_asked[lastTurnIndex].candidate_response = candidateResponse;

  const currentDayItem = session.target_days[session.current_day_index];

  // Analyze answer quality & decide if follow-up is needed
  const wordCount = candidateResponse.trim().split(/\s+/).length;
  const isShortOrVague = wordCount < 25;
  const canFollowUp = session.consecutive_followups < 1;

  // Decide if we should do a follow up or move to next topic/day
  let shouldFollowUp = isShortOrVague && canFollowUp;

  // If candidate gives a moderate answer, check for follow-up randomly or via LLM heuristic
  if (!shouldFollowUp && canFollowUp && session.total_questions_asked < 6) {
    shouldFollowUp = candidateResponse.toLowerCase().includes('depend') || 
                     candidateResponse.toLowerCase().includes('trade-off') ||
                     candidateResponse.toLowerCase().includes('used') ||
                     candidateResponse.length < 180;
  }

  let nextQuestion = '';
  let nextDayItem = currentDayItem;
  let isFollowUpTurn = false;

  // If minimum 8 questions asked and we covered at least 4 days, we can complete!
  const hasCoveredMinDays = session.covered_days.length >= 4;
  const hasReachedMinQuestions = session.total_questions_asked >= 8;

  if (hasReachedMinQuestions && hasCoveredMinDays && !shouldFollowUp) {
    // Finish Interview & Synthesize Feedback
    session.status = 'completed';
    const feedback = await generateFeedback(session);
    session.feedback = feedback;

    return {
      session_id: session.session_id,
      status: 'completed',
      total_questions_asked: session.total_questions_asked,
      covered_days: session.covered_days,
      feedback: feedback
    };
  }

  let personaTitle = "Lead AI Systems Architect";
  let toneStyle = "Evaluate candidate strictly on system architecture, trade-offs, and conceptual depth.";
  if (session.persona === 'cohort_mentor') {
    personaTitle = "Supportive AI Cohort Lead Mentor";
    toneStyle = "Provide an encouraging, supportive, and educational tone while probing technical depth.";
  } else if (session.persona === 'faang_lead') {
    personaTitle = "Senior FAANG AI Engineering Lead Manager";
    toneStyle = "Probe with high urgency on production latency benchmarks, scale trade-offs, and failure edge cases.";
  }

  if (shouldFollowUp) {
    // Generate Follow-up Question on SAME day
    session.consecutive_followups += 1;
    isFollowUpTurn = true;
    nextDayItem = currentDayItem;

    const systemPrompt = `You are Apex AI, a ${personaTitle} conducting a realistic technical interview with candidate ${session.candidate_name}. Tone instruction: ${toneStyle}

Previous Question: "${session.questions_asked[lastTurnIndex].question}"
Candidate Answer: "${candidateResponse}"
Current Topic: Day ${currentDayItem.day} - ${currentDayItem.title} (Tools: ${currentDayItem.tools.join(', ')}).

Instructions:
1. Evaluate their answer naturally in 1-2 sentences matching your persona (${personaTitle}):
   - If their answer is WRONG or incorrect, politely point out the specific technical misconception or mistake.
   - If their answer is CORRECT and detailed, acknowledge their specific technical insight.
   - If their answer is VAGUE or short, state what key detail was missing.
2. Ask an intelligent follow-up question probing deeper into Day ${currentDayItem.day} (${currentDayItem.title}). Keep it natural and direct.`;

    const llmResult = await callLLM(`Evaluate answer and ask follow-up for: ${candidateResponse}`, systemPrompt);

    if (llmResult) {
      nextQuestion = llmResult;
    } else {
      let evalPrefix = '';
      if (session.persona === 'cohort_mentor') {
        evalPrefix = `Great effort! On Day ${currentDayItem.day} (${currentDayItem.title}), let's expand on your initial thought. `;
      } else if (session.persona === 'faang_lead') {
        evalPrefix = `At FAANG scale, that answer lacks production latency details for Day ${currentDayItem.day}. `;
      } else {
        if (wordCount < 15) {
          evalPrefix = `That response is quite brief and misses key architectural details. For Day ${currentDayItem.day} (${currentDayItem.title}), mastering ${currentDayItem.objectives[0].toLowerCase()} requires deeper consideration. `;
        } else if (candidateResponse.toLowerCase().includes('wrong') || candidateResponse.toLowerCase().includes('don\'t know') || candidateResponse.toLowerCase().includes('not sure')) {
          evalPrefix = `Thanks for your honesty. On Day ${currentDayItem.day} (${currentDayItem.title}), it's common to run into edge cases with ${currentDayItem.tools[0]}. `;
        } else {
          evalPrefix = `Good explanation regarding your approach to ${currentDayItem.title}! `;
        }
      }

      nextQuestion = `${evalPrefix}To probe further into Day ${currentDayItem.day}: what specific challenges did you encounter when configuring ${currentDayItem.tools[0]} for production, and how did you validate your system's performance?`;
    }

  } else {
    // Advance to Next Curriculum Day
    session.consecutive_followups = 0;
    isFollowUpTurn = false;

    // Advance index in target_days
    session.current_day_index = (session.current_day_index + 1) % session.target_days.length;
    nextDayItem = session.target_days[session.current_day_index];

    if (!session.covered_days.includes(nextDayItem.day)) {
      session.covered_days.push(nextDayItem.day);
    }

    const systemPrompt = `You are Apex AI, a ${personaTitle} conducting a realistic interview with ${session.candidate_name}. Tone instruction: ${toneStyle}

Previous Question: "${session.questions_asked[lastTurnIndex].question}"
Candidate Answer: "${candidateResponse}"
New Topic: Day ${nextDayItem.day} - ${nextDayItem.title} (Tools: ${nextDayItem.tools.join(', ')}).

Instructions:
1. Provide 1-2 sentences evaluating their previous answer:
   - If WRONG/INCORRECT, politely correct the misconception.
   - If CORRECT, validate their technical point.
   - If VAGUE, mention what detail was missing.
2. Smoothly transition and ask a new technical question testing their understanding of Day ${nextDayItem.day}: ${nextDayItem.title}.`;

    const llmResult = await callLLM(`Evaluate previous answer and ask question for Day ${nextDayItem.day}`, systemPrompt);

    if (llmResult) {
      nextQuestion = llmResult;
    } else {
      let evalPrefix = '';
      if (wordCount < 20) {
        evalPrefix = `I noted your response on the previous topic was a bit concise. `;
      } else {
        evalPrefix = `Solid technical breakdown on that topic! `;
      }

      nextQuestion = `${evalPrefix}Now let's transition to Day ${nextDayItem.day} (${nextDayItem.title}). In this mission, you worked with ${nextDayItem.tools.join(' and ')}. How did you implement ${nextDayItem.objectives[0].toLowerCase()}, and what key engineering decisions were critical to your pipeline's success?`;
    }
  }

  session.total_questions_asked += 1;
  const newQuestionObj = {
    question_number: session.total_questions_asked,
    curriculum_day: nextDayItem.day,
    topic: nextDayItem.title,
    question: nextQuestion,
    is_followup: isFollowUpTurn,
    candidate_response: null
  };

  session.questions_asked.push(newQuestionObj);

  return {
    session_id: session.session_id,
    status: 'in_progress',
    next_question: newQuestionObj,
    question_number: session.total_questions_asked,
    curriculum_day: nextDayItem.day,
    topic: nextDayItem.title,
    question: nextQuestion,
    is_followup: isFollowUpTurn,
    covered_days: session.covered_days,
    total_questions_asked: session.total_questions_asked,
    feedback: null
  };
}

/**
 * Generate structured feedback evaluation for completed session
 */
async function generateFeedback(session) {
  const transcriptSummary = session.questions_asked.map(q => 
    `Q${q.question_number} [Day ${q.curriculum_day} - ${q.topic}] (FollowUp: ${q.is_followup}):\nQuestion: ${q.question}\nAnswer: ${q.candidate_response || 'No answer provided'}`
  ).join('\n\n');

  const systemPrompt = `You are Apex AI Senior Hiring Director evaluating candidate ${session.candidate_name} (${session.experience_level}).
Transcript:
${transcriptSummary}

SCORING RULES (MANDATORY):
- 10% Base Participation Score for actively completing the multi-turn technical interview.
- 90% Score allocated strictly to the ratio of CORRECT technical concept answers vs INCORRECT/MISSING answers.
- If candidate answered 0 questions correctly, overall_score MUST be 10%.
- If candidate answered all questions correctly, overall_score MUST be 100%.

Produce a JSON response with EXACTLY this structure:
{
  "overall_score": 90,
  "hiring_recommendation": "Strong Hire",
  "summary": "Multi-sentence conceptual evaluation summary...",
  "rubric_scores": {
    "technical_accuracy": 90,
    "system_design_depth": 88,
    "communication_clarity": 90,
    "tool_mastery": 89
  },
  "key_strengths": ["Strength 1 based on correct answers", "Strength 2"],
  "growth_areas": ["Area 1 based on incorrect answers", "Area 2"],
  "day_breakdown": [
    {
      "day": 5,
      "topic": "Topic Name",
      "performance": "Excellent",
      "notes": "Evaluation note..."
    }
  ]
}`;

  const llmResult = await callLLM('Generate interview evaluation JSON', systemPrompt);
  let feedbackObj = null;

  if (llmResult) {
    try {
      const cleanedText = llmResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      if (parsed && typeof parsed === 'object' && parsed.rubric_scores && parsed.day_breakdown) {
        feedbackObj = parsed;
      }
    } catch (e) {
      console.warn('Failed to parse LLM JSON feedback, using dynamic ratio evaluator');
    }
  }

  if (!feedbackObj) {
    // Dynamic Ratio Evaluator: 10% Participation + (Correct / Total * 90%)
    const conceptKeywords = [
      'cosine', 'dot', 'euclidean', 'l2', 'unit length', 'normalized', 'embedding', 'vector',
      'bm25', 'rrf', 'reciprocal rank', 'hybrid', 'sparse', 'dense', 'qdrant', 'chroma', 'cross-encoder',
      'langgraph', 'react', 'agent', 'state', 'nodes', 'edges', 'persistence', 'mcp', 'json-rpc',
      'stdio', 'sse', 'pydantic', 'fastapi', 'async', 'docker', 'multistage', 'vllm', 'ollama',
      'guardrails', 'nemo', 'kubernetes', 'opentelemetry', 'ragas', 'precision', 'recall', 'hyde'
    ];

    let totalAnsweredQuestions = 0;
    let totalCorrectQuestions = 0;

    const strengths = [];
    const growthAreas = [];

    const dayBreakdown = session.covered_days.map(d => {
      const questionsOnDay = session.questions_asked.filter(q => q.curriculum_day === d);
      const firstQ = questionsOnDay[0];
      const topicName = firstQ ? firstQ.topic : `Day ${d}`;

      let dayCorrectCount = 0;
      let dayTotalCount = 0;

      questionsOnDay.forEach(q => {
        if (q.candidate_response) {
          dayTotalCount++;
          totalAnsweredQuestions++;

          const lower = q.candidate_response.toLowerCase().trim();
          const isBlankOrUnsure = lower.length < 12 || 
                                 lower.includes('don\'t know') || 
                                 lower.includes('no idea') || 
                                 lower.includes('not sure') || 
                                 lower.includes('wrong');

          const hasConcept = conceptKeywords.some(k => lower.includes(k)) || 
                             lower.includes('because') || 
                             lower.includes('trade-off') || 
                             lower.includes('mechanic');

          if (!isBlankOrUnsure && hasConcept) {
            dayCorrectCount++;
            totalCorrectQuestions++;
          }
        }
      });

      let perf = 'Needs Depth';
      let notes = `Missed or provided incorrect technical responses for ${topicName}.`;

      if (dayTotalCount > 0 && dayCorrectCount === dayTotalCount) {
        perf = 'Excellent';
        notes = `Accurately answered technical concepts and trade-offs for ${topicName}.`;
        strengths.push(`Precise conceptual correctness on Day ${d} (${topicName})`);
      } else if (dayCorrectCount > 0) {
        perf = 'Good';
        notes = `Answered some questions correctly for ${topicName}; partial conceptual clarity.`;
        strengths.push(`Good conceptual grasp of Day ${d} (${topicName})`);
      } else {
        perf = 'Needs Depth';
        notes = `Incorrect or missing technical responses for ${topicName}.`;
        growthAreas.push(`Review core concepts and technical mechanics for Day ${d} (${topicName})`);
      }

      return {
        day: d,
        topic: topicName,
        performance: perf,
        notes: notes
      };
    });

    // Mathematical Percentage Ratio Formula:
    // 10% Base Participation for completing multi-turn interview
    // 90% Allocated strictly based on (Correct Answers / Total Answered)
    const participationBase = 10;
    const correctnessRatio = totalAnsweredQuestions > 0 ? (totalCorrectQuestions / totalAnsweredQuestions) : 0;
    const correctnessPoints = Math.round(correctnessRatio * 90);

    const calculatedOverallScore = Math.min(100, Math.max(10, participationBase + correctnessPoints));

    let hiringVerdict = 'Needs Practice';
    let execSummary = '';

    if (calculatedOverallScore >= 85) {
      hiringVerdict = 'Strong Hire';
      execSummary = `${session.candidate_name} achieved a ${calculatedOverallScore}% score (${totalCorrectQuestions}/${totalAnsweredQuestions} questions correct). Demonstrated high technical accuracy and precise concept mastery across cohort topics.`;
    } else if (calculatedOverallScore >= 70) {
      hiringVerdict = 'Hire';
      execSummary = `${session.candidate_name} achieved a ${calculatedOverallScore}% score (${totalCorrectQuestions}/${totalAnsweredQuestions} questions correct). Demonstrated solid conceptual understanding across most cohort topics.`;
    } else if (calculatedOverallScore >= 50) {
      hiringVerdict = 'Hire with Reservations';
      execSummary = `${session.candidate_name} achieved a ${calculatedOverallScore}% score (${totalCorrectQuestions}/${totalAnsweredQuestions} questions correct). Showed partial conceptual understanding with several incorrect or surface-level answers.`;
    } else {
      hiringVerdict = 'Needs Practice';
      execSummary = `${session.candidate_name} achieved a ${calculatedOverallScore}% score (${totalCorrectQuestions}/${totalAnsweredQuestions} questions correct). Answered very few technical questions correctly and needs further practice on cohort mechanics.`;
    }

    if (strengths.length === 0) {
      strengths.push('Engaged actively throughout the multi-turn technical interview process (10% participation score awarded)');
    }
    if (growthAreas.length === 0) {
      growthAreas.push('Review advanced production telemetry with OpenTelemetry and Kubernetes (Day 30)');
    }

    feedbackObj = {
      overall_score: calculatedOverallScore,
      hiring_recommendation: hiringVerdict,
      summary: execSummary,
      rubric_scores: {
        technical_accuracy: Math.min(100, calculatedOverallScore),
        system_design_depth: Math.min(100, Math.max(10, calculatedOverallScore - 2)),
        communication_clarity: Math.min(100, calculatedOverallScore),
        tool_mastery: Math.min(100, Math.max(10, calculatedOverallScore - 1))
      },
      key_strengths: strengths.slice(0, 3),
      growth_areas: growthAreas.slice(0, 3),
      day_breakdown: dayBreakdown
    };
  }

  return feedbackObj;
}

/**
 * Get session transcript & status
 */
function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function updateSessionPersona(sessionId, persona) {
  const session = sessions.get(sessionId);
  if (session) {
    session.persona = persona;
    return true;
  }
  return false;
}

module.exports = {
  loadData,
  startSession,
  processTurn,
  getSession,
  updateSessionPersona,
  generateFeedback
};
