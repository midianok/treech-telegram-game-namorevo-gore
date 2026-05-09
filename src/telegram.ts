declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        expand(): void;
        requestFullscreen?(): void;
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
          };
          chat?: {
            id?: number;
          };
        };
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

export interface TelegramPlayerContext {
  userId: number;
  chatId: number;
}

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

export function getTelegramPlayerContext(): TelegramPlayerContext | null {
  const userId = twa?.initDataUnsafe?.user?.id;

  if (typeof userId !== 'number') {
    return null;
  }

  return {
    userId,
    chatId: twa?.initDataUnsafe?.chat?.id ?? userId,
  };
}
