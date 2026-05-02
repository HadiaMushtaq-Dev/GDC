import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const genAI = new GoogleGenerativeAI("AIzaSyC-hByPdzp90gvvxyuriCO2aHgo_5JL8Es"); // Hardcoding to test, or we can use dotenv
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro" });
  const prompt = `You are a conflict detection AI. You are monitoring a project for coordination drift between two founders.
Founder 1 (Paul) said: "I think we should launch today."
Founder 2 (Sam) just said: "The code is not ready, we cannot launch."

Determine if there is a conflict or coordination drift between these two statements.
Return ONLY a JSON object with the following schema, with no markdown formatting:
{
  "hasConflict": boolean,
  "summary": "String explaining the conflict briefly (if hasConflict is true)",
  "resolution": "String suggesting a resolution (if hasConflict is true)"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    console.log("Raw Text:", text);
    const aiResponse = JSON.parse(text);
    console.log("Parsed JSON:", aiResponse);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
