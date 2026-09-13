import express from 'express';
import { sendMessage, getHistory, getLimits, exportToPdf, comparePeriods, sendMessageStream } from '../controllers/chatController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { sendMessageSchema, comparePeriodsSchema } from '../validations/chatValidation.js';

const router = express.Router();

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Send a message to the AI financial assistant
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "How can I save more money?"
 *     responses:
 *       200:
 *         description: AI response
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
 *                     response:
 *                       type: string
 *                     provider:
 *                       type: string
 *                     remainingRequests:
 *                       type: integer
 *       400:
 *         description: Rate limit exceeded or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/message', authMiddleware, rateLimiter(5, 60000), validate(sendMessageSchema), sendMessage);

/**
 * @swagger
 * /api/chat/message-stream:
 *   post:
 *     summary: Send a message to the AI financial assistant (streaming)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "How can I save more money?"
 *     responses:
 *       200:
 *         description: Streaming AI response
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Rate limit exceeded or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/message-stream', authMiddleware, rateLimiter(5, 60000), validate(sendMessageSchema), sendMessageStream);

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Get chat history for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
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
 *                       role:
 *                         type: string
 *                         enum: [user, assistant]
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/history', authMiddleware, rateLimiter(10, 60000), getHistory);

/**
 * @swagger
 * /api/chat/limits:
 *   get:
 *     summary: Get AI usage limits for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage limits retrieved successfully
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
 *                     gemini:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                     groq:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/limits', authMiddleware, rateLimiter(10, 60000), getLimits);

/**
 * @swagger
 * /api/chat/export-pdf:
 *   get:
 *     summary: Export chat history to PDF
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
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
router.get('/export-pdf', authMiddleware, rateLimiter(3, 60000), exportToPdf);

/**
 * @swagger
 * /api/chat/compare:
 *   post:
 *     summary: Compare financial data across multiple periods
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - periods
 *             properties:
 *               periods:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [7d, 30d, 365d]
 *                 example: ["7d", "30d", "365d"]
 *     responses:
 *       200:
 *         description: Comparative analysis
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
 *                     periods:
 *                       type: array
 *                       items:
 *                         type: object
 *                     analysis:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/compare', authMiddleware, rateLimiter(5, 60000), validate(comparePeriodsSchema), comparePeriods);

export default router;