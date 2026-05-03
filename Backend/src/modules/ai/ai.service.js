const axios = require('axios');
const env = require('../../config/env');

const getRecommendationsFromAi = async (payload) => {
  if (!env.aiServiceUrl) {
    return {
      enabled: false,
      message: 'AI service is disabled. Set AI_SERVICE_URL to enable recommendations.',
      recommendations: []
    };
  }

  const response = await axios.post(`${env.aiServiceUrl}/api/recommendations`, payload, {
    timeout: 15000
  });

  return {
    enabled: true,
    ...response.data
  };
};

module.exports = {
  getRecommendationsFromAi
};
