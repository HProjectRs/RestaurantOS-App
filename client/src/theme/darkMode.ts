const STORAGE_KEY = 'restaurantos:darkMode';

export function isDark() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function toggleDark() {
  const next = !isDark();
  localStorage.setItem(STORAGE_KEY, String(next));
  applyDark(next);
  return next;
}

export function applyDark(enabled) {
  if (enabled) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const darkClass = 'dark';
