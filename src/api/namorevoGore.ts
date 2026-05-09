import { apiFetch } from '../api';

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

const NAMOREVO_GORE_API_PATH = '/saturn-api/api/namorevo-gore';

export class NamorevoGoreApi {
  async submitScore(request: AddNamorevoGoreScoreRequest): Promise<void> {
    const response = await apiFetch(`${NAMOREVO_GORE_API_PATH}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`NamorevoGore score request failed with ${response.status}`);
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
      throw new Error(`NamorevoGore leaderboard request failed with ${response.status}`);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('NamorevoGore leaderboard response is not an array');
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
      throw new Error(`NamorevoGore user score request failed with ${response.status}`);
    }

    const data: unknown = await response.json();

    if (data === null) {
      return null;
    }

    return this.normalizeLeaderboardEntry(data);
  }

  private normalizeLeaderboardEntry(entry: unknown): NamorevoGoreLeaderboardEntry {
    if (!entry || typeof entry !== 'object') {
      throw new Error('NamorevoGore leaderboard entry is not an object');
    }

    const record = entry as Record<string, unknown>;
    const userId = Number(record.userId);
    const score = Number(record.score);

    if (!Number.isFinite(userId) || !Number.isFinite(score)) {
      throw new Error('NamorevoGore leaderboard entry contains invalid numbers');
    }

    return {
      userId,
      userName: typeof record.userName === 'string' ? record.userName : null,
      score,
    };
  }
}
