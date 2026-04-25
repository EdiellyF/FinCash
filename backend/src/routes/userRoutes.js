import { Router } from 'express';
import { me, updateProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/me', me);
router.put('/me', updateProfile);

export default router;
