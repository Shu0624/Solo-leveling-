import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    fileUrl: { type: String },
    parsedData: {
      name: String, email: String, phone: String,
      skills: [String],
      education: [mongoose.Schema.Types.Mixed],
      experience: [mongoose.Schema.Types.Mixed]
    },
    analysis: {
      score: { type: Number, default: 0 },
      strengths: [String],
      weaknesses: [String],
      missingKeywords: [String],
      suggestions: [String]
    },
    versions: [
      {
        fileUrl: String,
        uploadedAt: Date,
        score: Number
      }
    ]
  },
  { timestamps: true }
);

// Performance indexes for user lookup and leaderboard
resumeSchema.index({ user: 1 });
resumeSchema.index({ 'analysis.score': -1, updatedAt: -1 });

export default mongoose.model('Resume', resumeSchema);
