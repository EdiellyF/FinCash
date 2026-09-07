import { Router } from 'express';

const router = Router();


router.get('/privacy-policy', (req, res) => {
  return res.json({
    version: '1.0',
    content: `Coletamos o nome e o e-mail do usuário para identificação e recuperação de conta, além das transações financeiras inseridas pelo próprio usuário para permitir o funcionamento do sistema de gestão financeira. Os dados são usados apenas para fornecer e melhorar o serviço; não há compartilhamento com terceiros. O usuário pode solicitar a exclusão de sua conta e de todos os dados associados a qualquer momento através da opção "Excluir minha conta" disponível no perfil — essa ação removerá permanentemente os dados.`
  });
});

export default router;
