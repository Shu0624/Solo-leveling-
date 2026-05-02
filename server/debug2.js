import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { generateRoadmap } from './services/aiService.js';
import SavedRoadmap from './models/SavedRoadmap.js';

dotenv.config();

const run = async () => {
  await connectDB();
  try {
    const profile = {
      skills: ['react', 'node'],
      resumeScore: 80,
      quizScores: {},
      targetRole: 'Frontend',
      targetMonths: 6,
      experienceLevel: 'Intermediate (1-3 years)',
      specificGoals: 'test',
      companyType: 'indian-services'
    };

    console.log("Calling generateRoadmap...");
    const roadmap = await generateRoadmap(profile);
    console.log("generateRoadmap succeeded. Roadmap:");
    console.log(roadmap);

    console.log("Calling findOneAndUpdate...");
    const saved = await SavedRoadmap.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId() },
      {
        user: new mongoose.Types.ObjectId(),
        targetRole: profile.targetRole,
        companyType: profile.companyType,
        experienceLevel: profile.experienceLevel,
        totalMonths: parseInt(profile.targetMonths),
        phases: roadmap.phases,
        weeklyPlan: roadmap.weeklyPlan,
        gapAnalysis: roadmap.gapAnalysis,
        portfolioProjects: roadmap.portfolioProjects,
        recommendedResources: roadmap.recommendedResources,
        interviewFocus: roadmap.interviewFocus
      },
      { new: true, upsert: true }
    );
    console.log("Saved Success:", !!saved);
  } catch (e) {
    console.error("Error caught:", e.stack);
  }
  process.exit(0);
};
run();
