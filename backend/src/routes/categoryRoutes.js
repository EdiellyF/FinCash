import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { categorySchema } from '../validations/categoryValidation.js';
import { create, list, remove, update } from '../controllers/categoryController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', list);
router.post('/', validate(categorySchema), create);
router.put('/:id', validate(categorySchema), update);
router.delete('/:id', remove);

export default router;
