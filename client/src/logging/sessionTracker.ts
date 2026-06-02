import { logger } from './logger';

const SESSION_KEY = 'restaurantos:sessionId';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function startSession() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  logger.info('Session started', { sessionId });
  return sessionId;
}

export function trackEvent(eventName, data = {}) {
  const sessionId = getSessionId();
  logger.debug(`Event: ${eventName}`, { ...data, sessionId, eventName });
}

export function getSessionId() {
  return sessionStorage.getItem(SESSION_KEY) || 'no-session';
}

export function endSession() {
  const sessionId = getSessionId();
  logger.info('Session ended', { sessionId, duration: document.timeline?.currentTime || 0 });
  sessionStorage.removeItem(SESSION_KEY);
}

export function setupAutoTracking() {
  startSession();

  window.addEventListener('beforeunload', () => {
    trackEvent('page_exit', { url: window.location.href });
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const label = target.getAttribute('data-track') || target.textContent?.trim()?.slice(0, 50) || 'unknown';
    trackEvent('click', { label, tag: target.tagName });
  });

  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    trackEvent('form_submit', { id: form.id, action: form.action });
  });
}
