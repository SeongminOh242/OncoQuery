import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: './.env' });

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'oncoquery';

// keep timeouts short to avoid long hangs on remote servers
const clientOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
};

(async () => {
  try {
    console.log('Using MONGO_URI=', uri);
    console.log('Using MONGO_DB_NAME=', dbName);
    const client = new MongoClient(uri, clientOptions);
    await client.connect();
    const db = client.db(dbName);
    console.log('Connected. Database name:', db.databaseName);
    // List all databases visible to this connection
    try {
      const admin = client.db().admin();
      const dbs = await admin.listDatabases();
      console.log('Databases on server:');
      dbs.databases.forEach(d => console.log(` - ${d.name} (sizeOnDisk=${d.sizeOnDisk})`));
    } catch (e) {
      console.log('Could not list databases (may require privileges):', e.message || e);
    }

    // list collections name-only (lightweight)
    const cols = await db.listCollections({}, { nameOnly: true }).toArray();
    if (!cols || cols.length === 0) {
      console.log('No collections found in database.');
    } else {
      console.log('Collections:');
      for (const c of cols) {
        try {
          // estimatedDocumentCount is faster / cheaper than countDocuments
          const count = await db.collection(c.name).estimatedDocumentCount();
          console.log(` - ${c.name}: approx ${count}`);
          if (count > 0) {
            const sample = await db.collection(c.name).findOne();
            console.log('   sample doc keys:', Object.keys(sample || {}).slice(0, 20));
          }
        } catch (e) {
          console.log(` - ${c.name}: (error getting count/sample)`, e.message || e);
        }
      }
    }

    await client.close();
  } catch (err) {
    console.error('Error connecting to MongoDB (or timed out):', err.message || err);
    process.exit(1);
  }
})();
