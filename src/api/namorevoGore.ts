import { apiFetch } from '../api';
import { t } from '../i18n';

export interface AddNamorevoGoreScoreRequest {
  userId: number;
  chatId: number;
  score: number;
}

export interface NamorevoGoreLeaderboardEntry {
  userId: number;
  userName: string | null;
  score: number;
}

const NAMOREVO_GORE_API_PATH = '/api/namorevo-gore';

export class NamorevoGoreApi {
  async submitScore(request: AddNamorevoGoreScoreRequest): Promise<void> {
    const RETRY_DELAYS_MS = [300, 600];

    for (let attempt = 0; ; attempt++) {
      try {
        const response = await apiFetch(`${NAMOREVO_GORE_API_PATH}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          keepalive: true,
        });

        if (response.ok) return;
        throw new Error(t('api.scoreRequestFailed', { status: response.status }));
      } catch (error) {
        if (attempt >= RETRY_DELAYS_MS.length) throw error;
        await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      }
    }
  }

  async getLeaderboard(limit = 10): Promise<NamorevoGoreLeaderboardEntry[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    const response = await apiFetch(`${NAMOREVO_GORE_API_PATH}/leaderboard?${params}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(t('api.leaderboardRequestFailed', { status: response.status }));
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(t('api.leaderboardResponseNotArray'));
    }

    return data.map((entry) => this.normalizeLeaderboardEntry(entry));
  }

  async getUserScore(userId: number): Promise<NamorevoGoreLeaderboardEntry | null> {
    const response = await apiFetch(`${NAMOREVO_GORE_API_PATH}/score/${userId}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(t('api.userScoreRequestFailed', { status: response.status }));
    }

    const data: unknown = await response.json();

    if (data === null) {
      return null;
    }

    return this.normalizeLeaderboardEntry(data);
  }

  private normalizeLeaderboardEntry(entry: unknown): NamorevoGoreLeaderboardEntry {
    if (!entry || typeof entry !== 'object') {
      throw new Error(t('api.leaderboardEntryNotObject'));
    }

    const record = entry as Record<string, unknown>;
    const userId = Number(record.userId);
    const score = Number(record.score);

    if (!Number.isFinite(userId) || !Number.isFinite(score)) {
      throw new Error(t('api.invalidLeaderboardEntryNumbers'));
    }

    return {
      userId,
      userName: typeof record.userName === 'string' ? record.userName : null,
      score,
    };
  }
}
