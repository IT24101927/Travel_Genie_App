const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const {
  createTransport,
  getTransports,
  getTransportById,
  updateTransport,
  deleteTransport
} = require('../transport.service');

const createTransportHandler = asyncHandler(async (req, res) => {
  const transport = await createTransport(req.user, req.body);
  return sendSuccess(res, 201, 'Transport created successfully', { transport });
});

const getTransportsHandler = asyncHandler(async (req, res) => {
  const transports = await getTransports(req.user, req.query);
  return sendSuccess(res, 200, 'Transports fetched successfully', { transports });
});

const getTransportHandler = asyncHandler(async (req, res) => {
  const transport = await getTransportById(req.params.id, req.user);
  return sendSuccess(res, 200, 'Transport fetched successfully', { transport });
});

const updateTransportHandler = asyncHandler(async (req, res) => {
  const transport = await updateTransport(req.params.id, req.user, req.body);
  return sendSuccess(res, 200, 'Transport updated successfully', { transport });
});

const deleteTransportHandler = asyncHandler(async (req, res) => {
  await deleteTransport(req.params.id, req.user);
  return sendSuccess(res, 200, 'Transport deleted successfully');
});

module.exports = {
  createTransportHandler,
  getTransportsHandler,
  getTransportHandler,
  updateTransportHandler,
  deleteTransportHandler
};
