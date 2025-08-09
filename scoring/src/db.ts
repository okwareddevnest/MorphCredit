import { MongoClient, Db, Collection, GridFSBucket } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  const uri = (process as any).env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/morphcredit';
  client = new MongoClient(uri);
  await client.connect();
  db = client.db((process as any).env['MONGODB_DB'] || 'morphcredit');
  return db;
}

export async function getCollection(name: string): Promise<Collection> {
  const database = await getDb();
  return database.collection(name);
}

export async function closeDb() {
  await client?.close();
  client = null;
  db = null;
}

export async function getBucket(): Promise<GridFSBucket> {
  const database = await getDb();
  return new GridFSBucket(database, { bucketName: 'avatars' });
}


