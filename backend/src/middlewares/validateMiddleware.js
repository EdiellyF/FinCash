import { ValidationError } from '../utils/errors.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      throw new ValidationError('Dados inválidos.', errors);
    }

    req.validatedData = result.data;
    next();
  };
}