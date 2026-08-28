import mongoose from 'mongoose';

/**
 * A record of detail that was moved out of the student documents and into a
 * workbook the college holds. Deliberately tiny: it exists so the console can
 * answer "what did we archive, when, and how do we get it back" without
 * keeping the archived rows themselves anywhere on the server.
 */
const dataArchiveSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    college: { type: String },
    fileName: { type: String, required: true },

    // What went into the file
    categories: { type: [String], default: [] },
    studentCount: { type: Number, default: 0 },
    rowCounts: { type: Object, default: {} },

    // Storage reclaimed, measured before the prune
    bytesFreed: { type: Number, default: 0 },
    documentsPruned: { type: Number, default: 0 },

    // Provenance — lets a restore verify it is putting back the right file
    checksum: { type: String },
    schemaVersion: { type: String },
    createdBy: { type: String },
    createdByRole: { type: String },

    restoredAt: { type: Date, default: null },
    restoredBy: { type: String, default: null },
    note: { type: String },
  },
  { timestamps: true }
);

dataArchiveSchema.index({ college: 1, department: 1, createdAt: -1 });

export default mongoose.model('DataArchive', dataArchiveSchema);
