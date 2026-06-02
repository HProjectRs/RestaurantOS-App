import { VITE_API_URL, VITE_APP_ENV } from '../config/env';

const SESSION_ID_KEY = 'restaurantos:sessionId';

function getSessionId() {
  return sessionStorage.getItem(SESSION_ID_KEY) || 'no-session';
}

function getUserId() {
  try {
    const raw = localStorage.getItem('restaurantos:user');
    return raw ? JSON.parse(raw).id : 'anonymous';
  } catch {
    return 'anonymous';
  }
}

function getPageUrl() {
  return window.location?.href || '';
}

function buildEntry(level, message, context = {}) {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    userId: getUserId(),
    sessionId: getSessionId(),
    url: getPageUrl(),
  };
}

function sendToServer(entry) {
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(entry)], { type: 'application/json' });
    navigator.sendBeacon(`${VITE_API_URL}/logs`, blob);
  } else {
    fetch(`${VITE_API_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch(() => {});
  }
}

function log(level, message, context = {}) {
  const entry = buildEntry(level, message, context);

  if (VITE_APP_ENV === 'development') {
    const styles = {
      info: 'color: #3b82f6; font-weight: bold;',
      warn: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;',
      debug: 'color: #6b7280; font-style: italic;',
    };
    console.log(`%c[${level.toUpperCase()}]`, styles[level] || '', message, context);
  } else {
    sendToServer(entry);
  }
}

export const logger = {
  log,
  info: (msg, ctx) => log('info', msg, ctx),
  warn: (msg, ctx) => log('warn', msg, ctx),
  error: (msg, ctx) => log('error', msg, ctx),
  debug: (msg, ctx) => log('debug', msg, ctx),
};
