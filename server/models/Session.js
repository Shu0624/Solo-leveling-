import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classroomCode: { type: String, index: true },
    department: { type: String },
    college: { type: String },
    category: {
      type: String,
      required: true,
      enum: ['java', 'python', 'dsa', 'ai', 'aptitude', 'interview', 'resume', 'group-discussion', 'quiz', 'module', 'other']
    },
    label: { type: String, maxlength: 200 },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    totalDuration: { type: Number, default: 0 },       // seconds
    activeDuration: { type: Number, default: 0 },       // seconds (active only)
    idleDuration: { type: Number, default: 0 },         // seconds (idle only)
    status: {
      type: String,
      enum: ['active', 'paused', 'idle', 'completed', 'abandoned'],
      default: 'active'
    },
    heartbeats: { type: Number, default: 0 },
    lastHeartbeat: { type: Date },
    idleEvents: [{
      start: { type: Date },
      end: { type: Date },
      duration: { type: Number, default: 0 }            // seconds
    }],
    tabSwitches: { type: Number, default: 0 },
    focusScore: { type: Number, min: 0, max: 100 },
    source: {
      type: String,
      enum: ['manual', 'auto', 'module', 'quiz'],
      default: 'manual'
    },
    deviceInfo: {
      browser: String,
      os: String,
      screenRes: String,
    },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Fast lookups for active sessions and faculty live view
sessionSchema.index({ user: 1, status: 1 });
sessionSchema.index({ user: 1, startTime: -1 });
sessionSchema.index({ classroomCode: 1, status: 1 });

export default mongoose.model('Session', sessionSchema);
