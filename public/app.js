/**
 * app.js - Client Application Logic for AI Interview Agent UI with Live CV Proctoring
 */

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const candidateSelect = document.getElementById('candidateSelect');
  const candidateCard = document.getElementById('candidateCard');
  const candidateAvatar = document.getElementById('candidateAvatar');
  const candidateName = document.getElementById('candidateName');
  const candidateLevel = document.getElementById('candidateLevel');
  const completedMissionsCount = document.getElementById('completedMissionsCount');
  const skippedTopicsCount = document.getElementById('skippedTopicsCount');
  const strongTopicsContainer = document.getElementById('strongTopicsContainer');
  const startInterviewBtn = document.getElementById('startInterviewBtn');

  // Compliance metrics
  const metricQuestionsCount = document.getElementById('metricQuestionsCount');
  const questionsProgressBar = document.getElementById('questionsProgressBar');
  const metricDaysCount = document.getElementById('metricDaysCount');
  const daysProgressBar = document.getElementById('daysProgressBar');

  // View Containers & Voice Indicator
  const welcomeScreen = document.getElementById('welcomeScreen');
  const interviewTerminal = document.getElementById('interviewTerminal');
  const chatStream = document.getElementById('chatStream');
  const answerForm = document.getElementById('answerForm');
  const answerInput = document.getElementById('answerInput');
  const sendAnswerBtn = document.getElementById('sendAnswerBtn');
  const endInterviewBtn = document.getElementById('endInterviewBtn');
  const topicBadge = document.getElementById('topicBadge');
  const currentTopicText = document.getElementById('currentTopicText');
  const aiVoiceIndicator = document.getElementById('aiVoiceIndicator');
  const personaLabelText = document.getElementById('personaLabelText');
  const quickChipsBar = document.getElementById('quickChipsBar');

  // Audio TTS Elements
  const ttsToggleBtn = document.getElementById('ttsToggleBtn');
  const ttsBtnLabel = document.getElementById('ttsBtnLabel');
  let ttsEnabled = true;

  // Code Sandbox Tabs
  const textTabBtn = document.getElementById('textTabBtn');
  const codeTabBtn = document.getElementById('codeTabBtn');
  const codeSandboxPanel = document.getElementById('codeSandboxPanel');
  const codeEditorInput = document.getElementById('codeEditorInput');
  const runCodeBtn = document.getElementById('runCodeBtn');
  const sandboxConsoleOutput = document.getElementById('sandboxConsoleOutput');

  // Custom Candidate Modal Elements
  const openAddCandidateBtn = document.getElementById('openAddCandidateBtn');
  const homeAddCandidateBtn = document.getElementById('homeAddCandidateBtn');
  const addCandidateModal = document.getElementById('addCandidateModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const closeCandidateModalBtn = document.getElementById('closeCandidateModalBtn');
  const cancelCandidateModalBtn = document.getElementById('cancelCandidateModalBtn');
  const addCandidateForm = document.getElementById('addCandidateForm');
  const newCandName = document.getElementById('newCandName');
  const newCandLevel = document.getElementById('newCandLevel');
  const newCandTopics = document.getElementById('newCandTopics');

  // Modal / Report Elements
  const evaluationModal = document.getElementById('evaluationModal');
  const reportCandidateName = document.getElementById('reportCandidateName');
  const reportCandidateLevel = document.getElementById('reportCandidateLevel');
  const overallScoreCircle = document.getElementById('overallScoreCircle');
  const gaugeFill = document.getElementById('gaugeFill');
  const hiringRecommendationBadge = document.getElementById('hiringRecommendationBadge');
  const reportSummaryText = document.getElementById('reportSummaryText');
  const scoreAccuracy = document.getElementById('scoreAccuracy');
  const scoreAccuracyVal = document.getElementById('scoreAccuracyVal');
  const scoreDesign = document.getElementById('scoreDesign');
  const scoreDesignVal = document.getElementById('scoreDesignVal');
  const scoreComm = document.getElementById('scoreComm');
  const scoreCommVal = document.getElementById('scoreCommVal');
  const scoreTool = document.getElementById('scoreTool');
  const scoreToolVal = document.getElementById('scoreToolVal');
  const keyStrengthsList = document.getElementById('keyStrengthsList');
  const growthAreasList = document.getElementById('growthAreasList');
  const dayBreakdownTable = document.getElementById('dayBreakdownTable');
  const printCertBtn = document.getElementById('printCertBtn');
  const downloadReportBtn = document.getElementById('downloadReportBtn');
  const restartBtn = document.getElementById('restartBtn');

  // Persona Buttons
  const personaBtns = document.querySelectorAll('.persona-btn');
  let selectedPersona = 'senior_architect';

  // Active State Variables
  let candidates = [];
  let selectedCandidate = null;
  let activeSession = null;
  let lastReportData = null;

  // Live AI Video Proctoring & Anti-Cheat State
  const toggleWebcamBtn = document.getElementById('toggleWebcamBtn');
  const webcamBtnLabel = document.getElementById('webcamBtnLabel');
  const proctorWebcam = document.getElementById('proctorWebcam');
  const proctorSimCanvas = document.getElementById('proctorSimCanvas');
  const proctorGazeStatus = document.getElementById('proctorGazeStatus');
  const proctorDeviceStatus = document.getElementById('proctorDeviceStatus');
  const proctorAlertBanner = document.getElementById('proctorAlertBanner');
  const alertBannerText = document.getElementById('alertBannerText');
  const violationCountNum = document.getElementById('violationCountNum');
  const violationProgressBar = document.getElementById('violationProgressBar');

  let webcamStream = null;
  let violationCount = 0;
  let phoneCheckInterval = null;

  // Computer Vision Frame Analyzer Canvas
  const visionCanvas = document.createElement('canvas');
  const visionCtx = visionCanvas.getContext('2d', { willReadFrequently: true });

  // Fetch Candidates & Init Canvas animations
  fetchCandidates();
  initParticleGlobeAnimation();
  initInteractiveBgBoxes();
  initProctorSimulationCanvas();

  // Audio TTS Toggle Button
  if (ttsToggleBtn) {
    ttsToggleBtn.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      if (ttsEnabled) {
        ttsToggleBtn.classList.add('active');
        if (ttsBtnLabel) ttsBtnLabel.textContent = 'Voice ON';
      } else {
        ttsToggleBtn.classList.remove('active');
        if (ttsBtnLabel) ttsBtnLabel.textContent = 'Voice OFF';
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }
    });
  }

  function speakText(text) {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code snippet provided.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/<[^>]*>/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (aiVoiceIndicator) aiVoiceIndicator.style.opacity = '1';
    };
    utterance.onend = () => {
      if (aiVoiceIndicator) aiVoiceIndicator.style.opacity = '0.85';
    };

    window.speechSynthesis.speak(utterance);
  }

  // Code Block Copy Delegation
  if (chatStream) {
    chatStream.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.code-copy-btn');
      if (!copyBtn) return;
      const codeText = copyBtn.getAttribute('data-code');
      if (codeText) {
        navigator.clipboard.writeText(codeText);
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        }, 2000);
      }
    });
  }

  // Multi-Persona Switcher Handlers
  personaBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      personaBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPersona = btn.getAttribute('data-persona');
      
      let pTitle = "Apex AI Senior Architect";
      if (selectedPersona === 'cohort_mentor') pTitle = "Apex AI Cohort Mentor";
      if (selectedPersona === 'faang_lead') pTitle = "Apex AI FAANG Lead Manager";
      if (personaLabelText) personaLabelText.textContent = pTitle;

      if (activeSession && activeSession.session_id) {
        try {
          await fetch('/api/interview/persona', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: activeSession.session_id, persona: selectedPersona })
          });
        } catch (err) {
          console.error('Failed to sync persona live:', err);
        }
      }
    });
  });

  // Code Sandbox Tab Switching
  if (textTabBtn && codeTabBtn && codeSandboxPanel) {
    textTabBtn.addEventListener('click', () => {
      textTabBtn.classList.add('active');
      codeTabBtn.classList.remove('active');
      codeSandboxPanel.classList.add('hidden');
    });

    codeTabBtn.addEventListener('click', () => {
      codeTabBtn.classList.add('active');
      textTabBtn.classList.remove('active');
      codeSandboxPanel.classList.remove('hidden');
    });

    runCodeBtn.addEventListener('click', () => {
      const code = codeEditorInput.value.trim();
      if (!code) {
        sandboxConsoleOutput.textContent = 'Console: Please enter code to execute.';
        return;
      }

      try {
        let output = '';
        const logs = [];
        const customConsole = { log: (...args) => logs.push(args.join(' ')) };
        const runFn = new Function('console', code);
        runFn(customConsole);

        output = logs.length > 0 ? logs.join('\n') : 'Code executed cleanly with exit code 0.';
        sandboxConsoleOutput.textContent = `Output: ${output}`;

        const codeSnippet = `\n\`\`\`javascript\n${code}\n\`\`\`\n`;
        if (!answerInput.value.includes(code)) {
          answerInput.value += codeSnippet;
        }
      } catch (err) {
        sandboxConsoleOutput.textContent = `Execution Error: ${err.message}`;
      }
    });
  }

  // Candidate Profile Creator Modal Handlers
  const sidebarAddCandidateBtn = document.getElementById('sidebarAddCandidateBtn');

  function openCandidateModal() {
    if (addCandidateModal) {
      addCandidateModal.classList.remove('hidden');
      if (newCandName) newCandName.focus();
    }
  }

  function closeCandidateModal() {
    if (addCandidateModal) {
      addCandidateModal.classList.add('hidden');
    }
  }

  if (openAddCandidateBtn) openAddCandidateBtn.addEventListener('click', openCandidateModal);
  if (homeAddCandidateBtn) homeAddCandidateBtn.addEventListener('click', openCandidateModal);
  if (sidebarAddCandidateBtn) sidebarAddCandidateBtn.addEventListener('click', openCandidateModal);
  if (closeCandidateModalBtn) closeCandidateModalBtn.addEventListener('click', closeCandidateModal);
  if (cancelCandidateModalBtn) cancelCandidateModalBtn.addEventListener('click', closeCandidateModal);

  if (addCandidateForm) {
    addCandidateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = newCandName.value.trim();
      const level = newCandLevel.value;
      const topicsStr = newCandTopics.value.trim();
      const topics = topicsStr ? topicsStr.split(',').map(t => t.trim()) : ["LLM Systems", "Vector Search"];

      if (!name) return;

      try {
        const res = await fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            experience_level: level,
            strongest_topics: topics
          })
        });

        const data = await res.json();
        if (data.error) {
          alert('Failed to create candidate profile: ' + data.error);
          return;
        }

        if (data.candidate) {
          closeCandidateModal();
          newCandName.value = '';
          newCandTopics.value = '';
          await fetchCandidates();
          
          candidateSelect.value = data.candidate.id;
          candidateSelect.dispatchEvent(new Event('change'));
          alert(`✅ Candidate profile for ${data.candidate.name} (${data.candidate.experience_level}) successfully saved to database!`);
        }
      } catch (err) {
        alert('Failed to create candidate profile: ' + err.message);
      }
    });
  }

  if (printCertBtn) {
    printCertBtn.addEventListener('click', () => {
      window.print();
    });
  }

  function initInteractiveBgBoxes() {
    const container = document.getElementById('interactiveBgBoxes');
    if (!container) return;
    const colors = [
      'rgb(125, 211, 252)',
      'rgb(249, 168, 212)',
      'rgb(134, 239, 172)',
      'rgb(253, 224, 71)',
      'rgb(252, 165, 165)',
      'rgb(216, 180, 254)',
      'rgb(147, 197, 253)',
      'rgb(165, 180, 252)'
    ];

    container.innerHTML = '';
    const totalCells = 28 * 18;
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'bg-box-cell';
      cell.addEventListener('mouseenter', () => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        cell.style.backgroundColor = randomColor;
      });
      cell.addEventListener('mouseleave', () => {
        setTimeout(() => {
          cell.style.backgroundColor = 'transparent';
        }, 300);
      });
      container.appendChild(cell);
    }
  }

  function initParticleGlobeAnimation() {
    const canvas = document.getElementById('particleGlobeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = 120;
    const height = 120;
    canvas.width = width;
    canvas.height = height;

    const numParticles = 120;
    const particles = [];
    const radius = 45;

    for (let i = 0; i < numParticles; i++) {
      const phi = Math.acos(-1 + (2 * i) / numParticles);
      const theta = Math.sqrt(numParticles * Math.PI) * phi;

      const colors = ['#6366f1', '#06b6d4', '#a855f7', '#10b981'];
      particles.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        color: colors[i % colors.length]
      });
    }

    let angleX = 0.005;
    let angleY = 0.008;

    function render() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);

        let y1 = p.y * cosX - p.z * sinX;
        let z1 = p.z * cosX + p.y * sinX;

        let x2 = p.x * cosY + z1 * sinY;
        let z2 = z1 * cosY - p.x * sinY;

        p.x = x2;
        p.y = y1;
        p.z = z2;

        const scale = 150 / (150 + p.z);
        const projX = width / 2 + p.x * scale;
        const projY = height / 2 + p.y * scale;
        const alpha = Math.max(0.2, (p.z + radius) / (2 * radius));

        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(1, 2 * scale), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      });

      requestAnimationFrame(render);
    }

    render();
  }

  async function fetchCandidates() {
    try {
      const res = await fetch('/api/candidates');
      const data = await res.json();
      candidates = data.candidates || [];
      populateCandidateSelect(candidates);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    }
  }

  function populateCandidateSelect(candidatesList) {
    candidateSelect.innerHTML = '<option value="" disabled selected>Select candidate profile...</option>';
    candidatesList.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.experience_level})`;
      candidateSelect.appendChild(opt);
    });

    renderHomeCandidateGrid(candidatesList);
  }

  function renderHomeCandidateGrid(candidatesList) {
    const homeCandidateGrid = document.getElementById('homeCandidateGrid');
    if (!homeCandidateGrid) return;
    homeCandidateGrid.innerHTML = '';

    candidatesList.forEach(c => {
      const initials = c.name.split(' ').map(n => n[0]).join('');
      const card = document.createElement('div');
      card.className = 'home-cand-card glass-panel';

      const strongs = (c.learning_signals?.strongest_topics || []).slice(0, 3);
      const tagsHtml = strongs.map(t => `<span class="topic-tag">${t}</span>`).join('');

      card.innerHTML = `
        <div class="home-cand-header">
          <div class="home-avatar">${initials}</div>
          <div class="home-cand-info">
            <h3>${c.name}</h3>
            <span class="home-cand-level">${c.experience_level}</span>
          </div>
        </div>

        <div class="home-cand-stats">
          <div class="home-stat">
            <span class="home-stat-num">${(c.completed_missions || []).length}</span>
            <span class="home-stat-lbl">Missions</span>
          </div>
          <div class="home-stat">
            <span class="home-stat-num">${(c.skipped_topics || []).length}</span>
            <span class="home-stat-lbl">Skipped</span>
          </div>
        </div>

        <div class="tags-wrapper">${tagsHtml}</div>

        <button class="btn btn-primary btn-launch-cand">
          <i class="fa-solid fa-bolt"></i> Select & Start Interview
        </button>
      `;

      card.addEventListener('click', () => {
        candidateSelect.value = c.id;
        candidateSelect.dispatchEvent(new Event('change'));
        startInterviewBtn.click();
      });

      homeCandidateGrid.appendChild(card);
    });
  }

  candidateSelect.addEventListener('change', (e) => {
    const id = e.target.value;
    selectedCandidate = candidates.find(c => c.id === id);

    if (selectedCandidate) {
      const initials = selectedCandidate.name.split(' ').map(n => n[0]).join('');
      candidateAvatar.textContent = initials;
      candidateName.textContent = selectedCandidate.name;
      candidateLevel.textContent = selectedCandidate.experience_level;
      completedMissionsCount.textContent = (selectedCandidate.completed_missions || []).length;
      skippedTopicsCount.textContent = (selectedCandidate.skipped_topics || []).length;

      strongTopicsContainer.innerHTML = '';
      const strongs = selectedCandidate.learning_signals?.strongest_topics || [];
      strongs.forEach(t => {
        const tag = document.createElement('span');
        tag.className = 'topic-tag';
        tag.textContent = t;
        strongTopicsContainer.appendChild(tag);
      });

      candidateCard.classList.remove('hidden');
      startInterviewBtn.disabled = false;
    }
  });

  if (quickChipsBar) {
    quickChipsBar.addEventListener('click', (e) => {
      const chipBtn = e.target.closest('.chip-btn');
      if (!chipBtn) return;
      const textToInsert = chipBtn.getAttribute('data-insert');
      if (textToInsert) {
        if (answerInput.value.trim().length > 0) {
          answerInput.value += ' ' + textToInsert;
        } else {
          answerInput.value = textToInsert;
        }
        answerInput.focus();
      }
    });
  }

  // AUTOMATIC WEBCAM LAUNCH
  async function startWebcamAutomatically() {
    if (webcamStream) return;
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (proctorWebcam) {
        proctorWebcam.srcObject = webcamStream;
        proctorWebcam.classList.remove('hidden');
      }
      if (proctorSimCanvas) proctorSimCanvas.classList.add('hidden');
      if (webcamBtnLabel) webcamBtnLabel.textContent = 'Disable Live Camera';
      if (toggleWebcamBtn) {
        toggleWebcamBtn.classList.add('btn-danger');
        toggleWebcamBtn.classList.remove('btn-secondary');
      }

      startLiveComputerVisionAnalyzer();
    } catch (err) {
      console.warn('Auto webcam stream note:', err.message);
      if (proctorSimCanvas) proctorSimCanvas.classList.remove('hidden');
      if (proctorWebcam) proctorWebcam.classList.add('hidden');
    }
  }

  let lastPhoneViolationTime = 0;

  // Real-time Computer Vision Frame Analyzer for Live Mobile Phone / Secondary Device Detection
  function startLiveComputerVisionAnalyzer() {
    if (phoneCheckInterval) clearInterval(phoneCheckInterval);

    phoneCheckInterval = setInterval(() => {
      if (!activeSession || activeSession.status === 'completed' || activeSession.status === 'disqualified') return;
      if (!proctorWebcam || proctorWebcam.classList.contains('hidden') || !proctorWebcam.videoWidth) return;

      const vw = visionCanvas.width = 160;
      const vh = visionCanvas.height = 120;
      visionCtx.drawImage(proctorWebcam, 0, 0, vw, vh);

      const frameData = visionCtx.getImageData(0, 0, vw, vh);
      const data = frameData.data;

      let brightScreenPixels = 0;
      let totalRegionPixels = 0;
      const startY = Math.floor(vh * 0.30);
      const endY = Math.floor(vh * 0.95);

      for (let y = startY; y < endY; y++) {
        for (let x = 10; x < vw - 10; x++) {
          const idx = (y * vw + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          totalRegionPixels++;
          // Screen luminance & contrast check
          if (luminance > 175 && (Math.abs(r - g) < 50 || b > 150)) {
            brightScreenPixels++;
          }
        }
      }

      const screenRatio = brightScreenPixels / totalRegionPixels;

      if (screenRatio > 0.06) {
        if (proctorDeviceStatus) proctorDeviceStatus.textContent = 'Mobile Phone! ⚠️';
        // Enforce 15-second cooldown per mobile phone event so 1 phone event = 1 violation strike
        if (Date.now() - lastPhoneViolationTime > 15000) {
          lastPhoneViolationTime = Date.now();
          recordCheatingViolation('Mobile Phone / Secondary Digital Device detected in webcam feed');
        }
      } else {
        if (proctorDeviceStatus) proctorDeviceStatus.textContent = 'None';
      }
    }, 1500);
  }

  // Start Interview Button
  startInterviewBtn.addEventListener('click', async () => {
    if (!selectedCandidate) return;

    try {
      startInterviewBtn.disabled = true;
      startInterviewBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Launching AI Proctor & Agent...';

      sessionStartTime = Date.now();
      violationCount = 0;
      if (violationCountNum) violationCountNum.textContent = '0 / 3';
      if (violationProgressBar) violationProgressBar.style.width = '0%';
      if (proctorAlertBanner) proctorAlertBanner.classList.add('hidden');
      if (answerInput) {
        answerInput.disabled = false;
        answerInput.placeholder = 'Type your technical answer here... (Use Markdown or paste code)';
      }
      if (sendAnswerBtn) sendAnswerBtn.disabled = false;

      await startWebcamAutomatically();

      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: selectedCandidate.id, persona: selectedPersona })
      });

      const session = await res.json();
      if (session.error) {
        alert('Error starting interview: ' + session.error + ' (' + (session.message || '') + ')');
        return;
      }
      activeSession = session;

      welcomeScreen.classList.add('hidden');
      interviewTerminal.classList.remove('hidden');
      endInterviewBtn.classList.remove('hidden');
      topicBadge.classList.remove('hidden');
      aiVoiceIndicator.classList.remove('hidden');

      chatStream.innerHTML = '';

      const q1 = session.questions_asked?.[0] || { curriculum_day: session.curriculum_day || 1, topic: session.topic || "Setup", question: session.question || "Welcome!", is_followup: false };
      updateTopicBadge(q1.curriculum_day, q1.topic);
      appendAIMessage(q1.question, q1.is_followup || false, q1.curriculum_day);
      speakText(q1.question);
      updateMetrics(session.total_questions_asked || 1, (session.covered_days || [1]).length);

    } catch (err) {
      alert('Error starting interview session: ' + err.message);
    } finally {
      startInterviewBtn.disabled = false;
      startInterviewBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Technical Interview';
    }
  });

  // Handle Submit Answer Form
  answerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeSession) return;

    const responseText = answerInput.value.trim();
    if (!responseText) return;

    answerInput.value = '';
    sendAnswerBtn.disabled = true;

    appendUserMessage(responseText, selectedCandidate.name);
    const typingIndicatorCard = appendTypingIndicator();

    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession.session_id,
          candidate_response: responseText
        })
      });

      const turnData = await res.json();
      typingIndicatorCard.remove();

      if (turnData.error) {
        alert('Error submitting answer: ' + turnData.error + ' (' + (turnData.message || '') + ')');
        return;
      }

      if (turnData.status === 'completed') {
        renderEvaluationReport(turnData.feedback);
        return;
      }

      const nextQ = turnData.next_question || turnData;
      updateTopicBadge(nextQ.curriculum_day, nextQ.topic);
      appendAIMessage(nextQ.question, nextQ.is_followup || false, nextQ.curriculum_day);
      speakText(nextQ.question);
      updateMetrics(turnData.total_questions_asked || 1, (turnData.covered_days || [1]).length);

    } catch (err) {
      typingIndicatorCard.remove();
      alert('Error submitting answer: ' + err.message);
    } finally {
      sendAnswerBtn.disabled = false;
      answerInput.focus();
    }
  });

  answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      answerForm.dispatchEvent(new Event('submit'));
    }
  });

  endInterviewBtn.addEventListener('click', async () => {
    if (!activeSession) return;
    if (!confirm('Are you sure you want to conclude the interview and generate the assessment report?')) return;

    try {
      endInterviewBtn.disabled = true;
      const res = await fetch('/api/interview/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSession.session_id })
      });

      const data = await res.json();
      renderEvaluationReport(data.feedback);
    } catch (err) {
      alert('Error concluding interview: ' + err.message);
    } finally {
      endInterviewBtn.disabled = false;
    }
  });

  function updateTopicBadge(day, title) {
    currentTopicText.textContent = `Day ${day}: ${title}`;
  }

  function appendAIMessage(text, isFollowup = false, day = null) {
    const card = document.createElement('div');
    card.className = 'message-card message-ai';

    const followupBadge = isFollowup
      ? `<span class="badge-tag badge-followup"><i class="fa-solid fa-magnifying-glass-chart"></i> Follow-up Probe</span>`
      : `<span class="badge-tag"><i class="fa-solid fa-graduation-cap"></i> Day ${day} Topic</span>`;

    let pTitle = "Apex AI Senior Interviewer";
    if (selectedPersona === 'cohort_mentor') pTitle = "Apex AI Cohort Mentor";
    if (selectedPersona === 'faang_lead') pTitle = "Apex AI FAANG Lead Manager";

    card.innerHTML = `
      <div class="avatar-ai"><i class="fa-solid fa-robot"></i></div>
      <div class="message-content">
        <div class="message-meta">
          <span class="meta-speaker">${pTitle}</span>
          ${followupBadge}
        </div>
        <p>${formatMarkdown(text)}</p>
      </div>
    `;

    chatStream.appendChild(card);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function appendUserMessage(text, candidateNameStr) {
    const initials = candidateNameStr.split(' ').map(n => n[0]).join('');
    const card = document.createElement('div');
    card.className = 'message-card message-user';

    card.innerHTML = `
      <div class="avatar-user">${initials}</div>
      <div class="message-content">
        <div class="message-meta">
          <span class="meta-speaker">${candidateNameStr}</span>
          <span class="badge-tag"><i class="fa-solid fa-check"></i> Answer Submitted</span>
        </div>
        <p>${formatMarkdown(text)}</p>
      </div>
    `;

    chatStream.appendChild(card);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function appendWarningChatMessage(warningText) {
    const card = document.createElement('div');
    card.className = 'message-card message-ai';
    card.innerHTML = `
      <div class="avatar-ai" style="background:linear-gradient(135deg, #ef4444, #f59e0b);"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <div class="message-content" style="background:rgba(239, 68, 68, 0.18); border-color:rgba(239, 68, 68, 0.45); color:#fecdd3;">
        <div class="message-meta">
          <span class="meta-speaker" style="color:#f87171;">AI Security Sentinel Alert</span>
          <span class="badge-tag" style="background:rgba(239, 68, 68, 0.3); color:#fff;">Security Violation</span>
        </div>
        <p><b>${warningText}</b></p>
      </div>
    `;

    chatStream.appendChild(card);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function appendTypingIndicator() {
    const card = document.createElement('div');
    card.className = 'message-card message-ai';
    card.innerHTML = `
      <div class="avatar-ai"><i class="fa-solid fa-robot"></i></div>
      <div class="message-content">
        <div class="message-meta">
          <span class="meta-speaker">Apex AI Interviewer</span>
          <span class="badge-tag">Evaluating...</span>
        </div>
        <p><i class="fa-solid fa-circle-notch fa-spin text-cyan"></i> Assessing technical concept correctness & preparing next turn...</p>
      </div>
    `;
    chatStream.appendChild(card);
    chatStream.scrollTop = chatStream.scrollHeight;
    return card;
  }

  function updateMetrics(questionsCount, daysCount) {
    metricQuestionsCount.textContent = `${questionsCount} / 8`;
    const qPct = Math.min(100, (questionsCount / 8) * 100);
    questionsProgressBar.style.width = `${qPct}%`;

    metricDaysCount.textContent = `${daysCount} / 4`;
    const dPct = Math.min(100, (daysCount / 4) * 100);
    daysProgressBar.style.width = `${dPct}%`;
  }

  function renderEvaluationReport(feedback) {
    if (!feedback) return;
    lastReportData = feedback;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (phoneCheckInterval) clearInterval(phoneCheckInterval);

    reportCandidateName.textContent = selectedCandidate.name;
    reportCandidateLevel.textContent = selectedCandidate.experience_level;
    const scoreVal = feedback.overall_score || 0;
    overallScoreCircle.textContent = `${scoreVal}%`;

    const maxLen = 251.2;
    const offset = maxLen - (maxLen * (scoreVal / 100));
    gaugeFill.style.strokeDashoffset = offset;

    let colorHex = '#10b981';
    let badgeClass = 'Strong Hire';
    if (feedback.hiring_recommendation === 'DISQUALIFIED' || scoreVal === 0) {
      colorHex = '#ef4444';
      badgeClass = 'DISQUALIFIED';
    } else if (scoreVal < 50) {
      colorHex = '#f43f5e';
      badgeClass = 'Needs Practice';
    } else if (scoreVal < 70) {
      colorHex = '#f59e0b';
      badgeClass = 'Hire with Reservations';
    } else if (scoreVal < 85) {
      colorHex = '#06b6d4';
      badgeClass = 'Hire';
    }

    gaugeFill.style.stroke = colorHex;
    hiringRecommendationBadge.style.color = colorHex;
    hiringRecommendationBadge.style.borderColor = colorHex;
    hiringRecommendationBadge.style.background = `${colorHex}22`;
    hiringRecommendationBadge.textContent = feedback.hiring_recommendation || badgeClass;

    reportSummaryText.textContent = feedback.summary || '';

    const r = feedback.rubric_scores || {};
    setRubricBar(scoreAccuracy, scoreAccuracyVal, r.technical_accuracy || 0);
    setRubricBar(scoreDesign, scoreDesignVal, r.system_design_depth || 0);
    setRubricBar(scoreComm, scoreCommVal, r.communication_clarity || 0);
    setRubricBar(scoreTool, scoreToolVal, r.tool_mastery || 0);

    keyStrengthsList.innerHTML = '';
    (feedback.key_strengths || []).forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ${s}`;
      keyStrengthsList.appendChild(li);
    });

    growthAreasList.innerHTML = '';
    (feedback.growth_areas || []).forEach(g => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid fa-lightbulb text-amber"></i> ${g}`;
      growthAreasList.appendChild(li);
    });

    dayBreakdownTable.innerHTML = '';
    (feedback.day_breakdown || []).forEach(item => {
      const row = document.createElement('div');
      row.className = 'table-row';
      let perfClass = 'perf-good';
      if (item.performance === 'Excellent') perfClass = 'perf-excellent';
      if (item.performance === 'Needs Depth') perfClass = 'perf-depth';

      row.innerHTML = `
        <span class="row-day">Day ${item.day}</span>
        <div style="flex:1;">
          <div class="row-topic">${item.topic}</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${item.notes || ''}</div>
        </div>
        <span class="row-perf ${perfClass}">${item.performance}</span>
      `;
      dayBreakdownTable.appendChild(row);
    });

    evaluationModal.classList.remove('hidden');
  }

  function setRubricBar(barEl, valEl, score) {
    valEl.textContent = `${score}%`;
    barEl.style.width = `${score}%`;
  }

  closeModalBtn.addEventListener('click', () => {
    evaluationModal.classList.add('hidden');
  });

  restartBtn.addEventListener('click', () => {
    evaluationModal.classList.add('hidden');
    interviewTerminal.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
    endInterviewBtn.classList.add('hidden');
    topicBadge.classList.add('hidden');
    aiVoiceIndicator.classList.add('hidden');
    activeSession = null;
    startInterviewBtn.disabled = false;
    if (answerInput) {
      answerInput.disabled = false;
      answerInput.placeholder = 'Type your technical answer here... (Use Markdown or paste code)';
    }
    if (sendAnswerBtn) sendAnswerBtn.disabled = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (phoneCheckInterval) clearInterval(phoneCheckInterval);
  });

  downloadReportBtn.addEventListener('click', () => {
    if (!lastReportData) return;
    const blob = new Blob([JSON.stringify(lastReportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Report_${selectedCandidate.name.replace(/\s+/g, '_')}.json`;
    a.click();
  });

  // Toggle Camera Manual Button
  if (toggleWebcamBtn) {
    toggleWebcamBtn.addEventListener('click', async () => {
      if (!webcamStream) {
        await startWebcamAutomatically();
      } else {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
        if (proctorWebcam) proctorWebcam.classList.add('hidden');
        if (proctorSimCanvas) proctorSimCanvas.classList.remove('hidden');
        if (webcamBtnLabel) webcamBtnLabel.textContent = 'Enable Live Camera';
        toggleWebcamBtn.classList.remove('btn-danger');
        toggleWebcamBtn.classList.add('btn-secondary');
        if (phoneCheckInterval) clearInterval(phoneCheckInterval);
      }
    });
  }

  // Active Anti-Cheat System Variables
  let sessionStartTime = 0;
  let blurTimer = null;
  let phoneConsecutiveFrames = 0;

  // Record Cheating Violation (With Grace Period & Deduplication)
  function recordCheatingViolation(reason) {
    if (!activeSession || activeSession.status === 'completed' || activeSession.status === 'disqualified') return;
    
    // 12-second grace period after starting interview to prevent accidental setup triggers
    if (Date.now() - sessionStartTime < 12000) return;

    violationCount++;

    if (violationCountNum) violationCountNum.textContent = `${violationCount} / 3`;
    if (violationProgressBar) {
      const pct = Math.min(100, (violationCount / 3) * 100);
      violationProgressBar.style.width = `${pct}%`;
    }

    if (proctorAlertBanner && alertBannerText) {
      alertBannerText.textContent = `⚠️ Security Alert (${violationCount}/3): ${reason}`;
      proctorAlertBanner.classList.remove('hidden');
    }

    appendWarningChatMessage(`🚨 ANTI-CHEAT SECURITY ALERT (${violationCount}/3): ${reason}. Please keep your browser window focused on the interview.`);

    if (violationCount >= 3) {
      disqualifyCandidate(`Automated Disqualification: Exceeded maximum allowed security violations (${reason}).`);
    }
  }

  async function disqualifyCandidate(reasonStr) {
    if (!activeSession || activeSession.status === 'disqualified') return;
    activeSession.status = 'disqualified';

    if (answerInput) {
      answerInput.disabled = true;
      answerInput.placeholder = '⛔ CANDIDATE DISQUALIFIED FOR ACADEMIC MISCONDUCT - INPUT LOCKED';
    }
    if (sendAnswerBtn) sendAnswerBtn.disabled = true;

    try {
      const res = await fetch('/api/interview/disqualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession.session_id,
          reason: reasonStr,
          violations: violationCount
        })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = {
          feedback: {
            overall_score: 0,
            hiring_recommendation: 'DISQUALIFIED',
            summary: `⛔ CANDIDATE DISQUALIFIED: ${reasonStr}.`,
            rubric_scores: { technical_accuracy: 0, system_design_depth: 0, communication_clarity: 0, tool_mastery: 0 },
            key_strengths: [],
            growth_areas: ['Academic Integrity & Anti-Cheat Policy Violation'],
            day_breakdown: []
          }
        };
      }

      if (data.feedback) {
        renderEvaluationReport(data.feedback);
      }
    } catch (err) {
      console.error('Error disqualifying candidate:', err);
    }
  }

  // Active Browser Event Listeners with Debounced Tab Switch Detector
  window.addEventListener('focus', () => {
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }
    if (proctorGazeStatus) proctorGazeStatus.textContent = 'Centered';
  });

  window.addEventListener('blur', () => {
    if (activeSession && activeSession.status !== 'completed' && activeSession.status !== 'disqualified') {
      if (proctorGazeStatus) proctorGazeStatus.textContent = 'Looking Away!';
      if (blurTimer) clearTimeout(blurTimer);
      // Only count violation if user remains off tab for > 2.5 seconds
      blurTimer = setTimeout(() => {
        recordCheatingViolation('Tab switch / window focus loss (> 2.5s)');
      }, 2500);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && activeSession && activeSession.status !== 'completed' && activeSession.status !== 'disqualified') {
      if (proctorGazeStatus) proctorGazeStatus.textContent = 'Off Screen!';
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        recordCheatingViolation('Switched to secondary tab or application');
      }, 2500);
    } else {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    }
  });

  if (answerInput) {
    answerInput.addEventListener('paste', (e) => {
      if (activeSession) {
        const pasteData = (e.clipboardData || window.clipboardData).getData('text');
        if (pasteData && pasteData.length > 80) {
          recordCheatingViolation('Suspicious external answer text pasted from clipboard');
        }
      }
    });
  }

  function initProctorSimulationCanvas() {
    if (!proctorSimCanvas) return;
    const ctx = proctorSimCanvas.getContext('2d');
    let frame = 0;

    function drawMesh() {
      const w = proctorSimCanvas.width = proctorSimCanvas.offsetWidth || 280;
      const h = proctorSimCanvas.height = proctorSimCanvas.offsetHeight || 150;
      ctx.clearRect(0, 0, w, h);

      frame++;
      const cx = w / 2 + Math.sin(frame * 0.03) * 10;
      const cy = h / 2 + Math.cos(frame * 0.02) * 5;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 32, 42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 45, cy - 55, 90, 110);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx - 14, cy - 10, 3, 0, Math.PI * 2);
      ctx.arc(cx + 14, cy - 10, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      const l = 10;
      ctx.beginPath(); ctx.moveTo(cx - 50, cy - 60 + l); ctx.lineTo(cx - 50, cy - 60); ctx.lineTo(cx - 50 + l, cy - 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 50 - l, cy - 60); ctx.lineTo(cx + 50, cy - 60); ctx.lineTo(cx + 50, cy - 60 + l); ctx.stroke();

      requestAnimationFrame(drawMesh);
    }

    drawMesh();
  }

  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/```(?:[a-z]*\n)?([\s\S]*?)```/g, (match, p1) => {
        const rawCode = p1.trim();
        const escapedCode = rawCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        return `
          <div class="code-block-card">
            <div class="code-block-header">
              <span><i class="fa-solid fa-code text-cyan"></i> Code Snippet</span>
              <button type="button" class="code-copy-btn" data-code="${escapedCode}"><i class="fa-regular fa-copy"></i> Copy</button>
            </div>
            <pre class="code-block-body"><code>${escapedCode}</code></pre>
          </div>
        `;
      })
      .replace(/`([^`]+)`/g, '<code class="inline-code" style="font-family:var(--font-code); background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-size:13px; color:#a5b4fc;">$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }
});
