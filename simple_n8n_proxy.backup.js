// Simple Express server to proxy requests to Groq AI
// Run this with: node simple_n8n_proxy.js
// This bypasses n8n webhook issues

const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for your React app
app.use(cors({
  origin: '*'
}));

app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/generate-guide', async (req, res) => {
  try {
    console.log('📥 Received request:', req.body);

    const { cropName, location, latitude, longitude, soilType, season, soilData, farmSize, irrigationType } = req.body;

    // Build the prompt - ENHANCED VERSION with detailed instructions
    const prompt = `Generate a COMPREHENSIVE, DETAILED growing guide for professional farmers:

CROP DETAILS:
- Crop: ${cropName}
- Location: ${location} (${latitude}°N, ${longitude}°E)
- Season: ${season}
- Soil Type: ${soilType}
- Farm Size: ${farmSize} acres
- Irrigation Type: ${irrigationType}

SOIL ANALYSIS DATA:
- Nitrogen (N): ${soilData.nitrogen} kg/ha
- Phosphorus (P): ${soilData.phosphorus} kg/ha
- Potassium (K): ${soilData.potassium} kg/ha
- pH Level: ${soilData.ph}
- Expected Rainfall: ${soilData.rainfall}mm

INSTRUCTIONS:
You are an expert agricultural consultant with 20+ years of experience. Generate a DETAILED, COMPREHENSIVE growing guide with 8 sections. Each section should be AT LEAST 300-500 words with specific, actionable information.

FOR EACH SECTION, INCLUDE:
1. Land Preparation: Detailed tillage methods, soil amendments, land leveling techniques, timing, equipment needed, step-by-step process
2. Seed Selection & Sowing: Specific varieties for this location/season, seed rate calculations, treatment methods, sowing techniques, spacing, depth, optimal timing
3. Irrigation Management: Detailed schedule based on ${irrigationType}, frequency by growth stage, water quantity calculations, drainage needs, moisture monitoring
4. Fertilizer Management: Detailed NPK application schedule based on CURRENT soil levels (N=${soilData.nitrogen}, P=${soilData.phosphorus}, K=${soilData.potassium}, pH=${soilData.ph}), split applications, micronutrients, organic amendments, timing for each growth stage
5. Pest & Disease Management: Common pests for ${cropName} in ${location}, symptoms, IPM strategies, chemical controls, organic alternatives, monitoring schedules
6. Crop Care Calendar: Week-by-week activities from sowing to harvest, specific tasks, growth stages, critical periods
7. Harvesting Guidelines: Maturity indicators, harvesting methods, optimal timing, post-harvest handling, storage guidelines, quality parameters
8. Cost-Benefit Analysis: Detailed cost breakdown for ${farmSize} acres, expected yield calculations, market rates, profit projections, ROI analysis

YOU MUST respond with ONLY valid JSON (no markdown, no code blocks) in this EXACT structure:
{
  "cropName": "${cropName}",
  "location": "${location}",
  "season": "${season}",
  "generatedAt": "2023-12-01T00:00:00.000Z",
  "summary": {
    "climateSuitability": "excellent/good/moderate/poor",
    "soilQuality": "excellent/good/moderate/poor based on NPK and pH",
    "estimatedYield": "X-Y quintals/acre realistic range",
    "totalDuration": "X months complete cycle"
  },
  "timeline": {
    "landPreparation": "X-Y weeks",
    "sowingPeriod": "Best months based on ${season}",
    "firstHarvest": "X-Y days from sowing",
    "totalDuration": "X months"
  },
  "sections": [
    {"title": "Land Preparation", "content": "DETAILED 300-500 word guide with step-by-step land preparation process, tillage methods, soil amendments needed based on current pH ${soilData.ph}, leveling requirements, timing, equipment, cost estimates"},
    {"title": "Seed Selection & Sowing", "content": "DETAILED 300-500 word guide with recommended varieties for ${location}, seed treatment steps, sowing techniques for ${soilType} soil, spacing calculations, seed rate for ${farmSize} acres, optimal sowing dates for ${season} season"},
    {"title": "Irrigation Management", "content": "DETAILED 300-500 word guide specific to ${irrigationType} irrigation, frequency by growth stage, water quantity calculations, critical irrigation stages for ${cropName}, scheduling based on ${soilData.rainfall}mm rainfall, water conservation techniques"},
    {"title": "Fertilizer Management", "content": "DETAILED 300-500 word guide with SPECIFIC recommendations based on CURRENT soil: N=${soilData.nitrogen} (needs X more), P=${soilData.phosphorus} (needs Y more), K=${soilData.potassium} (needs Z more), pH=${soilData.ph} (adjustment if needed). Include split application schedule, micronutrient needs, organic amendments, timing for each growth stage, quantities for ${farmSize} acres"},
    {"title": "Pest & Disease Management", "content": "DETAILED 300-500 word guide covering major pests and diseases specific to ${cropName} in ${location} during ${season}, symptoms to watch for, IPM strategies, monitoring schedule, chemical controls with doses, organic alternatives, preventive measures"},
    {"title": "Crop Care Calendar", "content": "DETAILED 300-500 word WEEK-BY-WEEK calendar from sowing to harvest, specific activities for each week/stage, growth milestones, critical periods requiring attention, intercultural operations, weeding schedule"},
    {"title": "Harvesting Guidelines", "content": "DETAILED 300-500 word guide covering maturity indicators for ${cropName}, optimal harvest timing, harvesting methods and techniques, tools required, post-harvest handling steps, storage conditions, quality parameters, market preparation"},
    {"title": "Cost-Benefit Analysis", "content": "DETAILED 300-500 word financial breakdown for ${farmSize} acres: itemized costs (seeds, fertilizers, pesticides, labor, irrigation, equipment), expected yield range, market price estimates, gross income projection, net profit calculation, break-even analysis, ROI percentage"}
  ],
  "resources": {
    "localSupport": "Agricultural extension offices in ${location}",
    "emergencyContacts": "Local agricultural helpline numbers",
    "marketInfo": "Nearest markets for ${cropName}"
  }
}

CRITICAL: Make each section content 300-500 words minimum. Be specific to ${cropName}, ${location}, ${season}, and the ACTUAL soil data provided. Include numbers, measurements, and actionable steps.

START YOUR RESPONSE WITH { AND END WITH } - NOTHING ELSE.`;

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert agricultural consultant with 20+ years of field experience. Provide DETAILED, COMPREHENSIVE, and ACTIONABLE growing guides with specific measurements, timings, and techniques. Each section should be 300-500 words minimum. ALWAYS respond in valid JSON format - no markdown, no code blocks, just pure JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000, // Increased from 4000 to accommodate longer, detailed content
        top_p: 0.9
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const guideText = groqData.choices[0].message.content;
    
    console.log('✅ Groq response received');

    // Parse JSON from response
    let guideJson;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = guideText.match(/\{[\s\S]*\}/);
      guideJson = JSON.parse(jsonMatch ? jsonMatch[0] : guideText);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e);
      // Return a basic structure if parsing fails
      guideJson = {
        cropName,
        location,
        season,
        generatedAt: new Date().toISOString(),
        summary: {
          climateSuitability: 'good',
          soilQuality: 'good',
          estimatedYield: 'Analysis pending',
          totalDuration: '90-120 days'
        },
        timeline: {
          landPreparation: '2-3 weeks',
          sowingPeriod: 'October-November',
          firstHarvest: '90 days',
          totalDuration: '4 months'
        },
        sections: [
          { title: 'Guide Generation', content: 'Guide generated but formatting issue occurred. Raw data: ' + guideText.substring(0, 500) }
        ]
      };
    }

    console.log('📤 Sending guide to React');
    res.json(guideJson);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5679; // Different port from n8n
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/generate-guide`);
});
