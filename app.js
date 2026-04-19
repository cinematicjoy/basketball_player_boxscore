const STORAGE_KEY = 'basketball_individual_sheets_v1';

const shotConfig = {
  ft: { label: 'TL', value: 1 },
  two: { label: '2P', value: 2 },
  three: { label: '3P', value: 3 },
};

const statLabels = {
  rebounds: 'REB',
  assists: 'AST',
  secondaryAssists: 'PGNF',
  steals: 'ROB',
  recoveries: 'REC',
  blocks: 'TAP',
  turnovers: 'PER',
  travels: 'CAM',
  foulsReceived: 'FR',
  foulsCommitted: 'FC',
};

let deferredInstallPrompt = null;
let currentSheet = createEmptySheet();

const dom = {
  playerName: document.getElementById('playerName'),
  category: document.getElementById('category'),
  gameDate: document.getElementById('gameDate'),
  opponent: document.getElementById('opponent'),
  teamScore: document.getElementById('teamScore'),
  opponentScore: document.getElementById('opponentScore'),
  resultBadge: document.getElementById('resultBadge'),
  summaryResultBadge: document.getElementById('summaryResultBadge'),
  scorePreview: document.getElementById('scorePreview'),
  saveFeedback: document.getElementById('save-feedback'),
  toggleHistory: document.getElementById('toggle-history'),
  closeHistory: document.getElementById('close-history'),
  historyPanel: document.getElementById('history-panel'),
  historyList: document.getElementById('history-list'),
  saveSheet: document.getElementById('save-sheet'),
  newSheet: document.getElementById('new-sheet'),
  shareSheet: document.getElementById('share-sheet'),
  installApp: document.getElementById('install-app'),
  installStatus: document.getElementById('install-status'),
  averagesContent: document.getElementById('averages-content'),
  averagesMeta: document.getElementById('averages-meta'),
  totalPoints: document.getElementById('totalPoints'),
  summaryRebounds: document.getElementById('summaryRebounds'),
  summaryAssists: document.getElementById('summaryAssists'),
  summarySecondaryAssists: document.getElementById('summarySecondaryAssists'),
  summarySteals: document.getElementById('summarySteals'),
  summaryRecoveries: document.getElementById('summaryRecoveries'),
  summaryBlocks: document.getElementById('summaryBlocks'),
  summaryTurnovers: document.getElementById('summaryTurnovers'),
  summaryTravels: document.getElementById('summaryTravels'),
  summaryFoulsReceived: document.getElementById('summaryFoulsReceived'),
  summaryFoulsCommitted: document.getElementById('summaryFoulsCommitted'),
  summaryFgPct: document.getElementById('summaryFgPct'),
};

function createEmptySheet() {
  return {
    id: crypto.randomUUID(),
    playerName: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    opponent: '',
    result: {
      teamScore: '',
      opponentScore: '',
    },
    shots: {
      ft: { made: 0, missed: 0 },
      two: { made: 0, missed: 0 },
      three: { made: 0, missed: 0 },
    },
    stats: {
      rebounds: 0,
      assists: 0,
      secondaryAssists: 0,
      steals: 0,
      recoveries: 0,
      blocks: 0,
      turnovers: 0,
      travels: 0,
      foulsReceived: 0,
      foulsCommitted: 0,
    },
    updatedAt: Date.now(),
  };
}

function normalizeSheet(sheet = {}) {
  const base = createEmptySheet();
  return {
    ...base,
    ...sheet,
    id: sheet.id || base.id,
    playerName: sheet.playerName || '',
    category: sheet.category || '',
    date: sheet.date || base.date,
    opponent: sheet.opponent || '',
    result: {
      teamScore: normalizeScoreValue(sheet.result?.teamScore),
      opponentScore: normalizeScoreValue(sheet.result?.opponentScore),
    },
    shots: {
      ft: {
        made: sanitizeCounter(sheet.shots?.ft?.made),
        missed: sanitizeCounter(sheet.shots?.ft?.missed),
      },
      two: {
        made: sanitizeCounter(sheet.shots?.two?.made),
        missed: sanitizeCounter(sheet.shots?.two?.missed),
      },
      three: {
        made: sanitizeCounter(sheet.shots?.three?.made),
        missed: sanitizeCounter(sheet.shots?.three?.missed),
      },
    },
    stats: {
      rebounds: sanitizeCounter(sheet.stats?.rebounds),
      assists: sanitizeCounter(sheet.stats?.assists),
      secondaryAssists: sanitizeCounter(sheet.stats?.secondaryAssists),
      steals: sanitizeCounter(sheet.stats?.steals),
      recoveries: sanitizeCounter(sheet.stats?.recoveries),
      blocks: sanitizeCounter(sheet.stats?.blocks),
      turnovers: sanitizeCounter(sheet.stats?.turnovers),
      travels: sanitizeCounter(sheet.stats?.travels),
      foulsReceived: sanitizeCounter(sheet.stats?.foulsReceived),
      foulsCommitted: sanitizeCounter(sheet.stats?.foulsCommitted),
    },
    updatedAt: Number(sheet.updatedAt) || Date.now(),
  };
}

function getSavedSheets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeSheet) : [];
  } catch {
    return [];
  }
}

function saveSheetsToStorage(sheets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets.map(normalizeSheet)));
}

function sanitizeCounter(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeScoreValue(value) {
  if (value === '' || value === null || value === undefined) return '';
  return String(Math.max(0, Number(value) || 0));
}

function getNumericScore(value) {
  return value === '' ? null : Math.max(0, Number(value) || 0);
}

function getResultSummary(sheet = currentSheet) {
  const teamScore = getNumericScore(sheet.result?.teamScore ?? '');
  const opponentScore = getNumericScore(sheet.result?.opponentScore ?? '');

  if (teamScore === null || opponentScore === null) {
    return {
      label: 'Sin cargar',
      shortLabel: 'Sin resultado',
      score: '—',
      className: 'neutral',
    };
  }

  if (teamScore > opponentScore) {
    return {
      label: 'Victoria',
      shortLabel: 'Victoria',
      score: `${teamScore} - ${opponentScore}`,
      className: 'win',
    };
  }

  if (teamScore < opponentScore) {
    return {
      label: 'Derrota',
      shortLabel: 'Derrota',
      score: `${teamScore} - ${opponentScore}`,
      className: 'loss',
    };
  }

  return {
    label: 'Empate',
    shortLabel: 'Empate',
    score: `${teamScore} - ${opponentScore}`,
    className: 'draw',
  };
}

function setBadgeState(element, summary) {
  element.textContent = summary.label;
  element.className = `result-badge ${summary.className}${element.classList.contains('small') ? ' small' : ''}`.trim();
}

function getShotAttempts(shotKey) {
  const shot = currentSheet.shots[shotKey];
  return shot.made + shot.missed;
}

function getShotPct(shotKey) {
  const attempts = getShotAttempts(shotKey);
  if (!attempts) return 0;
  return Math.round((currentSheet.shots[shotKey].made / attempts) * 100);
}

function getShotPoints(shotKey) {
  return currentSheet.shots[shotKey].made * shotConfig[shotKey].value;
}

function getFgSummary() {
  const made = currentSheet.shots.two.made + currentSheet.shots.three.made;
  const attempts = getShotAttempts('two') + getShotAttempts('three');
  const points = getShotPoints('two') + getShotPoints('three');
  const pct = attempts ? Math.round((made / attempts) * 100) : 0;
  return { made, attempts, points, pct };
}

function getTotalPoints() {
  return getShotPoints('ft') + getShotPoints('two') + getShotPoints('three');
}

function bindHeaderInputs() {
  dom.playerName.addEventListener('input', (event) => {
    currentSheet.playerName = event.target.value;
    currentSheet.updatedAt = Date.now();
    renderAverages();
  });

  dom.category.addEventListener('input', (event) => {
    currentSheet.category = event.target.value;
    currentSheet.updatedAt = Date.now();
  });

  dom.gameDate.addEventListener('input', (event) => {
    currentSheet.date = event.target.value;
    currentSheet.updatedAt = Date.now();
  });

  dom.opponent.addEventListener('input', (event) => {
    currentSheet.opponent = event.target.value;
    currentSheet.updatedAt = Date.now();
  });

  dom.teamScore.addEventListener('input', (event) => {
    currentSheet.result.teamScore = normalizeScoreValue(event.target.value);
    currentSheet.updatedAt = Date.now();
    renderResult();
  });

  dom.opponentScore.addEventListener('input', (event) => {
    currentSheet.result.opponentScore = normalizeScoreValue(event.target.value);
    currentSheet.updatedAt = Date.now();
    renderResult();
  });
}

function bindCounterEvents() {
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-counter-type]');
    if (!button) return;

    const delta = Number(button.dataset.delta || 0);
    const counterType = button.dataset.counterType;

    if (counterType === 'stat') {
      const statKey = button.dataset.stat;
      currentSheet.stats[statKey] = sanitizeCounter(currentSheet.stats[statKey] + delta);
    }

    if (counterType === 'shot') {
      const shotKey = button.dataset.shot;
      const field = button.dataset.field;
      currentSheet.shots[shotKey][field] = sanitizeCounter(currentSheet.shots[shotKey][field] + delta);
    }

    currentSheet.updatedAt = Date.now();
    render();
  });
}

function renderResult() {
  dom.teamScore.value = currentSheet.result.teamScore;
  dom.opponentScore.value = currentSheet.result.opponentScore;

  const summary = getResultSummary();
  dom.scorePreview.textContent = summary.score;
  setBadgeState(dom.resultBadge, summary);
  setBadgeState(dom.summaryResultBadge, {
    ...summary,
    label: summary.shortLabel,
  });
}

function render() {
  currentSheet = normalizeSheet(currentSheet);

  dom.playerName.value = currentSheet.playerName;
  dom.category.value = currentSheet.category;
  dom.gameDate.value = currentSheet.date;
  dom.opponent.value = currentSheet.opponent;
  renderResult();

  for (const shotKey of Object.keys(shotConfig)) {
    const shot = currentSheet.shots[shotKey];
    document.getElementById(`${shotKey}-missed`).textContent = shot.missed;
    document.getElementById(`${shotKey}-made`).textContent = shot.made;
    document.getElementById(`${shotKey}-attempts`).textContent = getShotAttempts(shotKey);
    document.getElementById(`${shotKey}-made-display`).textContent = shot.made;
    document.getElementById(`${shotKey}-pct`).textContent = `${getShotPct(shotKey)}%`;
    document.getElementById(`${shotKey}-points`).textContent = getShotPoints(shotKey);
  }

  const fg = getFgSummary();
  document.getElementById('fg-attempts').textContent = fg.attempts;
  document.getElementById('fg-made').textContent = fg.made;
  document.getElementById('fg-pct').textContent = `${fg.pct}%`;
  document.getElementById('fg-points').textContent = fg.points;

  Object.entries(currentSheet.stats).forEach(([key, value]) => {
    const target = document.getElementById(key);
    if (target) target.textContent = value;
  });

  dom.totalPoints.textContent = getTotalPoints();
  dom.summaryRebounds.textContent = currentSheet.stats.rebounds;
  dom.summaryAssists.textContent = currentSheet.stats.assists;
  dom.summarySecondaryAssists.textContent = currentSheet.stats.secondaryAssists;
  dom.summarySteals.textContent = currentSheet.stats.steals;
  dom.summaryRecoveries.textContent = currentSheet.stats.recoveries;
  dom.summaryBlocks.textContent = currentSheet.stats.blocks;
  dom.summaryTurnovers.textContent = currentSheet.stats.turnovers;
  dom.summaryTravels.textContent = currentSheet.stats.travels;
  dom.summaryFoulsReceived.textContent = currentSheet.stats.foulsReceived;
  dom.summaryFoulsCommitted.textContent = currentSheet.stats.foulsCommitted;
  dom.summaryFgPct.textContent = `${fg.pct}%`;

  renderHistory();
  renderAverages();
}

function renderHistory() {
  const savedSheets = getSavedSheets().sort((a, b) => b.updatedAt - a.updatedAt);
  if (!savedSheets.length) {
    dom.historyList.className = 'history-list empty-state';
    dom.historyList.textContent = 'Todavía no hay planillas guardadas.';
    return;
  }

  dom.historyList.className = 'history-list';
  dom.historyList.innerHTML = savedSheets
    .map((sheet) => {
      const title = `${escapeHtml(sheet.playerName || 'Sin nombre')} · ${escapeHtml(sheet.opponent || 'Sin rival')}`;
      const resultSummary = getResultSummary(sheet);
      const meta = `${escapeHtml(sheet.category || 'Sin categoría')} · ${escapeHtml(sheet.date || 'Sin fecha')} · ${getPointsForSheet(sheet)} PTS · ${escapeHtml(resultSummary.label)} ${escapeHtml(resultSummary.score)}`;
      return `
        <div class="history-item">
          <div>
            <strong>${title}</strong>
            <div class="history-meta">${meta}</div>
          </div>
          <button data-load-sheet="${sheet.id}">Abrir</button>
          <button data-delete-sheet="${sheet.id}" class="delete-btn">Eliminar</button>
        </div>
      `;
    })
    .join('');
}

function renderAverages() {
  const playerName = currentSheet.playerName.trim().toLowerCase();
  if (!playerName) {
    dom.averagesMeta.textContent = 'Se calculan con planillas guardadas del mismo jugador.';
    dom.averagesContent.className = 'averages-grid empty-state';
    dom.averagesContent.textContent = 'Ingresá o cargá un jugador para ver sus promedios históricos.';
    return;
  }

  const samePlayerSheets = getSavedSheets().filter(
    (sheet) => (sheet.playerName || '').trim().toLowerCase() === playerName
  );

  if (!samePlayerSheets.length) {
    dom.averagesMeta.textContent = 'No hay historial guardado todavía para este jugador.';
    dom.averagesContent.className = 'averages-grid empty-state';
    dom.averagesContent.textContent = 'Guardá la primera planilla para empezar a generar promedios.';
    return;
  }

  const totals = samePlayerSheets.reduce(
    (acc, sheet) => {
      acc.points += getPointsForSheet(sheet);
      Object.keys(statLabels).forEach((key) => {
        acc[key] += safeValue(sheet.stats?.[key]);
      });
      acc.ftMade += safeValue(sheet.shots?.ft?.made);
      acc.ftAttempts += getSheetAttempts(sheet, 'ft');
      acc.twoMade += safeValue(sheet.shots?.two?.made);
      acc.twoAttempts += getSheetAttempts(sheet, 'two');
      acc.threeMade += safeValue(sheet.shots?.three?.made);
      acc.threeAttempts += getSheetAttempts(sheet, 'three');
      return acc;
    },
    {
      points: 0,
      rebounds: 0,
      assists: 0,
      secondaryAssists: 0,
      steals: 0,
      recoveries: 0,
      blocks: 0,
      turnovers: 0,
      travels: 0,
      foulsReceived: 0,
      foulsCommitted: 0,
      ftMade: 0,
      ftAttempts: 0,
      twoMade: 0,
      twoAttempts: 0,
      threeMade: 0,
      threeAttempts: 0,
    }
  );

  const games = samePlayerSheets.length;
  dom.averagesMeta.textContent = `Promedios calculados sobre ${games} planilla${games === 1 ? '' : 's'} guardada${games === 1 ? '' : 's'}.`;

  const fgMade = totals.twoMade + totals.threeMade;
  const fgAttempts = totals.twoAttempts + totals.threeAttempts;

  const averageCards = [
    ['PTS', avg(totals.points, games)],
    ['REB', avg(totals.rebounds, games)],
    ['AST', avg(totals.assists, games)],
    ['PGNF', avg(totals.secondaryAssists, games)],
    ['ROB', avg(totals.steals, games)],
    ['REC', avg(totals.recoveries, games)],
    ['TAP', avg(totals.blocks, games)],
    ['PER', avg(totals.turnovers, games)],
    ['CAM', avg(totals.travels, games)],
    ['FR', avg(totals.foulsReceived, games)],
    ['FC', avg(totals.foulsCommitted, games)],
    ['TL', `${avg(totals.ftMade, games)} / ${avg(totals.ftAttempts, games)}`],
    ['2P', `${avg(totals.twoMade, games)} / ${avg(totals.twoAttempts, games)}`],
    ['3P', `${avg(totals.threeMade, games)} / ${avg(totals.threeAttempts, games)}`],
    ['FG%', `${fgAttempts ? Math.round((fgMade / fgAttempts) * 100) : 0}%`],
  ];

  dom.averagesContent.className = 'averages-grid';
  dom.averagesContent.innerHTML = averageCards
    .map(([label, value]) => `<div class="avg-item"><span>${label}</span><strong>${value}</strong></div>`)
    .join('');
}

function bindHistoryActions() {
  dom.toggleHistory.addEventListener('click', () => {
    dom.historyPanel.classList.toggle('hidden');
  });

  dom.closeHistory.addEventListener('click', () => {
    dom.historyPanel.classList.add('hidden');
  });

  dom.historyList.addEventListener('click', (event) => {
    const loadButton = event.target.closest('[data-load-sheet]');
    const deleteButton = event.target.closest('[data-delete-sheet]');

    if (loadButton) {
      const sheet = getSavedSheets().find((item) => item.id === loadButton.dataset.loadSheet);
      if (!sheet) return;
      currentSheet = normalizeSheet(sheet);
      dom.saveFeedback.textContent = 'Planilla cargada desde el historial.';
      render();
      dom.historyPanel.classList.add('hidden');
    }

    if (deleteButton) {
      const targetId = deleteButton.dataset.deleteSheet;
      const filtered = getSavedSheets().filter((item) => item.id !== targetId);
      saveSheetsToStorage(filtered);
      dom.saveFeedback.textContent = 'Planilla eliminada.';
      render();
    }
  });
}

function bindPrimaryActions() {
  dom.saveSheet.addEventListener('click', () => {
    if (!currentSheet.playerName.trim()) {
      dom.saveFeedback.textContent = 'Poné al menos el nombre del jugador antes de guardar.';
      return;
    }

    const savedSheets = getSavedSheets();
    const index = savedSheets.findIndex((sheet) => sheet.id === currentSheet.id);
    currentSheet.updatedAt = Date.now();

    if (index >= 0) {
      savedSheets[index] = normalizeSheet(currentSheet);
    } else {
      savedSheets.push(normalizeSheet(currentSheet));
    }

    saveSheetsToStorage(savedSheets);
    dom.saveFeedback.textContent = 'Planilla guardada correctamente.';
    render();
  });

  dom.newSheet.addEventListener('click', () => {
    const hasResult = currentSheet.result.teamScore !== '' || currentSheet.result.opponentScore !== '';
    const hasData =
      currentSheet.playerName ||
      currentSheet.opponent ||
      getTotalPoints() ||
      hasResult ||
      Object.values(currentSheet.stats).some(Boolean);

    if (hasData) {
      const wantsSave = window.confirm('¿Querés guardar la planilla actual antes de reiniciar?');
      if (wantsSave) dom.saveSheet.click();
    }

    currentSheet = createEmptySheet();
    dom.saveFeedback.textContent = 'Nueva planilla lista para cargar.';
    render();
  });

  dom.shareSheet.addEventListener('click', async () => {
    try {
      const blob = await generateShareImage();
      const player = slugify(currentSheet.playerName || 'jugador');
      const rival = slugify(currentSheet.opponent || 'rival');
      const filename = `planilla-${player}-${rival}-${currentSheet.date || 'sin-fecha'}.png`;

      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Planilla individual de básquet',
          text: `${currentSheet.playerName || 'Jugador'} vs ${currentSheet.opponent || 'Rival'} · ${currentSheet.date || ''}`,
          files: [file],
        });
        dom.saveFeedback.textContent = 'Planilla compartida.';
        return;
      }

      downloadBlob(blob, filename);
      dom.saveFeedback.textContent = 'No se pudo abrir el menú de compartir; se descargó la imagen.';
    } catch (error) {
      console.error(error);
      dom.saveFeedback.textContent = 'No se pudo generar la imagen de la planilla.';
    }
  });
}

async function generateShareImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#162341');
  gradient.addColorStop(1, '#0b1220');
  ctx.fillStyle = gradient;
  ctx.fillRect(40, 40, 1000, 1520);

  ctx.fillStyle = '#f3f6fb';
  ctx.font = '700 54px Inter, Arial, sans-serif';
  ctx.fillText('Planilla individual de básquet', 80, 120);

  ctx.fillStyle = '#b3bfd3';
  ctx.font = '28px Inter, Arial, sans-serif';
  ctx.fillText(`Jugador: ${currentSheet.playerName || '—'}`, 80, 180);
  ctx.fillText(`Categoría: ${currentSheet.category || '—'}`, 80, 225);
  ctx.fillText(`Fecha: ${currentSheet.date || '—'}`, 80, 270);
  ctx.fillText(`Rival: ${currentSheet.opponent || '—'}`, 80, 315);

  const resultSummary = getResultSummary();
  ctx.fillStyle = '#d8e0ee';
  ctx.fillText(`Resultado: ${resultSummary.score} · ${resultSummary.label}`, 80, 360);

  ctx.fillStyle = '#f97316';
  roundRect(ctx, 740, 120, 220, 110, 22, true);
  ctx.fillStyle = '#fff7ed';
  ctx.font = '700 30px Inter, Arial, sans-serif';
  ctx.fillText('PUNTOS', 792, 170);
  ctx.font = '700 58px Inter, Arial, sans-serif';
  ctx.fillText(String(getTotalPoints()), 820, 220);

  drawSectionTitle(ctx, 'Tiros', 80, 440);
  drawRow(ctx, ['TL', `${currentSheet.shots.ft.made}/${getShotAttempts('ft')}`, `${getShotPct('ft')}%`, `${getShotPoints('ft')} pts`], 80, 490);
  drawRow(ctx, ['2P', `${currentSheet.shots.two.made}/${getShotAttempts('two')}`, `${getShotPct('two')}%`, `${getShotPoints('two')} pts`], 80, 555);
  drawRow(ctx, ['3P', `${currentSheet.shots.three.made}/${getShotAttempts('three')}`, `${getShotPct('three')}%`, `${getShotPoints('three')} pts`], 80, 620);

  const fg = getFgSummary();
  drawRow(ctx, ['FG', `${fg.made}/${fg.attempts}`, `${fg.pct}%`, `${fg.points} pts`], 80, 685, true);

  drawSectionTitle(ctx, 'Otras estadísticas', 80, 800);
  const statPairs = [
    ['Rebotes', currentSheet.stats.rebounds],
    ['Asistencias', currentSheet.stats.assists],
    ['Pases de gol no finalizados', currentSheet.stats.secondaryAssists],
    ['Robos', currentSheet.stats.steals],
    ['Recuperos', currentSheet.stats.recoveries],
    ['Tapas', currentSheet.stats.blocks],
    ['Pérdidas de balón', currentSheet.stats.turnovers],
    ['Caminatas', currentSheet.stats.travels],
    ['Faltas recibidas', currentSheet.stats.foulsReceived],
    ['Faltas cometidas', currentSheet.stats.foulsCommitted],
  ];

  let y = 855;
  ctx.font = '600 28px Inter, Arial, sans-serif';
  statPairs.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const baseX = column === 0 ? 90 : 570;
    const baseY = y + row * 68;
    ctx.fillStyle = '#d8e0ee';
    ctx.fillText(label, baseX, baseY);
    ctx.fillStyle = '#f3f6fb';
    ctx.fillText(String(value), baseX + 340, baseY);
  });

  const samePlayerSheets = getSavedSheets().filter(
    (sheet) => (sheet.playerName || '').trim().toLowerCase() === (currentSheet.playerName || '').trim().toLowerCase()
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px Inter, Arial, sans-serif';
  ctx.fillText(
    samePlayerSheets.length
      ? `Promedios disponibles en la app: ${samePlayerSheets.length} planilla${samePlayerSheets.length === 1 ? '' : 's'} guardada${samePlayerSheets.length === 1 ? '' : 's'}`
      : 'Todavía no hay historial guardado para este jugador.',
    80,
    1490
  );

  ctx.fillStyle = '#64748b';
  ctx.font = '22px Inter, Arial, sans-serif';
  ctx.fillText('Creado con la PWA de planilla individual', 80, 1532);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo crear el PNG'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function drawSectionTitle(ctx, title, x, y) {
  ctx.fillStyle = '#f3f6fb';
  ctx.font = '700 38px Inter, Arial, sans-serif';
  ctx.fillText(title, x, y);
}

function drawRow(ctx, columns, x, y, highlighted = false) {
  ctx.fillStyle = highlighted ? 'rgba(37, 99, 235, 0.14)' : 'rgba(255,255,255,0.03)';
  roundRect(ctx, x - 10, y - 38, 920, 50, 16, true);
  ctx.font = '600 28px Inter, Arial, sans-serif';
  ctx.fillStyle = '#f3f6fb';
  ctx.fillText(columns[0], x + 10, y - 5);
  ctx.fillText(columns[1], x + 220, y - 5);
  ctx.fillText(columns[2], x + 490, y - 5);
  ctx.fillText(columns[3], x + 700, y - 5);
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
}

function getPointsForSheet(sheet) {
  return safeValue(sheet?.shots?.ft?.made) + safeValue(sheet?.shots?.two?.made) * 2 + safeValue(sheet?.shots?.three?.made) * 3;
}

function getSheetAttempts(sheet, shotKey) {
  return safeValue(sheet?.shots?.[shotKey]?.made) + safeValue(sheet?.shots?.[shotKey]?.missed);
}

function safeValue(value) {
  return Number(value) || 0;
}

function avg(total, count) {
  return (total / count).toFixed(1);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'planilla';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('SW registration failed', error);
  });
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    dom.installApp.classList.remove('hidden');
    dom.installStatus.classList.remove('hidden');
  });

  dom.installApp.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    dom.installApp.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    dom.saveFeedback.textContent = 'La app se instaló correctamente.';
    dom.installApp.classList.add('hidden');
  });
}

function initialize() {
  bindHeaderInputs();
  bindCounterEvents();
  bindHistoryActions();
  bindPrimaryActions();
  registerServiceWorker();
  setupInstallPrompt();
  render();
}

initialize();
