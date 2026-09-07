import { Router } from 'express';

const router = Router();

// Echo headers and request info to help debugging clients (ONLY use in non-production)
router.get('/echo', (req, res) => {
  res.json({
    ok: true,
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers
  });
});

router.post('/echo', (req, res) => {
  res.json({
    ok: true,
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers,
    body: req.body
  });
});

export default router;
