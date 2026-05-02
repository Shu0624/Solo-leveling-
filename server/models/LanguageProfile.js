import mongoose from 'mongoose';

const languageProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentLanguage: {
      type: String,
      enum: ['German', 'Japanese', 'French', 'Spanish', 'Mandarin'],
      default: 'German',
    },
    totalXP: {
      type: Number,
      default: 0,
    },
    eloRating: {
      type: Number,
      default: 800, // Starting Elo
    },
    unlockedScenarios: [
      {
        type: String, // e.g., 'Coffee Shop', 'Tech Interview'
      }
    ],
    phase1Progress: {
      type: Map,
      of: [String], // e.g., { "German": ["alphabet", "vocabulary"], "Japanese": ["alphabet"] }
      default: new Map(),
    }
  },
  {
    timestamps: true,
  }
);

const LanguageProfile = mongoose.model('LanguageProfile', languageProfileSchema);
export default LanguageProfile;
