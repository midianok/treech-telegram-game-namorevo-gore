import i18next, { type TOptions } from 'i18next';

const DEFAULT_LANGUAGE = 'ru';

const resources = {
  ru: {
    translation: {
      app: {
        language: 'ru',
        title: 'Flappy Namor',
        description: 'Ликвидация намора',
      },
      hud: {
        bestScore: 'Лучший ликвидатор: {{score}}',
        bestScoreLoading: 'Лучший ликвидатор: ...',
        bestScoreUnavailable: 'Лучший ликвидатор: недоступен',
        gameOverHelp: 'Счет: {{score}}\nНажми R, пробел или тапни',
        leaderboardEmpty: 'Пока нет ликвидаторов',
        leaderboardError: 'Список ликвидаторов недоступен',
        leaderboardLoading: 'Загружаем список ликвидаторов...',
        leaderboardRow: '{{place}}. {{name}} - {{score}}',
        leaderboardTitle: 'ЛИКВИДАТОРЫ',
        liquidated: 'ЛИКВИДИРОВАН',
        playerFallback: 'Ликвидатор {{userId}}',
        startPrompt: 'Нажми пробел, кликни или тапни',
      },
      log: {
        failedToLoadUserScore: 'Failed to load NamorevoGore user score',
        failedToSyncLeaderboard: 'Failed to sync NamorevoGore leaderboard',
        failedToSyncUserScore: 'Failed to sync NamorevoGore user score',
      },
      api: {
        invalidLeaderboardEntryNumbers: 'NamorevoGore leaderboard entry contains invalid numbers',
        leaderboardEntryNotObject: 'NamorevoGore leaderboard entry is not an object',
        leaderboardRequestFailed: 'NamorevoGore leaderboard request failed with {{status}}',
        leaderboardResponseNotArray: 'NamorevoGore leaderboard response is not an array',
        scoreRequestFailed: 'NamorevoGore score request failed with {{status}}',
        userScoreRequestFailed: 'NamorevoGore user score request failed with {{status}}',
      },
    },
  },
} as const;

void i18next.init({
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  lng: DEFAULT_LANGUAGE,
  resources,
});

export function t(key: string, options?: TOptions): string {
  return i18next.t(key, options);
}
