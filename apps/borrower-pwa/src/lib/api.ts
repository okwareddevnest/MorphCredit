export interface ScoreRequest {
  address: string;
  amount: number;
  purpose?: string;
}

export interface ScoreResponse {
  score: number;
  limit: number;
  apr: number;
  signature: string;
  timestamp: number;
  expiresAt: number;
}

export interface ScoringError {
  error: string;
  message: string;
}

const SCORING_URL = import.meta.env.VITE_SCORING_URL || 'http://localhost:8787';

export const requestScore = async (request: ScoreRequest): Promise<ScoreResponse> => {
  try {
    const response = await fetch(`${SCORING_URL}/api/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: ScoringError = await response.json();
      throw new Error(error.message || 'Failed to request score');
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting score:', error);
    throw error;
  }
};

export const publishScoreToOracle = async (
  score: ScoreResponse,
  address: string
): Promise<string> => {
  try {
    const response = await fetch(`${SCORING_URL}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, score }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || 'Failed to publish score');
    }
    const data = await response.json();
    return data.txHash as string;
  } catch (error) {
    console.error('Error publishing score to oracle:', error);
    throw error;
  }
};

export const getScoreHistory = async (address: string): Promise<ScoreResponse[]> => {
  try {
    const response = await fetch(`${SCORING_URL}/api/score/history/${address}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch score history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching score history:', error);
    return [];
  }
}; 