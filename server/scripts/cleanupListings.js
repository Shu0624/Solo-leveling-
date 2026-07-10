/**
 * One-time cleanup for Programs & Benefits listings.
 *
 * Collapses duplicate/near-duplicate entries (company aliases + title
 * variants) that the old daily AI discovery accumulated, keeping the
 * verified entry on each collision, else the earliest-added.
 *
 * DRY RUN by default — prints what it WOULD delete and changes nothing.
 * To actually delete:   node scripts/cleanupListings.js --apply
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import ProgramListing from '../models/ProgramListing.js';
import BenefitListing from '../models/BenefitListing.js';
import { dedupKey } from '../services/discoveryService.js';

const APPLY = process.argv.includes('--apply');

// Choose the keeper on a collision: verified > earliest addedAt.
const isBetter = (a, b) => {
  if (a.source === 'verified' && b.source !== 'verified') return true;
  if (b.source === 'verified' && a.source !== 'verified') return false;
  return new Date(a.addedAt || 0) <= new Date(b.addedAt || 0);
};

const cleanupCollection = async (Model, label, keyFields) => {
  const docs = await Model.find().lean();
  const keepers = new Map(); // key -> doc
  const toDelete = [];

  for (const doc of docs) {
    const key = dedupKey(doc[keyFields[0]], doc[keyFields[1]]);
    const current = keepers.get(key);
    if (!current) {
      keepers.set(key, doc);
    } else if (isBetter(doc, current)) {
      toDelete.push(current._id);
      keepers.set(key, doc);
    } else {
      toDelete.push(doc._id);
    }
  }

  console.log(`\n[${label}] total: ${docs.length}  unique: ${keepers.size}  duplicates: ${toDelete.length}`);
  if (toDelete.length && APPLY) {
    const res = await Model.deleteMany({ _id: { $in: toDelete } });
    console.log(`[${label}] deleted ${res.deletedCount} duplicate documents.`);
  } else if (toDelete.length) {
    console.log(`[${label}] DRY RUN — would delete ${toDelete.length}. Re-run with --apply to remove.`);
  }
};

(async () => {
  await connectDB();
  console.log(APPLY ? '⚠️  APPLY mode — duplicates will be deleted.' : 'ℹ️  DRY RUN — no changes will be made.');
  await cleanupCollection(ProgramListing, 'Programs', ['company', 'title']);
  await cleanupCollection(BenefitListing, 'Benefits', ['provider', 'name']);
  await mongoose.connection.close();
  console.log('\nDone.');
  process.exit(0);
})().catch((e) => {
  console.error('Cleanup failed:', e);
  process.exit(1);
});
