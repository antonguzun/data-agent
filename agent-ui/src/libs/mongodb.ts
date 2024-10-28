import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'research_db'; // Default database name

// Log which connection we're using
console.log(`Using MongoDB URI: ${MONGODB_URI}`);
console.log(`Using database: ${MONGODB_DB}`);

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function dbConnect(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db(MONGODB_DB);
  cachedClient = client;
  cachedDb = db;

  return db;
}
