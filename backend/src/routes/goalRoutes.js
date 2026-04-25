import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { goalSchema } from '../validations/goalValidation.js';
import { create, list, remove, update } from '../controllers/goalController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', list);
router.post('/', validate(goalSchema), create);
router.put('/:id', validate(goalSchema), update);
router.delete('/:id', remove);

export default router;
