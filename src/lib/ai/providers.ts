import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
});

export const models = {
  flash: google('gemini-2.5-flash'),
  pro: google('gemini-2.5-pro'),
} as const;
