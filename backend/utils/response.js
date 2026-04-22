export function sendSuccess(req, res, { statusCode = 200, data, meta, message = 'success' }) {
  if (req.apiMode === 'versioned') {
    const payload = {
      status: 'success',
      message,
      data,
    };
    if (meta) {
      payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
  }

  return res.status(statusCode).json(data);
}
