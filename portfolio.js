const filters = document.querySelector('.filters');
if (filters) {
  const buttons = [...filters.querySelectorAll('button')];
  const projects = [...document.querySelectorAll('[data-category]')];
  const status = document.querySelector('#filter-status');

  filters.hidden = false;

  filters.addEventListener('click', (event) => {
    const selected = event.target.closest('button[data-filter]');
    if (!selected) return;

    const filter = selected.dataset.filter;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button === selected));
    }

    let visibleCount = 0;
    for (const project of projects) {
      const categories = project.dataset.category.split(' ');
      const wasHidden = project.hidden;
      project.hidden = filter !== 'all' && !categories.includes(filter);
      if (!project.hidden) {
        visibleCount += 1;
        if (wasHidden) project.classList.add('filter-enter');
      } else {
        project.classList.remove('filter-enter');
      }
    }

    status.textContent = `${visibleCount} projects shown.`;
  });
}

const insightsButton = document.querySelector('.reels-toggle');
if (insightsButton) {
  const insights = document.querySelectorAll('.reel-insights');
  function showInsights(open) {
    insightsButton.setAttribute('aria-expanded', String(open));
    insightsButton.textContent = open ? 'Hide insights' : 'Insights';
    insights.forEach(item => { item.hidden = !open; });
  }

  showInsights(false);
  insightsButton.hidden = false;
  insightsButton.addEventListener('click', () => {
    showInsights(insightsButton.getAttribute('aria-expanded') === 'false');
  });
}

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

for (const toolkit of document.querySelectorAll('.toolkit-viewport')) {
  const track = toolkit.querySelector('.tool-flow-track');
  const list = track.querySelector('.toolkit-skills');
  const extra = [...list.children].map(item => item.cloneNode(true));
  extra.forEach(item => item.setAttribute('aria-hidden', 'true'));
  list.append(...extra);
  const repeat = list.cloneNode(true);
  repeat.setAttribute('aria-hidden', 'true');
  repeat.classList.add('tool-flow-repeat');
  track.append(repeat);

  function updateToolkitMotion() {
    toolkit.classList.toggle('is-animated', !motionPreference.matches);
  }

  updateToolkitMotion();
  motionPreference.addEventListener('change', updateToolkitMotion);
}

const reels = document.querySelector('#reels-track');
if (reels) {
  const arrows = [...document.querySelectorAll('.carousel-arrow')];

  function updateArrows() {
    arrows[0].disabled = reels.scrollLeft < 2;
    arrows[1].disabled = reels.scrollLeft >= reels.scrollWidth - reels.clientWidth - 2;
  }

  arrows.forEach(arrow => {
    arrow.hidden = false;
    arrow.addEventListener('click', () => {
      const [first, second] = reels.children;
      const step = second.offsetLeft - first.offsetLeft;
      reels.scrollBy({ left: Number(arrow.dataset.step) * step, behavior: motionPreference.matches ? 'instant' : 'smooth' });
    });
  });
  reels.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  let drag;
  let suppressClick = false;
  reels.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    suppressClick = false;
    drag = { start: event.clientX, scroll: reels.scrollLeft, pointer: event.pointerId };
  });
  reels.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer || !event.buttons) return;
    const distance = event.clientX - drag.start;
    if (!suppressClick && Math.abs(distance) < 7) return;
    if (!suppressClick) {
      suppressClick = true;
      reels.setPointerCapture(event.pointerId);
      reels.classList.add('is-dragging');
    }
    reels.scrollLeft = drag.scroll - distance;
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    reels.addEventListener(type, () => {
      drag = undefined;
      reels.classList.remove('is-dragging');
    });
  }
  reels.addEventListener('click', event => {
    if (suppressClick && event.detail) event.preventDefault();
    suppressClick = false;
  }, true);
  reels.addEventListener('dragstart', event => event.preventDefault());
}

const quotes = document.querySelector('.quote-grid');
if (quotes) {
  const figures = [...quotes.querySelectorAll('figure')];
  const controls = document.querySelector('.quote-controls');
  const pause = controls.querySelector('.quote-pause');
  const dots = controls.querySelector('.quote-dots');
  let active = 0;
  let paused = motionPreference.matches;
  let timer;

  const buttons = figures.map((figure, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', figure.querySelector('strong').textContent);
    dot.addEventListener('click', () => {
      paused = true;
      showQuote(index);
      schedule();
    });
    dots.append(dot);
    return dot;
  });

  function showQuote(index) {
    active = index;
    figures.forEach((figure, i) => {
      figure.classList.toggle('is-current', i === index);
      figure.setAttribute('aria-hidden', String(i !== index));
      buttons[i].setAttribute('aria-pressed', String(i === index));
    });
  }

  function schedule() {
    clearInterval(timer);
    pause.textContent = paused ? 'Play' : 'Pause';
    if (!paused && !document.hidden && !motionPreference.matches) {
      timer = setInterval(() => showQuote((active + 1) % figures.length), 6000);
    }
  }

  quotes.classList.add('is-slider');
  controls.hidden = false;
  showQuote(0);
  schedule();
  pause.addEventListener('click', () => {
    paused = !paused;
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  motionPreference.addEventListener('change', () => {
    paused = motionPreference.matches;
    schedule();
  });
  quotes.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') clearInterval(timer);
  });
  quotes.addEventListener('pointerleave', schedule);
}

const pageHeader = document.querySelector('.navigation-bar');
const navAnchors = [...pageHeader.querySelectorAll('nav a[href^="#"]')];
const anchorTargets = navAnchors.map(link => document.getElementById(link.hash.slice(1)));
let framePending = false;

function updateScroll() {
  framePending = false;
  const progress = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  pageHeader.classList.toggle('is-compact', scrollY > (pageHeader.classList.contains('is-compact') ? 40 : 85));
  pageHeader.style.setProperty('--page-progress', Math.min(1, progress));
}

function requestScrollUpdate() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(updateScroll);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate);
window.addEventListener('load', requestScrollUpdate);
updateScroll();

if ('IntersectionObserver' in window) {
  const activeNavObserver = new IntersectionObserver(entries => {
    const current = entries.find(entry => entry.isIntersecting)?.target;
    if (!current) return;
    navAnchors.forEach((link, index) => {
      if (anchorTargets[index] === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-16% 0px -62% 0px' });
  anchorTargets.filter(Boolean).forEach(target => activeNavObserver.observe(target));

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08 });
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      if (!motionPreference.matches) animateCount(entry.target);
    });
  }, { threshold: .45 });

  if (!motionPreference.matches) document.documentElement.classList.add('motion');
  revealItems.forEach(item => {
    const siblings = [...item.parentElement.children].filter(sibling => sibling.hasAttribute('data-reveal'));
    item.style.setProperty('--reveal-delay', Math.min(siblings.indexOf(item), 4) * 90 + 'ms');
    revealObserver.observe(item);
  });
  document.querySelectorAll('[data-count]').forEach(item => countObserver.observe(item));
}

function animateCount(element) {
  const original = element.textContent;
  const target = Number(element.dataset.count);
  const suffix = original.match(/[^\d,.]+$/)?.[0] ?? '';
  const decimals = original.includes('.') ? 2 : 0;
  const format = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const start = performance.now();
  element.setAttribute('aria-label', original);

  function tick(now) {
    const elapsed = Math.min((now - start) / 850, 1);
    if (elapsed === 1 || motionPreference.matches) {
      element.textContent = original;
      return;
    }
    element.textContent = format.format(target * (1 - (1 - elapsed) ** 3)) + suffix;
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
