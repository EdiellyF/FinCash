import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  categorySummary, 
  exportCsv, 
  exportPdf, 
  monthly,
  exportGoalsCsv,
  exportBudgetsCsv
} from '../controllers/reportController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/reports/monthly:
 *   get:
 *     summary: Get monthly financial report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year
 *     responses:
 *       200:
 *         description: Monthly report retrieved successfully
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
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/monthly', monthly);

/**
 * @swagger
 * /api/reports/category:
 *   get:
 *     summary: Get category-wise financial summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: Category summary retrieved successfully
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
 *                       category:
 *                         $ref: '#/components/schemas/Category'
 *                       total:
 *                         type: number
 *                         format: decimal
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/category', categorySummary);

/**
 * @swagger
 * /api/reports/export/csv:
 *   get:
 *     summary: Export transactions to CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Month number
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year
 *       - in: query
 *         name: advanced
 *         schema:
 *           type: boolean
 *         description: Use advanced exporter with customization
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated field names (only for advanced)
 *       - in: query
 *         name: separator
 *         schema:
 *           type: string
 *         description: "CSV separator (default: comma)"
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/export/csv', exportCsv);

/**
 * @swagger
 * /api/reports/export/pdf:
 *   get:
 *     summary: Export transactions/goals/budgets to PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month number (for transactions/budgets)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (for transactions/budgets)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [transactions, goals, budgets]
 *         description: "Type of report to export (default: transactions)"
 *       - in: query
 *         name: advanced
 *         schema:
 *           type: boolean
 *         description: Use advanced PDF exporter
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/export/pdf', exportPdf);

/**
 * @swagger
 * /api/reports/export/goals-csv:
 *   get:
 *     summary: Export goals to CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated field names
 *       - in: query
 *         name: separator
 *         schema:
 *           type: string
 *         description: "CSV separator (default: comma)"
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/export/goals-csv', exportGoalsCsv);

/**
 * @swagger
 * /api/reports/export/budgets-csv:
 *   get:
 *     summary: Export budgets to CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Month number
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated field names
 *       - in: query
 *         name: separator
 *         schema:
 *           type: string
 *         description: "CSV separator (default: comma)"
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/export/budgets-csv', exportBudgetsCsv);

export default router;