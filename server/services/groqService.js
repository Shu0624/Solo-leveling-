import 'dotenv/config';
import Groq from "groq-sdk";

// Initialize multiple Groq clients if keys exist
// Swapped order: using API_KEY_2 first as requested
const keys = [process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY].filter(Boolean);
const clients = keys.map(apiKey => new Groq({ apiKey }));

let currentClientIndex = 0;

/**
 * Perform a chat completion using Groq with fallback rotation
 * @param {Array} messages - Array of message objects {role: "system"|"user"|"assistant", content: string}
 * @param {boolean} jsonMode - Ensure response is valid JSON
 * @param {number} temperature - Model temperature
 * @returns {string} - Response text
 */
export const getGroqChatCompletion = async (messages, jsonMode = false, temperature = 0.5) => {
  if (clients.length === 0) throw new Error("No Groq API keys configured");

  const options = {
    messages,
    model: "llama-3.3-70b-versatile",
    temperature,
    max_tokens: 4096,
  };
  
  if (jsonMode) {
      options.response_format = { type: "json_object" };
  }

  // Try the primary client, fallback to next if rate limited or error
  for (let i = 0; i < clients.length; i++) {
    const groq = clients[currentClientIndex];
    let timeoutId;
    try {
      // Add a 10-second timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Groq timeout')), 10000);
      });
      // Prevent UnhandledPromiseRejection if race resolves first
      timeoutPromise.catch(() => {});
      
      const chatPromise = groq.chat.completions.create(options);
      const chatCompletion = await Promise.race([chatPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      
      return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      console.warn(`Groq API Error on key index ${currentClientIndex}:`, error.message);
      // Rotate to the next key for the next attempt/fallback
      currentClientIndex = (currentClientIndex + 1) % clients.length;
      
      // If we've tried all keys, throw the error
      if (i === clients.length - 1) {
        throw error;
      }
      console.log(`Retrying with fallback Groq key index ${currentClientIndex}...`);
    }
  }
};
