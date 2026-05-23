import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { 
      type: String, 
      enum: ['mock-interview', 'group-discussion'],
      default: 'mock-interview'
    },
    roomId: { type: String, required: true },
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed'],
      default: 'waiting'
    },
    // --- AI Interview specific fields ---
    topic: { type: String, default: 'hr' },
    messagesCount: { type: Number, default: 0 },
    aiScore: { type: Number, default: 0 },
    messages: [
      {
        role: { type: String, enum: ['user', 'ai', 'assistant'] },
        text: String,
        score: Number,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    // --- End AI fields ---
    feedback: [
      {
        participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        aiScore: Number,
        fillerWords: Number,
        pace: String,
        confidence: Number,
        suggestions: [String]
      }
    ],
    recordingUrl: String,
    startedAt: Date,
    endedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('InterviewSession', sessionSchema);
