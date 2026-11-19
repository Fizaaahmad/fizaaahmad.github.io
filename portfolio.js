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

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const sections = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0 });

  document.documentElement.classList.add('motion');
  for (const section of sections) revealObserver.observe(section);
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

const toolkit = document.querySelector('.toolkit-viewport');
if (toolkit) {
  const track = toolkit.querySelector('.tool-flow-track');
  const repeat = toolkit.querySelector('.toolkit-skills').cloneNode(true);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  repeat.setAttribute('aria-hidden', 'true');
  repeat.classList.add('tool-flow-repeat');
  track.append(repeat);

  function updateToolkitMotion() {
    toolkit.classList.toggle('is-animated', !motion.matches);
  }

  updateToolkitMotion();
  motion.addEventListener('change', updateToolkitMotion);
}
