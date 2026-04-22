import { loginUser } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    if (req.apiMode === 'versioned') {
      return sendSuccess(req, res, {
        statusCode: 200,
        data: result,
        message: 'login successful',
      });
    }

    return res.status(200).json({
      status: 'success',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}
