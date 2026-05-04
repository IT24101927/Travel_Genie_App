const District = require('../models/district.model');
const asyncHandler = require('../../../utils/asyncHandler');
const apiResponse = require('../../../utils/apiResponse');


exports.getAllDistricts = asyncHandler(async (req, res) => {
  const districts = await District.find().sort({ district_id: 1 });
  apiResponse.sendSuccess(res, 200, 'Districts fetched successfully', districts);
});

exports.getDistrictById = asyncHandler(async (req, res) => {
  const district = await District.findOne({ district_id: parseInt(req.params.id) });
  if (!district) return apiResponse.sendError(res, 404, 'District not found');
  apiResponse.sendSuccess(res, 200, 'District fetched successfully', district);
});

exports.createDistrict = asyncHandler(async (req, res) => {
  const district = await District.create(req.body);
  apiResponse.sendSuccess(res, 201, 'District created successfully', district);
});

exports.updateDistrict = asyncHandler(async (req, res) => {
  const district = await District.findOneAndUpdate(
    { district_id: parseInt(req.params.id) },
    req.body,
    { new: true, runValidators: true }
  );
  if (!district) return apiResponse.sendError(res, 404, 'District not found');
  apiResponse.sendSuccess(res, 200, 'District updated successfully', district);
});

exports.deleteDistrict = asyncHandler(async (req, res) => {
  const district = await District.findOneAndDelete({ district_id: parseInt(req.params.id) });
  if (!district) return apiResponse.sendError(res, 404, 'District not found');
  apiResponse.sendSuccess(res, 200, 'District deleted successfully');
});

exports.uploadDistrictImage = asyncHandler(async (req, res) => {
  if (!req.file) return apiResponse.sendError(res, 400, 'No image file provided');
  
  const imageUrl = req.file.path.startsWith('http') 
    ? req.file.path 
    : `/uploads/districts/${req.file.filename}`;
    
  apiResponse.sendSuccess(res, 200, 'Image uploaded successfully', { imageUrl });
});
