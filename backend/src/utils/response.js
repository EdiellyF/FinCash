export function ok(res, data, message = 'Operação realizada com sucesso.') {
  return res.status(200).json({ message, data });
}

export function created(res, data, message = 'Registro criado com sucesso.') {
  return res.status(201).json({ message, data });
}
