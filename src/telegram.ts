declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        expand(): void;
        requestFullscreen?(): void;
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
        };
        isExpanded: boolean;
        platform: string;
      };
    };
  }
}

const twa = window.Telegram?.WebApp;

export function initTelegram(): void {
  if (!twa) return;
  twa.ready();
  twa.expand();
  try { twa.requestFullscreen?.(); } catch { /* unsupported in older Telegram versions */ }
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  twa?.HapticFeedback.impactOccurred(style);
}

export function hapticNotification(type: 'error' | 'success' | 'warning'): void {
  twa?.HapticFeedback.notificationOccurred(type);
}
