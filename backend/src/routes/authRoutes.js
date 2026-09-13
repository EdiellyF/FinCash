import { Router } from 'express';
import {
  login,
  logout,
  refresh,
  register,
  resetPasswordWithBackupCodeController,
  totpConfirmController,
  backupLoginController,
  resetTotpController
} from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordWithBackupCodeSchema,
  totpConfirmSchema,
  backupLoginSchema,
  totpResetSchema
} from '../validations/authValidation.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validate(registerSchema), register);
// New TOTP endpoints
router.post('/totp/confirm', rateLimiter(5, 60000), validate(totpConfirmSchema), totpConfirmController);
router.post('/totp/backup-login', rateLimiter(5, 60000), validate(backupLoginSchema), backupLoginController);
router.post('/totp/reset', validate(totpResetSchema), resetTotpController);
router.post(
  '/reset-password-with-backup-code',
  rateLimiter(5, 60000),
  validate(resetPasswordWithBackupCodeSchema),
  resetPasswordWithBackupCodeController
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', rateLimiter(5, 60000), validate(loginSchema), login);
router.post('/refresh', rateLimiter(5, 60000), validate(refreshTokenSchema), refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authMiddleware, validate(logoutSchema), logout);




export default router;
