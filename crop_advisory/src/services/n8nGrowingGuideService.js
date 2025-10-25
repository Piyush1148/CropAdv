/**
 * n8n Growing Guide Service
 * Connects React application to n8n workflow for AI-powered growing guides
 * Enhanced version with soil test data, farm details, and irrigation info
 */

// Using direct Groq proxy to bypass n8n webhook issues
// This works reliably without webhook configuration problems
const N8N_WEBHOOK_URL = 'http://localhost:5679/generate-guide';

/**
 * Generate a comprehensive growing guide for a specific crop
 * @param {Object} cropData - Complete crop and farming information
 * @param {string} cropData.crop - Name of the crop (e.g., "Tomato", "Wheat")
 * @param {string} cropData.location - Location name (e.g., "Pune, Maharashtra")
 * @param {number} cropData.latitude - Latitude coordinate
 * @param {number} cropData.longitude - Longitude coordinate
 * @param {string} cropData.soilType - Type of soil (e.g., "Red Soil", "Black Soil")
 * @param {string} cropData.season - Growing season (e.g., "Kharif", "Rabi", "Zaid")
 * @param {Object} cropData.soilData - Soil test results (NEW)
 * @param {number} cropData.soilData.nitrogen - Nitrogen level in kg/ha
 * @param {number} cropData.soilData.phosphorus - Phosphorus level in kg/ha
 * @param {number} cropData.soilData.potassium - Potassium level in kg/ha
 * @param {number} cropData.soilData.ph - Soil pH level
 * @param {number} cropData.soilData.rainfall - Rainfall in mm
 * @param {number} cropData.farmSize - Farm size in acres (NEW)
 * @param {string} cropData.irrigationType - Type of irrigation system (NEW)
 * @param {string} cropData.userId - User ID for personalization
 * @param {string} cropData.language - Preferred language ('en' or 'hi')
 * @returns {Promise<Object>} Growing guide with sections, timeline, and resources
 */
export const generateGrowingGuide = async (cropData) => {
  try {
    console.log('🌾 Calling n8n workflow with ENHANCED data:', cropData);

    // Prepare enriched payload for n8n
    const payload = {
      cropName: cropData.crop,
      location: cropData.location,
      latitude: cropData.latitude,
      longitude: cropData.longitude,
      soilType: cropData.soilType,
      season: cropData.season,
      userId: cropData.userId,
      language: cropData.language || 'en',
      
      // NEW: Soil test data (from crop prediction form)
      soilData: cropData.soilData || {
        nitrogen: null,
        phosphorus: null,
        potassium: null,
        ph: null,
        rainfall: null
      },
      
      // NEW: Farm details (from user profile)
      farmSize: cropData.farmSize || null,
      irrigationType: cropData.irrigationType || null
    };

    console.log('📤 Sending to n8n:', JSON.stringify(payload, null, 2));

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`n8n workflow failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ n8n workflow response:', result);

    // Return the complete guide data
    return {
      cropName: result.cropName,
      location: result.location,
      season: result.season,
      generatedAt: result.generatedAt || new Date().toISOString(),
      summary: result.summary || {
        climateSuitability: 'good',
        soilQuality: 'good',
        estimatedYield: 'Not available',
        totalDuration: 'Not available'
      },
      timeline: result.timeline || {
        landPreparation: 'Not specified',
        sowingPeriod: 'Not specified',
        firstHarvest: 'Not specified',
        totalDuration: 'Not specified'
      },
      sections: result.sections || [],
      resources: result.resources || {},
      metadata: result.metadata || {}
    };

  } catch (error) {
    console.error('❌ Error calling n8n workflow:', error);
    throw new Error(`Failed to generate growing guide: ${error.message}`);
  }
};

export default {
  generateGrowingGuide
};
