import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function analyzeSolution({
  subject,
  source,
  year,
  concepts,
  difficulty,
  title,
  userSolution,
  isPro,
}: {
  subject: string;
  source: string;
  year: number;
  concepts: string[];
  difficulty: number;
  title: string;
  userSolution: string;
  isPro: boolean;
}) {
  const model = isPro ? 'gemini-3-flash-preview' : 'gemini-2.5-flash';

  const systemPrompt = `You are an expert Science Olympiad coach specializing in ${subject}.
A student submitted their solution to a competition problem.
Analyze it thoroughly. Be specific, constructive, and encouraging. Identify exactly where the student went right and where they went wrong. If the solution is incomplete, point out what's missing. Respond ONLY with valid JSON matching this exact schema:
{
  "score": <number 0-100>,
  "feedback": "<overall assessment string>",
  "strengths": ["<strength 1>", ...],
  "weakPoints": ["<area to improve 1>", ...],
  "conceptsToReview": ["<concept 1>", ...],
  "nextSteps": "<specific recommendation string>"
}`;

  const userPrompt = `Problem: ${title}
Source: ${source} (${year})
Subject: ${subject}
Concepts: ${concepts.join(', ')}
Difficulty: ${difficulty}/10

Student's solution:
${userSolution}`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const text = response.text ?? '';
  return JSON.parse(text);
}
