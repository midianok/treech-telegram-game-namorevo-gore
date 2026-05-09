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
          start_param?: string;
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
  const launchChatId = getLaunchChatId();

  if (typeof userId !== 'number') {
    return null;
  }

  return {
    userId,
    chatId: launchChatId ?? twa?.initDataUnsafe?.chat?.id ?? userId,
  };
}

function getLaunchChatId(): number | null {
  const startParam = twa?.initDataUnsafe?.start_param ?? getUrlStartParam();
  if (!startParam) {
    return null;
  }

  const chatId = Number(startParam);
  return Number.isSafeInteger(chatId) ? chatId : null;
}

function getUrlStartParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  const queryStartParam = params.get('tgWebAppStartParam') ?? params.get('startapp');
  if (queryStartParam) {
    return queryStartParam;
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('tgWebAppStartParam');
}
