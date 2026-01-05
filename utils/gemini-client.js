// utils/gemini-client.js
// Lightweight Gemini client for server-side summaries

const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Simple guard so server fails loudly if key is missing
function ensureApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
}

/**
 * Generate a narrative executive summary for the project
 * using Gemini 2.5 Flash (text only).
 */
async function generateProjectSummary(projectData, kpis) {
  ensureApiKey();

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  // Build a concise, structured prompt from your KPIs + basic project info
  const prompt = `
You are a senior project controls manager.
Write a concise executive summary (max 200 words) for a construction project status report.

Project:
- Name: ${projectData.project_name || 'N/A'}
- ID: ${projectData.project_id || 'N/A'}
- Start: ${projectData.project_start_date || 'N/A'}
- Finish: ${projectData.project_end_date || 'N/A'}
- Status: ${projectData.project_status || 'N/A'}

Key Metrics:
- Planned Value (PV): ${kpis.totalPlannedValue}
- Earned Value (EV): ${kpis.totalEarnedValue}
- Actual Cost (AC): ${kpis.totalActualCost}
- SPI: ${kpis.schedulePerformanceIndex}
- CPI: ${kpis.costPerformanceIndex}
- Schedule Variance (SV): ${kpis.scheduleVariance}
- Cost Variance (CV): ${kpis.costVariance}
- EAC: ${kpis.estimateAtCompletion}
- VAC: ${kpis.varianceAtCompletion}
- Health: ${kpis.health}

Write 1–2 short paragraphs in neutral business English, focusing on schedule, cost, risks, and recommended actions.
Do NOT include bullet points or headings.
`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const text =
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0].text;

  return text || 'Executive summary not available.';
}

module.exports = {
  generateProjectSummary
};
