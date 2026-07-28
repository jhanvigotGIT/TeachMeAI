import { GoogleGenerativeAI } from "@google/generative-ai";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});
export async function askGemini(pdfText, userPrompt) {
  const prompt = `
You are an expert AI teacher.
The student uploaded the following PDF.
The student wants you to teach it like this:
${userPrompt}
PDF Content:
${pdfText}
Follow the student's instructions exactly.
`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
