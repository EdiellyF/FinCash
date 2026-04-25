import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { categorySummary, exportCsv, exportPdf, monthly } from '../controllers/reportController.js';

const router = Router();
router.use(authMiddleware);

router.get('/monthly', monthly);
router.get('/category', categorySummary);
router.get('/export/csv', exportCsv);
router.get('/export/pdf', exportPdf);

export default router;
