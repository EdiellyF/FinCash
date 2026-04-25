import { Router } from 'express';
import {
  forgotPasswordController,
  login,
  logout,
  register,
  resetPasswordController
} from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from '../validations/authValidation.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordController);

export default router;
