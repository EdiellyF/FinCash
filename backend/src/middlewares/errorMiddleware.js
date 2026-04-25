export function errorMiddleware(err, req, res, next) {
  console.error(err);

  const status = err.statusCode || 400;
  return res.status(status).json({
    message: err.message || 'Erro interno do servidor.'
  });
}
