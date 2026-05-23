import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  extractTransactions, 
  extractAndSaveTransactions 
} from '../controllers/transactionExtractionController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/transactions/extract:
 *   post:
 *     summary: Extract transactions from natural language text
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "meu salário é 1800, gastei 300 com alimentação, 150 com transporte"
 *     responses:
 *       200:
 *         description: Transactions extracted successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [income, expense]
 *                           amount:
 *                             type: number
 *                           category:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                     provider:
 *                       type: string
 *                     confidence:
 *                       type: number
 */
router.post('/extract', extractTransactions);

/**
 * @swagger
 * /api/transactions/extract-and-save:
 *   post:
 *     summary: Extract and save transactions from natural language text
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "meu salário é 1800, gastei 300 com alimentação, 150 com transporte"
 *               transactionDate:
 *                 type: string
 *                 format: date
 *                 description: Optional date for transactions (defaults to today)
 *     responses:
 *       201:
 *         description: Transactions extracted and saved successfully
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
 *                     extraction:
 *                       type: object
 *                     save:
 *                       type: object
 */
router.post('/extract-and-save', extractAndSaveTransactions);

export default router;