import { ERROR_MESSAGES } from './errorMessages';

export function classifyError(error) {
  if (!error) {
    return { type: 'unknown', message: 'Unknown error', code: 0, recoverable: false };
  }

  if (error.name === 'NetworkError' || error.message?.includes('NetworkError') || !navigator.onLine) {
    return { type: 'network', message: error.message, code: error.code || 0, recoverable: true };
  }

  if (error.status === 401 || error.status === 403 || error.message?.includes('unauthorized') || error.message?.includes('token')) {
    return { type: 'auth', message: error.message, code: error.status || 401, recoverable: false };
  }

  if (error.status === 422 || error.status === 400 || error.name === 'ValidationError') {
    return { type: 'validation', message: error.message, code: error.status || 422, recoverable: false };
  }

  if (error.status >= 400 && error.status < 500) {
    return { type: 'business', message: error.message, code: error.status, recoverable: false };
  }

  if (error.status >= 500) {
    return { type: 'network', message: error.message, code: error.status, recoverable: true };
  }

  return { type: 'unknown', message: error.message || 'Unknown error', code: error.code || 0, recoverable: false };
}

export function getErrorMessage(error, lang = 'ar') {
  const classified = classifyError(error);
  const messages = ERROR_MESSAGES[classified.type] || ERROR_MESSAGES.unknown;
  return messages[lang] || messages.ar || classified.message;
}

export function isRecoverable(error) {
  return classifyError(error).recoverable;
}
