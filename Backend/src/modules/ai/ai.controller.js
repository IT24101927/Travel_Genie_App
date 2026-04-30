const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const { getRecommendationsFromAi } = require('./ai.service');

const getRecommendationsHandler = asyncHandler(async (req, res) => {
  const data = await getRecommendationsFromAi(req.body);
  return sendSuccess(res, 200, 'AI recommendations fetched successfully', data);
});

module.exports = {
  getRecommendationsHandler
};
