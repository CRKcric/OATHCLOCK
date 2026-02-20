/* ============================================================
   OATHCLOCK — app.js
   ============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════════ */
let tasks        = [];
let streak       = 0;
let activeId     = null;
let timerIv      = null;
let idleIv       = null;
let secLeft      = 0;
let totalSec     = 0;
let phase        = 'idle';
let idleSec      = 0;
let halfFired    = false;
let lectureShown = false;


/* ════════════════════════════════════════════════════════════
   MESSAGE POOLS
═══════════════════════════════════════════════════════════════ */
const M = {
  idle: [
    "You opening the task or just building emotional attachment to it?",
    "It's been a moment. Are we brainstorming or buffering?",
    "Still preparing? Olympic athletes train less.",
    "You said you wanted discipline. I'm still waiting.",
    "The task isn't avoiding you. You're avoiding it.",
    "Ohhh I get it. We're in the 'thinking about it' phase. Classic.",
    "Is the hesitation aesthetic?",
  ],
  idleLong: [
    "This is getting embarrassing.",
    "We both know you could've started by now.",
    "You're not confused. You're stalling.",
    "At this point it's a hobby.",
  ],
  run: [
    "Oh?? We're serious now?",
    "Finally. Took you long enough.",
    "Okay. Let's see if this lasts.",
    "Big move. Now back it up.",
    "No quitting mid-way. I'm watching.",
    "Confidence is cute. Execution is better.",
  ],
  half: [
    "Halfway. Don't suddenly discover Instagram.",
    "This is where weak focus collapses.",
    "Stay locked in. Or prove me right.",
    "You still in control?",
    "Momentum or meltdown. Pick one.",
    "This is the test. Not the start.",
  ],
  warn: [
    "Ah. This is where you usually start negotiating with yourself.",
    "Still confident? Or rehearsing excuses?",
    "You're close. Don't suddenly lose personality.",
    "Focus. I'd hate to be right about you.",
    "This is the part where discipline pretends to disappear.",
    "You're not about to fold… right?",
  ],
  crit: [
    "Almost there. Don't you dare.",
    "Every second is a choice. Choose well.",
    "You've come too far to collapse now.",
    "This is the moment. Stay.",
  ],
  congrats: [
    "The system is proud of you. Genuinely.",
    "You actually did it. Look at you go.",
    "That's commitment. Rare. Keep it.",
    "The oath held. Streak continues.",
    "Yes. THAT is who you are.",
  ],
  redeem: [
    "Let's pretend that never happened, okay? 🌸",
    "You stumbled. Stumbles don't define streaks. ✨",
    "Back to zero, fresh start. The clock believes in you. 💙",
    "Okay okay we don't talk about that. New round. Go! 🎮",
    "Shhhh. It's fine. Begin again, champion. 🌟",
  ],
};

const pick = arr => arr[Math.floor(Math.random() * arr.length)];


/* ════════════════════════════════════════════════════════════
   DOM REFERENCES
═══════════════════════════════════════════════════════════════ */
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelector(sel);

const $left        = $('left');
const $right       = $('right');
const $timer       = $('timer');
const $timerBox    = $('timer-box');
const $status      = $('status-label');
const $msgTxt      = $('message-text');
const $msgBox      = $('message-box');
const $sysWarn     = $('sys-warning-label');
const $taskList    = $('task-list');
const $maxWarn     = $('max-warn');
const $streakNum   = $('streak-num');
const $btnAdd      = $('btn-add');
const $btnComplete = $('btn-complete');
const $failOv      = $('fail-overlay');
const $lectureBox  = $('lecture-box');
const $lectureTxt  = $('lecture-txt');
const $btnRdmReal  = $('btn-rdm-real');
const $btnRdm      = $('btn-rdm');
const $inName      = $('in-name');
const $inDur       = $('in-dur');

const $iconDefault = $$('#theme-icon .theme-default');
const $iconFailure = $$('#theme-icon .theme-failure');

// Root element — CSS custom properties live here
const ROOT = document.documentElement;


/* ════════════════════════════════════════════════════════════
   THEME SHIFT ENGINE
═══════════════════════════════════════════════════════════════ */

const PALETTE = {
 
  neon: {
    accent:   [0,   207, 255],   // #00cfff
    panelBg:  [7,   12,  24],    // #070c18
    rightBg:  [6,   11,  20],    // #060b14
    text:     [192, 221, 240],   // #c0ddf0
  },
  doom: {
    accent:   [220, 20,  60],    
    panelBg:  [12,  2,   8],     
    rightBg:  [10,  1,   6],
    text:     [240, 200, 200],   
  },
};

function easeIn3(t) { return t * t * t; }

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpRGB(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function applyPageShift(pct) {
  // Page shift begins at 70% remaining, reaches full doom at ~5%
  const FADE_START = 0.70;
  const FADE_END   = 0.05;

  const raw      = pct >= FADE_START ? 0
    : pct <= FADE_END   ? 1
    : (FADE_START - pct) / (FADE_START - FADE_END);
  const progress = easeIn3(raw);  // ease-in so it creeps at first

  // Interpolate colour triplets
  const accent  = lerpRGB(PALETTE.neon.accent,  PALETTE.doom.accent,  progress);
  const panelBg = lerpRGB(PALETTE.neon.panelBg, PALETTE.doom.panelBg, progress);
  const rightBg = lerpRGB(PALETTE.neon.rightBg, PALETTE.doom.rightBg, progress);
  const text    = lerpRGB(PALETTE.neon.text,     PALETTE.doom.text,    progress);

  // Border & glow fade from subtle to intense
  const borderA = lerp(0.20, 0.55, progress);
  const glowA   = lerp(0.35, 0.70, progress);
  const textDimA = lerp(0.38, 0.55, progress);

  ROOT.style.setProperty('--live-accent',      accent.join(', '));
  ROOT.style.setProperty('--live-panel-bg',    panelBg.join(', '));
  ROOT.style.setProperty('--live-right-bg',    rightBg.join(', '));
  ROOT.style.setProperty('--live-text',        text.join(', '));
  ROOT.style.setProperty('--live-border-a',    borderA.toFixed(3));
  ROOT.style.setProperty('--live-glow-a',      glowA.toFixed(3));
  ROOT.style.setProperty('--live-text-dim-a',  textDimA.toFixed(3));

  // Theme icon crossfade 
  const ICON_START = 0.60;
  const iconRaw    = pct >= ICON_START ? 0 : (ICON_START - pct) / ICON_START;
  const iconP      = iconRaw * iconRaw; // quadratic ease

  if ($iconDefault) $iconDefault.style.opacity = String(1 - iconP);
  if ($iconFailure) $iconFailure.style.opacity = String(iconP);
}

/* resetPageShift — snaps all CSS vars back to neon-blue defaults.*/
function resetPageShift() {
  const n = PALETTE.neon;
  ROOT.style.setProperty('--live-accent',      n.accent.join(', '));
  ROOT.style.setProperty('--live-panel-bg',    n.panelBg.join(', '));
  ROOT.style.setProperty('--live-right-bg',    n.rightBg.join(', '));
  ROOT.style.setProperty('--live-text',        n.text.join(', '));
  ROOT.style.setProperty('--live-border-a',    '0.20');
  ROOT.style.setProperty('--live-glow-a',      '0.35');
  ROOT.style.setProperty('--live-text-dim-a',  '0.38');

  if ($iconDefault) $iconDefault.style.opacity = '1';
  if ($iconFailure) $iconFailure.style.opacity = '0';
}

/*pinPageToDoom — called at failure.*/
function pinPageToDoom() {
  const d = PALETTE.doom;
  ROOT.style.setProperty('--live-accent',      d.accent.join(', '));
  ROOT.style.setProperty('--live-panel-bg',    d.panelBg.join(', '));
  ROOT.style.setProperty('--live-right-bg',    d.rightBg.join(', '));
  ROOT.style.setProperty('--live-text',        d.text.join(', '));
  ROOT.style.setProperty('--live-border-a',    '0.60');
  ROOT.style.setProperty('--live-glow-a',      '0.80');
  ROOT.style.setProperty('--live-text-dim-a',  '0.60');

  if ($iconDefault) $iconDefault.style.opacity = '0';
  if ($iconFailure) $iconFailure.style.opacity = '1';
}


/* ════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function setMsg(text) { $msgTxt.textContent = text; }

function esc(str) {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmt(s) {
  const h   = String(Math.floor(s / 3600)).padStart(2, '0');
  const m   = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function uid() { return Math.random().toString(36).slice(2, 8); }


/* ════════════════════════════════════════════════════════════
   TASK HELPERS
═══════════════════════════════════════════════════════════════ */
function getTaskStatus(task) {
  if (task.completed)       return 'done';
  if (activeId === task.id) return 'run';
  if (activeId)             return 'queued';
  return 'idle';
}

function makeBadge(s) {
  if (s === 'done')   return '<span class="t-badge badge-done">✓</span>';
  if (s === 'run')    return '<span class="t-badge badge-run">...</span>';
  if (s === 'queued') return '<span class="t-badge badge-q">!</span>';
  return '';
}


/* ════════════════════════════════════════════════════════════
   RENDER TASKS
═══════════════════════════════════════════════════════════════ */
function render() {
  const failed = phase === 'failed';

  if (!tasks.length) {
    $taskList.innerHTML = '<div class="no-tasks">NO TASKS COMMITTED YET</div>';
  } else {
    $taskList.innerHTML = tasks.map(task => {
      const s = getTaskStatus(task);
      const cls = [
        'task-card',
        s === 'run'    ? 'tc-running'  : '',
        s === 'queued' ? 'tc-queued'   : '',
        s === 'done'   ? 'tc-done'     : '',
        failed && s !== 'done' ? 'tc-disabled' : '',
      ].filter(Boolean).join(' ');

      const startDis = failed || !!activeId || task.completed;

      return `
        <div class="${cls}" id="card-${task.id}">
          <div class="task-top">
            <div class="task-name" title="${esc(task.name)}">${esc(task.name)}</div>
            ${makeBadge(s)}
          </div>
          <div class="task-dur">${task.duration} MIN</div>
          <div class="task-actions">
            <button class="btn-start${s === 'run' ? ' is-running' : ''}"
              onclick="startTask('${task.id}')" ${startDis ? 'disabled' : ''}>
              ${s === 'run' ? '▶ ACTIVE' : '▶ START'}
            </button>
            ${s === 'run'
              ? `<button class="btn-done" onclick="markComplete()">✓</button>`
              : `<button class="btn-del" onclick="deleteTask('${task.id}')">✕</button>`
            }
          </div>
        </div>`;
    }).join('');
  }

  $maxWarn.classList.toggle('visible', tasks.length >= 3);
  $btnAdd.disabled = tasks.length >= 3;
}


/* ════════════════════════════════════════════════════════════
   ADD / DELETE TASK
═══════════════════════════════════════════════════════════════ */
function addTask() {
  const name     = $inName.value.trim();
  const duration = parseInt($inDur.value);
  if (!name || !duration || duration < 1 || tasks.length >= 3) return;
  tasks.push({ id: uid(), name, duration, completed: false });
  $inName.value = '';
  $inDur.value  = '';
  render();
  startIdleMon();
}

$inName.addEventListener('keydown', ev => { if (ev.key === 'Enter') addTask(); });
$inDur.addEventListener('keydown',  ev => { if (ev.key === 'Enter') addTask(); });

function deleteTask(id) {
  if (activeId === id) stopTimer(true);
  tasks = tasks.filter(t => t.id !== id);
  render();
  if (!tasks.length) { stopIdleMon(); setPhase('idle'); }
}


/* ════════════════════════════════════════════════════════════
   START TASK
═══════════════════════════════════════════════════════════════ */
function startTask(id) {
  if (phase === 'failed' || activeId) return;
  const task = tasks.find(t => t.id === id);
  if (!task || task.completed) return;

  stopIdleMon();
  activeId  = id;
  totalSec  = task.duration * 60;
  secLeft   = totalSec;
  halfFired = false;

  setPhase('run');
  render();
  updateTimerDisplay();

  timerIv = setInterval(() => {
    secLeft--;
    if (secLeft <= 0) {
      secLeft = 0;
      updateTimerDisplay();
      triggerFail();
      return;
    }
    updateTimerDisplay();
    checkPhase();
  }, 1000);
}

function stopTimer(clearActive = true) {
  clearInterval(timerIv);
  timerIv = null;
  if (clearActive) activeId = null;
}

function updateTimerDisplay() { $timer.textContent = fmt(secLeft); }

/* ════════════════════════════════════════════════════════════
   CHECK PHASE — called every tick
═══════════════════════════════════════════════════════════════ */
function checkPhase() {
  const pct = secLeft / totalSec;

  // ── Full-page colour shift ──
  applyPageShift(pct);

  // ── Timer digit colour: neon → orange between 100% and 25% ──
  if (phase === 'run' && pct > 0.25) {
    const prog = (1 - pct) / 0.75;            
    const r = Math.round(  0 + 255 * prog);  
    const g = Math.round(207 -  67 * prog);   
    const b = Math.round(255 * (1  - prog));  
    $timer.style.color      = `rgb(${r},${g},${b})`;
    $timer.style.textShadow = `0 0 30px rgba(${r},${g},${b},0.55)`;
  }

  // ── Halfway message ──
  if (!halfFired && pct <= 0.5) {
    halfFired = true;
    setMsg(pick(M.half));
  }

  // ── Phase class transitions ──
  if      (pct <= 0.10 && phase !== 'crit') setPhase('crit');
  else if (pct <= 0.25 && pct > 0.10 && phase !== 'warn') setPhase('warn');
}


/* ════════════════════════════════════════════════════════════
   SET PHASE
═══════════════════════════════════════════════════════════════ */
function setPhase(p) {
  phase = p;

  $timer.classList.remove('warn', 'critical', 'failed');
  $timerBox.classList.remove('warn', 'critical', 'failed');
  $msgBox.classList.remove('warn', 'critical', 'congrats');
  $sysWarn.classList.remove('visible');
  $btnComplete.classList.remove('visible');
  $left.classList.remove('failed');
  $right.classList.remove('failed');

  // Only clear inline overrides when not in a gradient-driven phase
  if (p !== 'warn' && p !== 'crit') {
    $timer.style.color      = '';
    $timer.style.textShadow = '';
  }

  switch (p) {

    case 'idle':
      resetPageShift();
      $status.textContent = 'THE CLOCK AWAITS...';
      setMsg('The clock awaits...');
      $timer.textContent = '00:00:00';
      break;

    case 'run':
      $status.textContent = '▶ OATH IN PROGRESS';
      setMsg(pick(M.run));
      $btnComplete.classList.add('visible');
      break;

    case 'warn':
      $timer.classList.add('warn');
      $timerBox.classList.add('warn');
      $msgBox.classList.add('warn');
      $status.textContent = '⚠ CAUTION ZONE';
      setMsg(pick(M.warn));
      $btnComplete.classList.add('visible');
      break;

    case 'crit':
      $timer.classList.add('critical');
      $timerBox.classList.add('critical');
      $msgBox.classList.add('critical');
      $sysWarn.classList.add('visible');
      $status.textContent = '🚨 CRITICAL';
      setMsg(pick(M.crit));
      $btnComplete.classList.add('visible');
      break;

    case 'failed':
      pinPageToDoom();
      $timer.classList.add('failed');
      $timerBox.classList.add('failed');
      $msgBox.classList.add('critical');
      $sysWarn.classList.add('visible');
      $status.textContent = '💀 OATH BROKEN';
      setMsg('THE OATH IS BROKEN.');
      $left.classList.add('failed');
      $right.classList.add('failed');
      break;

    case 'redeem':
      resetPageShift();
      $timer.style.color      = '';
      $timer.style.textShadow = '';
      $status.textContent = 'THE CLOCK AWAITS...';
      setMsg(pick(M.redeem));
      $timer.textContent = '00:00:00';
      break;
  }
}


/* ════════════════════════════════════════════════════════════
   MARK COMPLETE
═══════════════════════════════════════════════════════════════ */
function markComplete() {
  if (!activeId || phase === 'failed') return;
  const task = tasks.find(t => t.id === activeId);
  if (!task) return;

  stopTimer(true);
  task.completed = true;
  streak++;
  $streakNum.textContent = streak;

  $timer.classList.remove('warn', 'critical', 'failed');
  $timerBox.classList.remove('warn', 'critical', 'failed');
  $timer.style.color      = '';
  $timer.style.textShadow = '';
  $msgBox.classList.remove('warn', 'critical');
  $msgBox.classList.add('congrats');
  $sysWarn.classList.remove('visible');
  $btnComplete.classList.remove('visible');
  $left.classList.remove('failed');
  $right.classList.remove('failed');
  $status.textContent = '✓ COMPLETE';
  setMsg(pick(M.congrats));

  // Fade the page back to neon (CSS 4s transition handles the soft return)
  resetPageShift();

  phase = 'run';
  launchConfetti();
  render();
  startIdleMon();
}


/* ════════════════════════════════════════════════════════════
   TRIGGER FAILURE
═══════════════════════════════════════════════════════════════ */
function triggerFail() {
  stopTimer(true);
  setPhase('failed');

  streak = 0;
  $streakNum.textContent = streak;
  $streakNum.classList.add('reset');
  setTimeout(() => $streakNum.classList.remove('reset'), 1000);

  render();
  setTimeout(() => $failOv.classList.add('visible'), 700);
}


/* ════════════════════════════════════════════════════════════
   REDEEM FLOW
═══════════════════════════════════════════════════════════════ */
function showLecture() {
  if (lectureShown) return;
  lectureShown = true;
  $btnRdm.style.display = 'none';
  $lectureBox.classList.add('visible');
  setTimeout(() => $btnRdmReal.classList.add('visible'), 1100);
}

function redeemReal() {
  lectureShown = false;
  $lectureBox.classList.remove('visible');
  $btnRdmReal.classList.remove('visible');
  $btnRdm.style.display = '';
  $failOv.classList.remove('visible');
  activeId = null;

  setTimeout(() => {
    setPhase('redeem');
    render();
    startIdleMon();
  }, 400);
}


/* ════════════════════════════════════════════════════════════
   IDLE MONITOR
═══════════════════════════════════════════════════════════════ */
function startIdleMon() {
  stopIdleMon();
  idleSec = 0;
  if (!tasks.length || activeId) return;

  idleIv = setInterval(() => {
    idleSec++;
    if (!['idle', 'redeem', 'run'].includes(phase)) return;
    if      (idleSec === 25)                       setMsg(pick(M.idle));
    else if (idleSec === 80)                       setMsg(pick(M.idle));
    else if (idleSec === 160)                      setMsg(pick(M.idleLong));
    else if (idleSec === 280)                      setMsg(pick(M.idleLong));
    else if (idleSec > 280 && idleSec % 60 === 0) setMsg(pick(M.idleLong));
  }, 1000);
}

function stopIdleMon() { clearInterval(idleIv); idleIv = null; }


/* ════════════════════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════════════════════ */
function launchConfetti() {
  const layer  = $('confetti-layer');
  const colors = ['#00cfff','#00ff88','#ffd700','#ff69b4','#a78bff','#00e5ff','#fff'];
  for (let i = 0; i < 90; i++) {
    const dot = document.createElement('div');
    dot.className = 'cdot';
    dot.style.left             = Math.random() * 100 + 'vw';
    dot.style.top              = '-12px';
    dot.style.width            = (5 + Math.random() * 9) + 'px';
    dot.style.height           = (5 + Math.random() * 9) + 'px';
    dot.style.background       = colors[Math.floor(Math.random() * colors.length)];
    dot.style.animationDuration = (1.4 + Math.random() * 2.2) + 's';
    dot.style.animationDelay   = (Math.random() * 0.9) + 's';
    layer.appendChild(dot);
    setTimeout(() => dot.remove(), 3800);
  }
}


/* ════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
render();