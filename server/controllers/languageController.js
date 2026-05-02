import LanguageProfile from '../models/LanguageProfile.js';
import { getGroqChatCompletion } from '../services/groqService.js';

// @desc    Get or create user language profile
// @route   GET /api/language/profile
// @access  Private
export const getMyProfile = async (req, res) => {
  try {
    let profile = await LanguageProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await LanguageProfile.create({ user: req.user._id });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching language profile', error: error.message });
  }
};

// @desc    Update language or XP
// @route   PUT /api/language/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { currentLanguage, addXP, completeLesson } = req.body;
    let profile = await LanguageProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (currentLanguage) {
      profile.currentLanguage = currentLanguage;
    }
    
    if (addXP) {
      profile.totalXP += Number(addXP);
    }

    // Handle Phase 1 lesson completion
    if (completeLesson) {
      const { language, lessonKey } = completeLesson;
      if (language && lessonKey) {
        const progress = profile.phase1Progress.get(language) || [];
        if (!progress.includes(lessonKey)) {
          progress.push(lessonKey);
          profile.phase1Progress.set(language, progress);
        }
      }
    }

    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error updating language profile', error: error.message });
  }
};

// @desc    AI Roleplay Chat interaction (Simulates the Blueprint Multi-Agent system)
// @route   POST /api/language/roleplay
// @access  Private
export const processRoleplayChat = async (req, res) => {
  try {
    const { language, scenario, messages, userMessage } = req.body;
    
    // We append the new user message to the history
    const chatHistory = [...messages, { role: 'user', content: userMessage }];

    // Prepare system prompt for the Groq API mimicking the language and scenario
    const systemPrompt = `You are a native ${language} speaker acting as an AI language tutor and roleplay partner.
Scenario: ${scenario}
Rules for your reply:
1. Speak ENTIRELY in ${language}. Do not use English unless explicitly asked.
2. Provide a natural, conversational response that fits the scenario. Keep it concise (1-2 sentences).
3. If the user makes a significant grammar or vocabulary mistake in their last message, you must include a secret "GRAMMAR_FEEDBACK" block at the VERY END of your response in this exact format:
   [GRAMMAR_FEEDBACK] Your feedback in English explaining the mistake and providing the correct form.
   If there is no major mistake, do not include the block.`;

    // Sanitize chat history to strictly only include 'role' and 'content' for the LLM
    const sanitizedHistory = chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedHistory
    ];

    // Call Groq (Fast Llama/Mixtral model)
    const responseText = await getGroqChatCompletion(groqMessages, false, 0.7);

    // Parse out the grammar feedback if it exists
    let aiReply = responseText;
    let feedback = null;

    if (responseText.includes('[GRAMMAR_FEEDBACK]')) {
      const parts = responseText.split('[GRAMMAR_FEEDBACK]');
      aiReply = parts[0].trim();
      feedback = parts[1]?.trim();
    }

    res.status(200).json({
      reply: aiReply,
      feedback: feedback
    });
  } catch (error) {
    res.status(500).json({ message: 'AI roleplay failed', error: error.message });
  }
};
