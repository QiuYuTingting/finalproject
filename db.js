import { MongoClient } from 'mongodb';

const DB_NAME = 'finalproject';
const URL = 'mongodb://localhost:27017';

const client = new MongoClient(URL);

async function connectDB() {
  await client.connect();
  console.log('MongoDB connected');

  return client.db(DB_NAME);
}

const db = await connectDB();

async function shutdown() {
  await client.close();
  console.log('MongoDB closed');
  process.exit(0);
}

export {
  db,
  client,
  shutdown,
};
