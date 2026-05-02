import mongoose from 'mongoose';

const dsaProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One record per student
    },
    classroomCode: {
      type: String,
    },
    platform: {
      type: String,
      enum: ['leetcode', 'codechef', 'hackerrank', 'gfg', 'codeforces', 'other'],
      default: 'leetcode',
    },
    profileUrl: {
      type: String,
      default: '',
    },
    easySolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    mediumSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    hardSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalScore: {
      type: Number,
      default: 0, // Weighted: Easy=1, Medium=3, Hard=5
    },
    showOnLeaderboard: {
      type: Boolean,
      default: true,
    },
    weeklyLog: [
      {
        weekStart: { type: Date },
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Leaderboard queries
dsaProgressSchema.index({ classroomCode: 1, totalScore: -1 });
dsaProgressSchema.index({ studentId: 1 });

// Pre-save hook to calculate weighted total
dsaProgressSchema.pre('save', function (next) {
  this.totalScore = (this.easySolved * 1) + (this.mediumSolved * 3) + (this.hardSolved * 5);
  next();
});

const DSAProgress = mongoose.model('DSAProgress', dsaProgressSchema);
export default DSAProgress;
