import mongoose from 'mongoose';

const dailyAnalyticsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classroomCode: { type: String, index: true },
    department: { type: String },
    college: { type: String },
    date: { type: Date, required: true },                    // midnight-normalized
    totalTime: { type: Number, default: 0 },                 // seconds
    activeTime: { type: Number, default: 0 },
    idleTime: { type: Number, default: 0 },
    sessionCount: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },                // 0–100 avg
    productivityScore: { type: Number, default: 0 },         // 0–100 composite
    consistency: {
      type: String,
      enum: ['high', 'medium', 'low', 'none'],
      default: 'none'
    },
    categoryBreakdown: [{
      category: String,
      duration: Number,                                       // seconds
      sessions: Number,
    }],
    peakHours: [{
      hour: Number,                                           // 0–23
      minutes: Number,                                        // total minutes in that hour
    }],
    tabSwitches: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One record per user per day — upsert pattern
dailyAnalyticsSchema.index({ user: 1, date: -1 }, { unique: true });
dailyAnalyticsSchema.index({ classroomCode: 1, date: -1 });

export default mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
