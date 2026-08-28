import mongoose from 'mongoose';
import dns from 'dns';

// Safe DNS configuration (bypasses local DNS resolution issues on Windows, but doesn't crash serverless runtimes)
try {
  dns.setDefaultResultOrder('ipv4first');
  if (typeof dns.setServers === 'function') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  }
} catch (dnsErr) {
  // DNS override not supported or permitted in this environment — proceed with defaults
  console.warn('[DB] Custom DNS setup skipped:', dnsErr.message);
}

// Global cached connection for serverless environments (e.g. Vercel, AWS Lambda)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠️  [DB] MONGO_URI is not set. Database features will be unavailable.');
    return null;
  }

  // If already connected, reuse connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      bufferCommands: false, // Return error immediately if disconnected instead of hanging
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`[DB] MongoDB Connected: ${m.connection.host}`);
      return m.connection;
    }).catch((err) => {
      cached.promise = null;
      console.error(`[DB] Error connecting to MongoDB: ${err.message}`);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    return null;
  }
};

export default connectDB;
