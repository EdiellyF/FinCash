import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  getSuggestion,
  batchCategorize,
  autoCategorize
} from '../controllers/categorizationController.js';
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';
import { batchCategorizeSchema } from '../validations/categorizationValidation.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/categorization/suggest:
 *   post:
 *     summary: Get category suggestion for a transaction
 *     tags: [Categorization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Supermercado Extra"
 *               description:
 *                 type: string
 *                 example: "Compras do mês"
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: "expense"
 *     responses:
 *       200:
 *         description: Category suggestion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categoryId:
 *                   type: string
 *                 categoryName:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 method:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/suggest', async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(2, 'Título obrigatório'),
      description: z.string().optional().nullable(),
      type: z.enum(['income', 'expense'])
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Dados inválidos.', result.error.flatten().fieldErrors);
    }
    
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
}, getSuggestion);

/**
 * @swagger
 * /api/categorization/batch:
 *   get:
 *     summary: Get batch categorization suggestions for existing transactions
 *     tags: [Categorization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of transactions to process
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Batch categorization results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 processed:
 *                   type: integer
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transactionId:
 *                         type: string
 *                       transactionTitle:
 *                         type: string
 *                       currentCategory:
 *                         type: string
 *                       suggestedCategory:
 *                         type: string
 *                       confidence:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/batch', validate(batchCategorizeSchema), batchCategorize);

/**
 * @swagger
 * /api/categorization/auto/{transactionId}:
 *   post:
 *     summary: Auto-categorize a specific transaction
 *     tags: [Categorization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction auto-categorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *                 suggestion:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/auto/:transactionId', autoCategorize);

export default router;