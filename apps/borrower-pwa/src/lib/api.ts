export interface ScoreRequest {
  address: string;
}

export interface ScoreReport {
  score: number;
  pd_bps: number;
  featuresRoot: `0x${string}`;
  expiry: number; // seconds
  sig: `0x${string}`;
}

export interface ScoreApiData {
  report: ScoreReport;
  scoring: {
    score: number;
    pd_bps: number;
    tier: 'A' | 'B' | 'C' | 'D' | 'E';
    confidence: number;
    features: Record<string, unknown>;
  };
  metadata: {
    generatedAt: string;
    oracle: string;
    expiresAt: string;
  };
}

export interface ScoreApiResponse {
  success: boolean;
  data?: ScoreApiData;
  error?: string;
}

const SCORING_URL = import.meta.env.VITE_SCORING_URL || 'http://localhost:8787';

export const requestScore = async (request: ScoreRequest): Promise<ScoreApiData> => {
  try {
    const response = await fetch(`${SCORING_URL}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const json = (await response.json()) as ScoreApiResponse;
    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Failed to request score');
    }

    return json.data;
  } catch (error) {
    console.error('Error requesting score:', error);
    throw error;
  }
};

export const publishScoreToOracle = async (
  address: string,
  report: ScoreReport
): Promise<string> => {
  try {
    const response = await fetch(`${SCORING_URL}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, score: report }),
    });
    const data = await response.json().catch(() => ({} as any));
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to publish score');
    }
    return data.txHash as string;
  } catch (error) {
    console.error('Error publishing score to oracle:', error);
    throw error;
  }
};

// User profile endpoints (backed by scoring service simple store)
export interface UserProfile {
  address: string;
  email?: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  createdAt?: number;
  membershipTier?: string;
  memberSinceDays?: number;
  notifications?: { email?: boolean; push?: boolean; sms?: boolean };
  security?: { twoFactor?: boolean; autoRepay?: boolean; biometric?: boolean };
  preferences?: { currency?: string; language?: string; theme?: string; timezone?: string };
}

export const getUserProfile = async (address: string): Promise<UserProfile> => {
  const res = await fetch(`${SCORING_URL}/user/${address}`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load profile');
  return json.data as UserProfile;
};

export const saveUserProfile = async (address: string, partial: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await fetch(`${SCORING_URL}/user/${address}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial)
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save profile');
  return json.data as UserProfile;
};