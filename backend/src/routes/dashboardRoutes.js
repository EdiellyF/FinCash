import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getDashboard } from '../controllers/dashboardController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard overview
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     balance:
 *                       type: number
 *                       format: decimal
 *                     totalIncome:
 *                       type: number
 *                       format: decimal
 *                     totalExpense:
 *                       type: number
 *                       format: decimal
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getDashboard);

export default router;