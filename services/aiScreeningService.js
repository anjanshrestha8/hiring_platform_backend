const OpenAI = require("openai");
const extractTextFromCV = require("../utils/cvParser"); 
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const screenCV = async (candidate) => {

  const job = await Job.findByPk(candidate.jobId);
  if (!job) throw new Error("Job not found for candidate");

  const cvText = await extractTextFromCV(candidate.cvLink);

const prompt = `
You are a recruitment AI. Evaluate this CV against the job description and respond in **strict JSON only** (no markdown, no backticks):

{
  "score": number between 0 and 100,
  "decision": "Pass" or "Fail",
  "strengths": [array of strengths],
  "weaknesses": [array of weaknesses]
}

Job Description: ${job.description}
CV Content: ${cvText}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

const aiResultRaw = response.choices[0].message.content;

let aiResult;
try {
  aiResult = JSON.parse(aiResultRaw);
} catch (err) {
  console.error("Failed to parse AI response:", aiResultRaw);
  throw new Error("AI response is not valid JSON");
}


  return aiResult;
};

module.exports = screenCV;
