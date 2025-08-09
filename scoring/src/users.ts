import fs from 'fs';
import path from 'path';

export interface UserProfile {
  address: string;
  email?: string;
  phone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  security?: {
    twoFactor?: boolean;
    autoRepay?: boolean;
    biometric?: boolean;
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
  challenge?: string; // for WebAuthn flows
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

export function getUser(address: string): UserProfile {
  const store = readStore();
  const key = address.toLowerCase();
  if (!store[key]) {
    store[key] = { address: key };
    writeStore(store);
  }
  return store[key];
}

export function updateUser(address: string, partial: Partial<UserProfile>): UserProfile {
  const store = readStore();
  const key = address.toLowerCase();
  const existing = store[key] || { address: key };
  const updated: UserProfile = { ...existing, ...partial, address: key };
  store[key] = updated;
  writeStore(store);
  return updated;
}


