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

  fetchCurriculumScope();

  async function fetchCurriculumScope() {
    try {
      const res = await fetch('/api/curriculum');
      const data = await res.json();
      const curriculum = data.curriculum || [];
      const bannerCurriculumVal = document.getElementById('bannerCurriculumVal');
      if (bannerCurriculumVal) {
        bannerCurriculumVal.textContent = `${curriculum.length} Days`;
      }
    } catch (err) {
      console.error('Failed to fetch curriculum scope:', err);
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

    const bannerCandidatesVal = document.getElementById('bannerCandidatesVal');
    if (bannerCandidatesVal) {
      bannerCandidatesVal.textContent = `${candidatesList.length} Profiles`;
    }

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

        <div class="card-action-row" style="display:flex; gap:8px; width:100%;">
          <button type="button" class="btn btn-primary btn-launch-cand" style="flex:1;">
            <i class="fa-solid fa-bolt"></i> Select & Start Interview
          </button>
          <button type="button" class="btn btn-danger btn-delete-cand" style="padding: 8px 12px; font-size:12px;" title="Delete Candidate">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      const launchBtn = card.querySelector('.btn-launch-cand');
      if (launchBtn) {
        launchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          candidateSelect.value = c.id;
          candidateSelect.dispatchEvent(new Event('change'));
          startInterviewBtn.click();
        });
      }

      const deleteBtn = card.querySelector('.btn-delete-cand');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmDelete = confirm(`Are you sure you want to delete candidate "${c.name}" from the database? This action cannot be undone.`);
          if (!confirmDelete) return;

          try {
            const res = await fetch(`/api/candidates/${c.id}`, { method: 'DELETE' });
            let data;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              data = await res.json();
            } else {
              data = { success: res.ok, message: 'Candidate deleted successfully.' };
            }

            if (data.success) {
              if (selectedCandidate && selectedCandidate.id === c.id) {
                selectedCandidate = null;
                candidateCard.classList.add('hidden');
                startInterviewBtn.disabled = true;
              }
              await fetchCandidates();
              alert(`Candidate "${c.name}" deleted successfully.`);
            } else {
              alert('Error deleting candidate: ' + (data.error || 'Unknown error'));
            }
          } catch (err) {
            alert('Failed to delete candidate: ' + err.message);
          }
        });
      }

      card.addEventListener('click', () => {
        candidateSelect.value = c.id;
        candidateSelect.dispatchEvent(new Event('change'));
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

  const deleteCandidateBtn = document.getElementById('deleteCandidateBtn');
  if (deleteCandidateBtn) {
    deleteCandidateBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!selectedCandidate) return;

      const confirmDelete = confirm(`Are you sure you want to delete candidate "${selectedCandidate.name}" from the database? This action cannot be undone.`);
      if (!confirmDelete) return;

      try {
        const res = await fetch(`/api/candidates/${selectedCandidate.id}`, {
          method: 'DELETE'
        });
        let data;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          data = { success: res.ok, message: 'Candidate deleted successfully.' };
        }

        if (data.success) {
          const deletedName = selectedCandidate.name;
          selectedCandidate = null;
          candidateCard.classList.add('hidden');
          startInterviewBtn.disabled = true;
          await fetchCandidates();
          alert(`Candidate "${deletedName}" deleted successfully from database.`);
        } else {
          alert('Error deleting candidate: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Failed to delete candidate: ' + err.message);
      }
    });
  }

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
      if (webcamBtnLabel) webcamBtnLabel.textContent = 'Camera Active (Locked)';
      if (toggleWebcamBtn) {
        toggleWebcamBtn.classList.add('btn-danger');
        toggleWebcamBtn.classList.remove('btn-secondary');
        if (activeSession && activeSession.status !== 'completed' && activeSession.status !== 'disqualified') {
          toggleWebcamBtn.disabled = true;
          toggleWebcamBtn.title = 'Camera is required and locked during the live technical interview';
        }
      }

      // Attach track disconnect sentinel
      const videoTrack = webcamStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (activeSession && activeSession.status !== 'completed' && activeSession.status !== 'disqualified') {
            recordCheatingViolation('Camera stream disconnected or turned off');
          }
        };
        videoTrack.onmute = () => {
          if (activeSession && activeSession.status !== 'completed' && activeSession.status !== 'disqualified') {
            recordCheatingViolation('Camera video feed muted or covered');
          }
        };
      }

      startLiveComputerVisionAnalyzer();
    } catch (err) {
      console.warn('Auto webcam stream note:', err.message);
      if (proctorSimCanvas) proctorSimCanvas.classList.remove('hidden');
      if (proctorWebcam) proctorWebcam.classList.add('hidden');
    }
  }

  let lastPhoneViolationTime = 0;
  let phoneStreak = 0;

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
      // Scan handheld central lower region of webcam stream
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
          // Mobile Phone Display Screen Luminance Check (Backlit screen luminance > 180)
          if (luminance > 180 && (Math.abs(r - g) < 40 || b > 140)) {
            brightScreenPixels++;
          }
        }
      }

      const screenRatio = brightScreenPixels / totalRegionPixels;

      // Update proctor HUD display badge for visual monitoring
      if (screenRatio > 0.22) {
        if (proctorDeviceStatus) proctorDeviceStatus.textContent = 'Mobile Phone! ⚠️';
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

  const openBreethDocsBtn = document.getElementById('openBreethDocsBtn');
  const closeBreethDocsBtn = document.getElementById('closeBreethDocsBtn');
  const breethDocsModal = document.getElementById('breethDocsModal');

  if (openBreethDocsBtn && breethDocsModal) {
    openBreethDocsBtn.addEventListener('click', () => {
      breethDocsModal.classList.remove('hidden');
    });
  }

  if (closeBreethDocsBtn && breethDocsModal) {
    closeBreethDocsBtn.addEventListener('click', () => {
      breethDocsModal.classList.add('hidden');
    });
  }

  // Top Ribbon Stat Card Interactive Handlers & Dedicated Modals
  const bannerCurriculumCard = document.getElementById('bannerCurriculumCard');
  const bannerCandidatesCard = document.getElementById('bannerCandidatesCard');
  const bannerPersonasCard = document.getElementById('bannerPersonasCard');
  const bannerScoringCard = document.getElementById('bannerScoringCard');

  const curriculumOverviewModal = document.getElementById('curriculumOverviewModal');
  const closeCurriculumModalBtn = document.getElementById('closeCurriculumModalBtn');

  const candidatesOverviewModal = document.getElementById('candidatesOverviewModal');
  const closeCandidatesModalBtn = document.getElementById('closeCandidatesModalBtn');
  const candidatesModalRosterList = document.getElementById('candidatesModalRosterList');

  const personasOverviewModal = document.getElementById('personasOverviewModal');
  const closePersonasModalBtn = document.getElementById('closePersonasModalBtn');

  const scoringFormulaModal = document.getElementById('scoringFormulaModal');
  const closeScoringModalBtn = document.getElementById('closeScoringModalBtn');

  // 1. Curriculum Card -> Curriculum Overview Modal Handlers
  if (bannerCurriculumCard && curriculumOverviewModal) {
    bannerCurriculumCard.addEventListener('click', () => {
      curriculumOverviewModal.classList.remove('hidden');
    });
  }
  if (closeCurriculumModalBtn && curriculumOverviewModal) {
    closeCurriculumModalBtn.addEventListener('click', () => {
      curriculumOverviewModal.classList.add('hidden');
    });
  }
  document.querySelectorAll('.jump-module-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (curriculumOverviewModal) curriculumOverviewModal.classList.add('hidden');
      const scopeElem = document.querySelector('.curriculum-scope-section') || document.querySelector('.home-section:last-of-type');
      if (scopeElem) scopeElem.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // 2. Candidates Card -> Candidate Roster Overview Modal Handlers
  const modalAddCandBtn = document.getElementById('modalAddCandBtn');
  if (modalAddCandBtn) {
    modalAddCandBtn.addEventListener('click', () => {
      if (candidatesOverviewModal) candidatesOverviewModal.classList.add('hidden');
      openCandidateModal();
    });
  }

  function renderCandidatesModalRoster() {
    if (!candidatesModalRosterList) return;
    candidatesModalRosterList.innerHTML = '';
    candidates.forEach(c => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.6); padding:10px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);';
      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="avatar" style="width:32px; height:32px; font-size:12px;">${c.name.split(' ').map(n=>n[0]).join('')}</div>
          <div>
            <strong style="font-size:13px; color:var(--text-main);">${c.name}</strong>
            <div style="font-size:11px; color:var(--text-muted);">${c.experience_level}</div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-primary btn-xs launch-cand-modal-btn" data-id="${c.id}">Select</button>
          <button class="btn btn-danger btn-xs delete-cand-modal-btn" data-id="${c.id}" title="Delete Candidate"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;
      item.querySelector('.launch-cand-modal-btn').addEventListener('click', () => {
        candidateSelect.value = c.id;
        candidateSelect.dispatchEvent(new Event('change'));
        candidatesOverviewModal.classList.add('hidden');
        const gridElem = document.getElementById('homeCandidateGrid');
        if (gridElem) gridElem.scrollIntoView({ behavior: 'smooth' });
      });

      item.querySelector('.delete-cand-modal-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmDelete = confirm(`Are you sure you want to delete candidate "${c.name}" from the database?`);
        if (!confirmDelete) return;

        try {
          const res = await fetch(`/api/candidates/${c.id}`, { method: 'DELETE' });
          let data;
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await res.json();
          } else {
            data = { success: res.ok, message: 'Candidate deleted' };
          }
          if (data.success) {
            if (selectedCandidate && selectedCandidate.id === c.id) {
              selectedCandidate = null;
              candidateCard.classList.add('hidden');
              startInterviewBtn.disabled = true;
            }
            await fetchCandidates();
            renderCandidatesModalRoster();
          }
        } catch (err) {
          alert('Failed to delete candidate: ' + err.message);
        }
      });

      candidatesModalRosterList.appendChild(item);
    });
  }

  if (bannerCandidatesCard && candidatesOverviewModal) {
    bannerCandidatesCard.addEventListener('click', () => {
      renderCandidatesModalRoster();
      candidatesOverviewModal.classList.remove('hidden');
    });
  }
  if (closeCandidatesModalBtn && candidatesOverviewModal) {
    closeCandidatesModalBtn.addEventListener('click', () => {
      candidatesOverviewModal.classList.add('hidden');
    });
  }

  // 3. Personas Card -> Personas Overview Modal Handlers
  if (bannerPersonasCard && personasOverviewModal) {
    bannerPersonasCard.addEventListener('click', () => {
      personasOverviewModal.classList.remove('hidden');
    });
  }
  if (closePersonasModalBtn && personasOverviewModal) {
    closePersonasModalBtn.addEventListener('click', () => {
      personasOverviewModal.classList.add('hidden');
    });
  }
  document.querySelectorAll('.select-persona-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.target.getAttribute('data-persona');
      const targetBtn = document.querySelector(`.persona-btn[data-persona="${p}"]`);
      if (targetBtn) targetBtn.click();
      if (personasOverviewModal) personasOverviewModal.classList.add('hidden');
    });
  });

  // 4. Scoring Card -> Symmetrical Scoring Formula Modal + Live Calculator Handlers
  if (bannerScoringCard && scoringFormulaModal) {
    bannerScoringCard.addEventListener('click', () => {
      scoringFormulaModal.classList.remove('hidden');
    });
  }
  if (closeScoringModalBtn && scoringFormulaModal) {
    closeScoringModalBtn.addEventListener('click', () => {
      scoringFormulaModal.classList.add('hidden');
    });
  }

  // Interactive Live Score Calculator Logic
  const simCompRange = document.getElementById('simCompRange');
  const simTechRange = document.getElementById('simTechRange');
  const simCompVal = document.getElementById('simCompVal');
  const simTechVal = document.getElementById('simTechVal');
  const simResultScore = document.getElementById('simResultScore');

  function updateLiveScoreCalc() {
    if (!simCompRange || !simTechRange || !simResultScore) return;
    const comp = parseInt(simCompRange.value, 10);
    const tech = parseInt(simTechRange.value, 10);
    if (simCompVal) simCompVal.textContent = `${comp}%`;
    if (simTechVal) simTechVal.textContent = `${tech}%`;

    const finalScore = (comp * 0.1) + (tech * 0.9);
    const formatted = finalScore.toFixed(1);

    let verdict = 'Strong Hire';
    let colorHex = '#34d399';
    if (finalScore < 50) {
      verdict = 'Needs Practice';
      colorHex = '#f43f5e';
    } else if (finalScore < 70) {
      verdict = 'Hire with Reservations';
      colorHex = '#f59e0b';
    } else if (finalScore < 85) {
      verdict = 'Hire';
      colorHex = '#22d3ee';
    }

    simResultScore.textContent = `${formatted}% — ${verdict}`;
    simResultScore.style.color = colorHex;
  }

  if (simCompRange) simCompRange.addEventListener('input', updateLiveScoreCalc);
  if (simTechRange) simTechRange.addEventListener('input', updateLiveScoreCalc);

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

  if (printCertBtn) {
    printCertBtn.addEventListener('click', () => {
      window.print();
    });
  }

  downloadReportBtn.addEventListener('click', () => {
    if (!lastReportData) return;
    const blob = new Blob([JSON.stringify(lastReportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Report_${selectedCandidate ? selectedCandidate.name.replace(/\s+/g, '_') : 'Candidate'}.json`;
    a.click();
  });

  document.querySelectorAll('.module-chip').forEach(chip => {
    chip.style.cursor = 'pointer';
    chip.addEventListener('click', () => {
      if (curriculumOverviewModal) curriculumOverviewModal.classList.remove('hidden');
    });
  });

  // Toggle Camera Manual Button (Locked during active interview)
  if (toggleWebcamBtn) {
    toggleWebcamBtn.addEventListener('click', async () => {
      if (activeSession && activeSession.status !== 'completed' && activeSession.status !== 'disqualified') {
        recordCheatingViolation('Attempted to turn off camera during live interview');
        alert('⚠️ Security Alert: Camera stream is strictly required and cannot be disabled during the interview!');
        return;
      }

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
    
    // 3-second initial launch grace period
    if (Date.now() - sessionStartTime < 3000) return;

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

  // Active Browser Event Listeners with Strict Tab Switch Detector
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
      // Strictly enforce tab switch violation if unfocused > 1.2s
      blurTimer = setTimeout(() => {
        recordCheatingViolation('Tab switch or window focus loss detected');
      }, 1200);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && activeSession && activeSession.status !== 'completed' && activeSession.status !== 'disqualified') {
      if (proctorGazeStatus) proctorGazeStatus.textContent = 'Off Screen!';
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        recordCheatingViolation('Switched to secondary tab or application');
      }, 1200);
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
