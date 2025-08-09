import fs from 'fs';
import path from 'path';
import { getCollection } from './db';

export interface UserProfile {
  address: string;
  email?: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  createdAt?: number; // unix seconds
  membershipTier?: string;
  challenge?: string | null;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  security?: {
    twoFactor?: boolean;
    autoRepay?: boolean;
    biometric?: boolean;
    sessionTimeout?: number;
    requirePasswordForTransactions?: boolean;
    maxTransactionAmount?: number;
    whitelistAddresses?: string[];
  };
  preferences?: {
    currency?: string;
    language?: string;
    theme?: string;
    timezone?: string;
  };
  webauthn?: {
    credentialID?: string; // base64url
    publicKey?: string; // base64url
    counter?: number;
  };
  notificationsConfig?: {
    email?: { enabled?: boolean; frequency?: string; types?: string[] };
    push?: { enabled?: boolean; frequency?: string; types?: string[] };
    sms?: { enabled?: boolean; frequency?: string; types?: string[] };
  };
  privacy?: {
    shareAnalytics?: boolean;
    shareMarketing?: boolean;
    shareThirdParty?: boolean;
  };
}

type UserStoreShape = Record<string, UserProfile>;

const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'users.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, JSON.stringify({}), 'utf-8');
}

function readStore(): UserStoreShape {
  ensureStore();
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(raw) as UserStoreShape;
  } catch {
    return {} as UserStoreShape;
  }
}

function writeStore(data: UserStoreShape) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getUser(address: string): Promise<UserProfile> {
  const col = await getCollection('users');
  const key = address.toLowerCase();
  const doc = await col.findOne({ address: key });
  if (doc && (doc as any)['address']) return doc as unknown as UserProfile;
  const fresh: UserProfile = { address: key, createdAt: Math.floor(Date.now() / 1000) };
  await col.insertOne(fresh as any);
  return fresh;
}

export async function updateUser(address: string, partial: Partial<UserProfile>): Promise<UserProfile> {
  const col = await getCollection('users');
  const key = address.toLowerCase();
  await col.updateOne({ address: key }, { $set: partial, $setOnInsert: { address: key } }, { upsert: true });
  const updated = await col.findOne({ address: key });
  return (updated as unknown as UserProfile) || { address: key };
}


