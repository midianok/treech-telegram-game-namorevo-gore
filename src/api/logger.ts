import { apiFetch } from '../api';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SOURCE = 'namorevo-gore';

function send(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const body = {
    source: SOURCE,
    level,
    message,
    data: data !== undefined ? JSON.stringify(data) : undefined,
  };

  apiFetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Logging is best-effort; swallow network errors silently
  });
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => send('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => send('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => send('error', message, data),
};
