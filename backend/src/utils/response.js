export function ok(res, data, message = 'Operação realizada com sucesso.', metadata = null) {
  const response = { success: true, message, data };
  if (metadata) {
    response.metadata = metadata;
  }
  return res.status(200).json(response);
}

export function created(res, data, message = 'Registro criado com sucesso.', metadata = null) {
  const response = { success: true, message, data };
  if (metadata) {
    response.metadata = metadata;
  }
  return res.status(201).json(response);
}