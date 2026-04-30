import express from 'express';
import { sendMessage, getHistory, getLimits } from '../controllers/chatController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/message', authMiddleware, sendMessage);
router.get('/history', authMiddleware, getHistory);
router.get('/limits', authMiddleware, getLimits);

export default router;
