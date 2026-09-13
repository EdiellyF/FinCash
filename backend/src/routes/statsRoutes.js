import express from 'express';
import { getUserStats, getUsageHistory } from '../controllers/statsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { getUserStatsSchema, getUsageHistorySchema } from '../validations/statsValidation.js';

const router = express.Router();

/**
 * @swagger
 * /api/stats/user:
 *   get:
 *     summary: Get user statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     totalTransactions:
 *                       type: integer
 *                     totalGoals:
 *                       type: integer
 *                     totalBudgets:
 *                       type: integer
 *                     accountCreated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/user', authMiddleware, validate(getUserStatsSchema), getUserStats);

/**
 * @swagger
 * /api/stats/history:
 *   get:
 *     summary: Get usage history
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       provider:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/history', authMiddleware, validate(getUsageHistorySchema), getUsageHistory);

export default router;