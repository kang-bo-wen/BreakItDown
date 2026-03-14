/**
 * Scroll Narrative Engine
 *
 * 核心逻辑：
 * - 累积 wheel deltaY → 映射到场景间过渡进度 [0, 1]
 * - lerp 缓动让动画丝滑
 * - 当前场景：向上滑出 + 淡出
 * - 下一场景：从下方滑入
 * - 背景图有轻微反向 parallax
 */

const SCENES = Array.from(document.querySelectorAll('.scene'));
const TOTAL  = SCENES.length;
const PROGRESS_FILL = document.getElementById('progress-fill');

// ── 状态 ──
let rawProgress  = 0;       // 原始累积进度 [0, TOTAL-1]
let lerpProgress = 0;       // 缓动后进度
let rafId        = null;

// 每滚动多少 deltaY 对应切换一个完整场景
const SCROLL_DISTANCE = 600;

// lerp 系数：越小越"惰性"，越大越跟手
const LERP_FACTOR = 0.09;

// ── 初始化场景位置 ──
function initScenes() {
  SCENES.forEach((scene, i) => {
    if (i === 0) {
      setSceneState(scene, 0); // 当前场景完全显示
    } else {
      setSceneState(scene, 1); // 其余场景在下方待命
    }
  });
}

/**
 * 设置单个场景的视觉状态
 * @param {Element} scene
 * @param {number} t  -1=完全滑出上方  0=完全显示  1=完全在下方
 */
function setSceneState(scene, t) {
  const bg = scene.querySelector('.scene-bg');
  const content = scene.querySelector('.scene-content');

  if (t <= 0) {
    // 向上离开：t 从 0 → -1
    const exitT = -t; // 0 → 1
    const translateY = -exitT * 100;
    const opacity    = 1 - exitT * 0.6;
    const bgShift    = exitT * 8; // 背景轻微反向 parallax

    scene.style.transform  = `translateY(${translateY}%)`;
    scene.style.opacity    = opacity;
    bg.style.transform     = `scale(1.08) translateY(${bgShift}%)`;
    content.style.transform = `translateY(${exitT * -3}%)`;
    content.style.opacity   = 1 - exitT * 1.4;

  } else {
    // 从下方进入：t 从 1 → 0
    const enterT = t; // 1 → 0
    const translateY = enterT * 100;
    const opacity    = 1 - enterT * 0.3;
    const bgShift    = -enterT * 8;

    scene.style.transform  = `translateY(${translateY}%)`;
    scene.style.opacity    = opacity;
    bg.style.transform     = `scale(1.08) translateY(${bgShift}%)`;
    content.style.transform = `translateY(${enterT * 5}%)`;
    content.style.opacity   = 1 - enterT * 1.5;
  }
}

// ── 主渲染循环 ──
function render() {
  // lerp 缓动
  lerpProgress += (rawProgress - lerpProgress) * LERP_FACTOR;

  // 防止浮点漂移
  if (Math.abs(rawProgress - lerpProgress) < 0.0001) {
    lerpProgress = rawProgress;
  }

  // 更新所有场景
  SCENES.forEach((scene, i) => {
    // t = lerpProgress - i
    // t=0 → 完全显示, t=-1 → 完全滑出上方, t=1 → 完全在下方
    const t = lerpProgress - i;
    const clamped = Math.max(-1, Math.min(1, t));
    setSceneState(scene, clamped);
  });

  // 更新进度条
  const totalProgress = lerpProgress / (TOTAL - 1);
  PROGRESS_FILL.style.width = `${Math.min(100, totalProgress * 100)}%`;

  rafId = requestAnimationFrame(render);
}

// ── 滚轮事件 ──
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY / SCROLL_DISTANCE;
  rawProgress = Math.max(0, Math.min(TOTAL - 1, rawProgress + delta));
}, { passive: false });

// ── 触摸支持 ──
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const delta = (touchStartY - e.touches[0].clientY) / SCROLL_DISTANCE * 1.5;
  touchStartY = e.touches[0].clientY;
  rawProgress = Math.max(0, Math.min(TOTAL - 1, rawProgress + delta));
}, { passive: false });

// ── 键盘支持 ──
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    rawProgress = Math.min(TOTAL - 1, Math.round(rawProgress) + 1);
  }
  if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    rawProgress = Math.max(0, Math.round(rawProgress) - 1);
  }
});

// ── 启动 ──
initScenes();
render();
