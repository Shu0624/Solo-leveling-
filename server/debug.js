import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import SavedRoadmap from './models/SavedRoadmap.js';

dotenv.config();

const run = async () => {
  await connectDB();
  try {
    const r = await SavedRoadmap.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId() },
      {
        user: new mongoose.Types.ObjectId(),
        targetRole: 'SDE',
        companyType: 'indian-product',
        experienceLevel: 'Beginner',
        totalMonths: 3,
        phases: [],
        weeklyPlan: {},
        gapAnalysis: {},
        portfolioProjects: [],
        recommendedResources: [],
        interviewFocus: []
      },
      { new: true, upsert: true }
    );
    console.log("Success:", !!r);
  } catch (e) {
    console.error("DB Error:", e.stack);
  }
  process.exit(0);
};
run();
