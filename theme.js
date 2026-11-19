const page = document.documentElement;
const preferredTheme = matchMedia('(prefers-color-scheme: dark)');
const themeKey = 'fiza-portfolio-theme';
const paletteKey = 'fiza-portfolio-palette';
const palettes = ['earth', 'sage', 'navy', 'cocoa', 'poppy'];
let chosenTheme;
const customKey = 'fiza-portfolio-custom-color';
const defaultColor = '#1f0000';

try {
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === 'dark' || savedTheme === 'light') chosenTheme = savedTheme;
} catch {
  // Appearance controls still work when storage is unavailable.
}

function rememberAppearance(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The selection still applies on this page.
  }
}

page.dataset.theme = chosenTheme ?? (preferredTheme.matches ? 'dark' : 'light');
function applyPalette(color, preset) {
  page.dataset.palette = preset ?? '';
  page.toggleAttribute('data-custom-color', Boolean(color));
  if (color) page.style.setProperty('--visitor-color', color);
  else page.style.removeProperty('--visitor-color');
}

function restorePalette() {
  let custom;
  let preset;
  try { custom = sessionStorage.getItem(customKey); } catch {}
  try { preset = localStorage.getItem(paletteKey); } catch {}
  if (custom && /^#[0-9a-f]{6}$/i.test(custom)) applyPalette(custom);
  else if (palettes.includes(preset)) applyPalette(null, preset);
  else applyPalette(defaultColor);
}

restorePalette();

function hexToHsv(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let hue = 0;
  if (delta) {
    if (max === r) hue = (g - b) / delta;
    else if (max === g) hue = 2 + (b - r) / delta;
    else hue = 4 + (r - g) / delta;
  }
  return [(hue * 60 + 360) % 360, max ? delta / max : 0, max];
}

function hsvToHex(hue, saturation, value) {
  const channel = offset => {
    const wave = (offset + hue / 60) % 6;
    const intensity = value * (1 - saturation * Math.max(0, Math.min(wave, 4 - wave, 1)));
    return Math.round(255 * intensity).toString(16).padStart(2, '0');
  };
  return '#' + [5, 3, 1].map(channel).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.theme-toggle');
  const picker = document.querySelector('.palette-picker');
  const swatches = picker?.querySelectorAll('button[data-palette]') ?? [];
  const customColor = picker.querySelector('.custom-color');
  const panel = picker.querySelector('.custom-picker');
  const plane = panel.querySelector('.color-plane');
  const hue = panel.querySelector('.color-hue');
  let hsv = hexToHsv(defaultColor);
  const themeColor = document.querySelector('meta[name="theme-color"]');
  toggle.hidden = false;
  if (picker) picker.hidden = false;

  function updateAppearance(syncPicker = true) {
    const color = page.style.getPropertyValue('--visitor-color');
    if (syncPicker) {
      const pickerColor = color || (/^#[0-9a-f]{6}$/i.test(getComputedStyle(page).getPropertyValue('--accent').trim())
        ? getComputedStyle(page).getPropertyValue('--accent').trim() : defaultColor);
      hsv = hexToHsv(pickerColor);
      updatePicker(pickerColor);
    }
    toggle.setAttribute('aria-pressed', String(page.dataset.theme === 'dark'));
    for (const swatch of swatches) {
      swatch.setAttribute('aria-pressed', String(!page.hasAttribute('data-custom-color') && swatch.dataset.palette === page.dataset.palette));
    }
    themeColor.content = getComputedStyle(page).getPropertyValue('--bg').trim();
  }

  updateAppearance();
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    restorePalette();
    updateAppearance();
  });
  toggle.addEventListener('click', () => {
    chosenTheme = page.dataset.theme === 'dark' ? 'light' : 'dark';
    page.dataset.theme = chosenTheme;
    updateAppearance();
    rememberAppearance(themeKey, chosenTheme);
  });

  for (const swatch of swatches) {
    swatch.addEventListener('click', () => {
      try { sessionStorage.removeItem(customKey); } catch {}
      applyPalette(null, swatch.dataset.palette);
      updateAppearance();
      rememberAppearance(paletteKey, page.dataset.palette);
    });
  }

  function updatePicker(color, updateHex = true) {
    if (updateHex) customColor.value = color.toUpperCase();
    hue.value = String(Math.floor(hsv[0]));
    panel.style.setProperty('--picker-color', color);
    plane.style.setProperty('--picker-hue', hsv[0]);
    plane.style.setProperty('--picker-x', hsv[1] * 100 + '%');
    plane.style.setProperty('--picker-y', (1 - hsv[2]) * 100 + '%');
  }

  function chooseColor(color) {
    try { sessionStorage.setItem(customKey, color); } catch {}
    applyPalette(color);
    updateAppearance(false);
  }

  function applyMarker() {
    const color = hsvToHex(...hsv);
    updatePicker(color);
    chooseColor(color);
  }

  customColor.addEventListener('input', () => {
    const digits = customColor.value.trim().replace(/^#/, '');
    if (!/^[0-9a-f]{6}$/i.test(digits)) return;
    const color = '#' + digits;
    hsv = hexToHsv(color);
    updatePicker(color, false);
    chooseColor(color);
  });

  customColor.addEventListener('blur', () => updatePicker(hsvToHex(...hsv)));
  hue.addEventListener('input', () => {
    hsv[0] = Number(hue.value);
    applyMarker();
  });

  const clamp = value => Math.max(0, Math.min(1, value));
  function moveMarker(event) {
    const rect = plane.getBoundingClientRect();
    hsv[1] = clamp((event.clientX - rect.left) / rect.width);
    hsv[2] = clamp(1 - (event.clientY - rect.top) / rect.height);
    applyMarker();
  }
  plane.addEventListener('pointerdown', event => {
    plane.setPointerCapture(event.pointerId);
    moveMarker(event);
  });
  plane.addEventListener('pointermove', event => {
    if (plane.hasPointerCapture(event.pointerId)) moveMarker(event);
  });
  plane.addEventListener('keydown', event => {
    const steps = { ArrowLeft: [1, -.02], ArrowRight: [1, .02], ArrowDown: [2, -.02], ArrowUp: [2, .02] };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    hsv[step[0]] = clamp(hsv[step[0]] + step[1]);
    applyMarker();
  });
  document.addEventListener('click', event => {
    if (!panel.contains(event.target)) panel.open = false;
  });
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    panel.open = false;
    panel.querySelector('summary').focus();
  });

  preferredTheme.addEventListener('change', (event) => {
    if (chosenTheme) return;

    page.dataset.theme = event.matches ? 'dark' : 'light';
    updateAppearance();
  });
});
