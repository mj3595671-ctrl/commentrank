// CommentRank Front-end Orchestration Logic (Standalone & Server Ready)
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const postUrlInput = document.getElementById('postUrlInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const demoModeToggle = document.getElementById('demoModeToggle');
  const connectFbBtn = document.getElementById('connectFbBtn');
  const authContainer = document.getElementById('authContainer');
  const userProfile = document.getElementById('userProfile');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const connIndicator = document.getElementById('connectionIndicator');
  const connStatusText = document.getElementById('connStatusText');
  const langToggle = document.getElementById('langToggle');

  const loadingProgress = document.getElementById('loadingProgress');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressStatusText = document.getElementById('progressStatusText');

  const tieAlertCard = document.getElementById('tieAlertCard');
  const tieDetailText = document.getElementById('tieDetailText');
  const tieBreakBtn = document.getElementById('tieBreakBtn');

  const winnerCard = document.getElementById('winnerCard');
  const winnerName = document.getElementById('winnerName');
  const winnerCommentsCount = document.getElementById('winnerCommentsCount');
  const pickAnotherWinnerBtn = document.getElementById('pickAnotherWinnerBtn');
  const winnerConfigBtn = document.getElementById('winnerConfigBtn');

  const statsSection = document.getElementById('statsSection');
  const statTotalComments = document.getElementById('statTotalComments');
  const statUniqueUsers = document.getElementById('statUniqueUsers');
  const statTopCommenter = document.getElementById('statTopCommenter');
  const statTopCount = document.getElementById('statTopCount');
  const statAvgComments = document.getElementById('statAvgComments');

  const podiumSection = document.getElementById('podiumSection');
  const podium1Name = document.getElementById('podium1Name');
  const podium1Count = document.getElementById('podium1Count');
  const podium2Name = document.getElementById('podium2Name');
  const podium2Count = document.getElementById('podium2Count');
  const podium3Name = document.getElementById('podium3Name');
  const podium3Count = document.getElementById('podium3Count');

  const chartSection = document.getElementById('chartSection');
  const barChart = document.getElementById('barChart');

  const leaderboardSection = document.getElementById('leaderboardSection');
  const leaderboardBody = document.getElementById('leaderboardBody');
  const searchUserInput = document.getElementById('searchUserInput');
  const sortSelect = document.getElementById('sortSelect');
  const limitSelect = document.getElementById('limitSelect');

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const printBtn = document.getElementById('printBtn');

  const giveawayModal = document.getElementById('giveawayModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const executeGiveawayBtn = document.getElementById('executeGiveawayBtn');
  const giveawayModeSelect = document.getElementById('giveawayModeSelect');
  const weightedCheckbox = document.getElementById('weightedCheckbox');

  // Application State
  let currentDataset = [];
  let currentAnalysisId = null;
  let isFbConnected = false;
  let isDemoActive = false;

  // 1. Language Toggle Setup
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      if (window.i18n) window.i18n.toggle();
      updateConnectionUI();
    });
  }

  // 2. Auth Status Initializer
  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      isFbConnected = data.connected;

      if (data.connected && data.user) {
        connectFbBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userName.textContent = data.user.name;
        if (data.user.avatar) userAvatar.src = data.user.avatar;
      } else {
        connectFbBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
      }
    } catch (e) {
      isFbConnected = false;
    }
    updateConnectionUI();
  }

  function updateConnectionUI() {
    if (!connIndicator || !connStatusText) return;
    if (isFbConnected) {
      connIndicator.className = 'conn-status connected';
      connStatusText.textContent = window.i18n ? window.i18n.t('status_connected') : 'Facebook Connected';
    } else {
      connIndicator.className = 'conn-status not-connected';
      connStatusText.textContent = window.i18n ? window.i18n.t('status_not_connected') : 'Facebook Not Connected';
    }
  }

  if (connectFbBtn) {
    connectFbBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/auth/facebook/login-url');
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      } catch (err) {
        showToast('Could not initiate Facebook authentication');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    });
  }

  // 3. Comment Analysis Execution (Client Demo Mode + Production Graph API)
  analyzeBtn.addEventListener('click', async () => {
    const isDemo = demoModeToggle ? demoModeToggle.checked : false;
    const postUrl = postUrlInput.value.trim();

    if (!isDemo && !postUrl) {
      showToast('تکایە لینکێک دابنێ یان مۆدی دیمۆ چالاک بکە');
      return;
    }

    startProgress();

    // ئەگەر دیمۆ بوو، ڕاستەوخۆ لەناو کڕایەنت بەبێ سێرڤەر داتاکان نیشان دەدات
    if (isDemo) {
      isDemoActive = true;
      setTimeout(() => {
        stopProgress();
        const demoData = {
          totalComments: 141,
          uniqueCommenters: 5,
          averagePerUser: "28.2",
          isTieForFirst: false,
          topCommenter: { name: "Ahmad", count: 47 },
          leaderboard: [
            { rank: 1, name: "Ahmad", count: 47, percentage: 33.3, lastCommentDate: new Date().toISOString() },
            { rank: 2, name: "Sara", count: 35, percentage: 24.8, lastCommentDate: new Date().toISOString() },
            { rank: 3, name: "Ali", count: 29, percentage: 20.6, lastCommentDate: new Date().toISOString() },
            { rank: 4, name: "Karwan", count: 18, percentage: 12.8, lastCommentDate: new Date().toISOString() },
            { rank: 5, name: "Dana", count: 12, percentage: 8.5, lastCommentDate: new Date().toISOString() }
          ]
        };
        currentDataset = demoData.leaderboard;
        currentAnalysisId = 'demo_session_101';
        renderFullDashboard(demoData);
        showToast('داتای نموونەیی بە سەرکەوتوویی بارکرا!');
      }, 900);
      return;
    }

    isDemoActive = false;

    // پەیوەندیکردن بە سێرڤەری سەرەکی بۆ داتای ڕاستەقینەی فەیسبووک
    try {
      const resp = await fetch('/api/analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl, isDemo: false })
      });

      const json = await resp.json();
      stopProgress();

      if (!json.success) {
        showToast(json.message || 'Analysis failed');
        return;
      }

      currentDataset = json.data.leaderboard;
      currentAnalysisId = json.analysisId;
      renderFullDashboard(json.data);
      showToast('Analysis completed successfully!');
    } catch (err) {
      stopProgress();
      showToast('A network error occurred while running analysis.');
    }
  });

  function startProgress() {
    loadingProgress.classList.remove('hidden');
    progressBarFill.style.width = '25%';
    progressStatusText.textContent = window.i18n ? window.i18n.t('prog_connecting') : 'Connecting...';

    setTimeout(() => { 
      progressBarFill.style.width = '60%'; 
      progressStatusText.textContent = 'Fetching comments batch...'; 
    }, 300);
    setTimeout(() => { 
      progressBarFill.style.width = '85%'; 
      progressStatusText.textContent = 'Ranking commenters & calculating...'; 
    }, 600);
  }

  function stopProgress() {
    progressBarFill.style.width = '100%';
    setTimeout(() => { loadingProgress.classList.add('hidden'); }, 300);
  }

  // 4. Render Dashboard Components
  function renderFullDashboard(data) {
    statsSection.classList.remove('hidden');
    podiumSection.classList.remove('hidden');
    chartSection.classList.remove('hidden');
    leaderboardSection.classList.remove('hidden');
    winnerCard.classList.remove('hidden');

    animateCounter(statTotalComments, data.totalComments);
    animateCounter(statUniqueUsers, data.uniqueCommenters);
    statAvgComments.textContent = data.averagePerUser;

    if (data.topCommenter) {
      statTopCommenter.textContent = data.topCommenter.name;
      statTopCount.textContent = `${data.topCommenter.count} comments`;
      winnerName.textContent = data.topCommenter.name;
      winnerCommentsCount.textContent = `${data.topCommenter.count} comments`;
    }

    // Tie Handling
    if (data.isTieForFirst) {
      tieAlertCard.classList.remove('hidden');
      const tiedNames = data.tiedLeaders.map((u) => u.name).join(' & ');
      tieDetailText.textContent = `${tiedNames} both have ${data.tiedLeaders[0].count} comments.`;
    } else {
      tieAlertCard.classList.add('hidden');
    }

    // Podium Top 3
    const top3 = data.leaderboard.slice(0, 3);
    if (top3[0]) { podium1Name.textContent = top3[0].name; podium1Count.textContent = `${top3[0].count} comments`; }
    if (top3[1]) { podium2Name.textContent = top3[1].name; podium2Count.textContent = `${top3[1].count} comments`; }
    if (top3[2]) { podium3Name.textContent = top3[2].name; podium3Count.textContent = `${top3[2].count} comments`; }

    // Chart & Table
    renderChart(data.leaderboard.slice(0, 10));
    renderTable();
  }

  function renderChart(top10) {
    barChart.innerHTML = '';
    if (!top10.length) return;
    const maxVal = top10[0].count || 1;

    top10.forEach((item) => {
      const wrap = document.createElement('div');
      wrap.className = 'chart-bar-wrap';

      const barHeight = Math.max((item.count / maxVal) * 100, 8);
      wrap.innerHTML = `
        <div class="chart-bar" style="height: ${barHeight}%" title="${item.name}: ${item.count}"></div>
        <span class="chart-label">${item.name}</span>
      `;
      barChart.appendChild(wrap);
    });
  }

  function renderTable() {
    const query = searchUserInput.value.toLowerCase();
    const sort = sortSelect.value;
    const limit = limitSelect.value;

    let filtered = currentDataset.filter((item) => item.name.toLowerCase().includes(query));

    if (sort === 'least') filtered.sort((a, b) => a.count - b.count);
    else if (sort === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name_desc') filtered.sort((a, b) => b.name.localeCompare(a.name));
    else filtered.sort((a, b) => b.count - a.count);

    if (limit !== 'all') {
      filtered = filtered.slice(0, parseInt(limit, 10));
    }

    leaderboardBody.innerHTML = '';
    filtered.forEach((u) => {
      const row = document.createElement('tr');
      const formattedDate = new Date(u.lastCommentDate).toLocaleDateString();

      let rankDisplay = `#${u.rank}`;
      if (u.rank === 1) rankDisplay = '🥇 1';
      else if (u.rank === 2) rankDisplay = '🥈 2';
      else if (u.rank === 3) rankDisplay = '🥉 3';

      row.innerHTML = `
        <td><strong>${rankDisplay}</strong></td>
        <td>${u.name}</td>
        <td><strong>${u.count}</strong></td>
        <td>${u.percentage}%</td>
        <td><small style="color:var(--text-muted)">${formattedDate}</small></td>
      `;
      leaderboardBody.appendChild(row);
    });
  }

  searchUserInput.addEventListener('input', renderTable);
  sortSelect.addEventListener('change', renderTable);
  limitSelect.addEventListener('change', renderTable);

  // 5. Giveaway System (Standalone support for Demo mode)
  winnerConfigBtn.addEventListener('click', () => giveawayModal.classList.remove('hidden'));
  closeModalBtn.addEventListener('click', () => giveawayModal.classList.add('hidden'));

  executeGiveawayBtn.addEventListener('click', async () => {
    const mode = giveawayModeSelect.value;
    const weighted = weightedCheckbox.checked;

    if (!currentDataset.length) {
      showToast('No candidates available.');
      return;
    }

    // لە حاڵەتی دیمۆدا، ڕاستەوخۆ براوەکە لەناو کڕایەنت هەڵدەبژێردرێت
    if (isDemoActive) {
      let chosenWinner = currentDataset[0];
      if (mode === 'random') {
        if (!weighted) {
          const randIdx = Math.floor(Math.random() * currentDataset.length);
          chosenWinner = currentDataset[randIdx];
        } else {
          const totalComments = currentDataset.reduce((acc, c) => acc + c.count, 0);
          let randomTicket = Math.floor(Math.random() * totalComments) + 1;
          for (const cand of currentDataset) {
            randomTicket -= cand.count;
            if (randomTicket <= 0) {
              chosenWinner = cand;
              break;
            }
          }
        }
      }
      giveawayModal.classList.add('hidden');
      winnerName.textContent = chosenWinner.name;
      winnerCommentsCount.textContent = `${chosenWinner.count} qualifying comments`;
      showToast(`🎉 Winner Selected: ${chosenWinner.name}!`);
      return;
    }

    // حاڵەتی سێرڤەر
    try {
      const resp = await fetch('/api/analysis/winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderboard: currentDataset,
          mode,
          weighted,
          analysisId: currentAnalysisId
        })
      });

      const res = await resp.json();
      if (res.success && res.winner) {
        giveawayModal.classList.add('hidden');
        winnerName.textContent = res.winner.name;
        winnerCommentsCount.textContent = `${res.winner.count} qualifying comments`;
        showToast(`🎉 Winner Selected: ${res.winner.name}!`);
      }
    } catch (e) {
      showToast('Failed to execute giveaway draw.');
    }
  });

  tieBreakBtn.addEventListener('click', () => {
    giveawayModeSelect.value = 'random';
    weightedCheckbox.checked = false;
    executeGiveawayBtn.click();
    tieAlertCard.classList.add('hidden');
  });

  pickAnotherWinnerBtn.addEventListener('click', () => {
    giveawayModeSelect.value = 'random';
    executeGiveawayBtn.click();
  });

  // 6. Export Actions
  exportCsvBtn.addEventListener('click', () => {
    if (!currentDataset.length) return;
    let csv = 'Rank,Name,Comments,Percentage\n';
    currentDataset.forEach((c) => {
      csv += `"${c.rank}","${c.name.replace(/"/g, '""')}","${c.count}","${c.percentage}%\n`;
    });
    downloadBlob(csv, 'commentrank_export.csv', 'text/csv;charset=utf-8;');
  });

  exportJsonBtn.addEventListener('click', () => {
    if (!currentDataset.length) return;
    const jsonStr = JSON.stringify(currentDataset, null, 2);
    downloadBlob(jsonStr, 'commentrank_export.json', 'application/json');
  });

  printBtn.addEventListener('click', () => window.print());

  function downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function animateCounter(element, target) {
    let current = 0;
    const increment = Math.max(Math.ceil(target / 25), 1);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        element.textContent = current.toLocaleString();
      }
    }, 20);
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
  }

  // Check connection status at start
  checkAuthStatus();
});
