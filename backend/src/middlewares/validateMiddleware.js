export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        message: 'Dados inválidos.',
        errors: result.error.flatten().fieldErrors
      });
    }

    req.validatedData = result.data;
    next();
  };
}
