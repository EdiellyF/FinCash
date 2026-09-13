import { Router } from 'express';

const router = Router();

router.get('/privacy-policy', (req, res) => {
  return res.json({
    version: '1.0',
    lastUpdated: '2024-01-01',
    title: 'Política de Privacidade do FinCash',
    content: {
      introduction: 'O FinCash se compromete a proteger a privacidade e segurança dos seus dados pessoais. Esta política descreve como coletamos, usamos e protegemos suas informações.',
      dataCollection: {
        personal: [
          'Nome: Para identificação e personalização da conta',
          'E-mail: Para autenticação, recuperação de conta e comunicações do sistema',
          'Senha (criptografada): Para acesso seguro à sua conta'
        ],
        financial: [
          'Transações financeiras: Valores, categorias, datas e descrições inseridas por você',
          'Metas financeiras: Objetivos de poupança e investimentos definidos por você',
          'Orçamentos: Limites de gastos por categoria definidos por você'
        ],
        technical: [
          'Logs de acesso: Para monitoramento de segurança e performance do sistema',
          'Dados de sessão: Para manter sua autenticação segura durante o uso'
        ]
      },
      dataUsage: [
        'Fornecer e operar o sistema de gestão financeira',
        'Processar suas transações e gerar relatórios financeiros',
        'Enviar notificações importantes sobre sua conta',
        'Melhorar a qualidade e funcionalidade do serviço',
        'Proteger contra fraudes e atividades suspeitas'
      ],
      dataProtection: {
        storage: 'Seus dados são armazenados em servidores seguros com criptografia em repouso e em trânsito',
        access: 'Apenas você tem acesso aos seus dados através de autenticação segura',
        retention: 'Seus dados são mantidos enquanto sua conta estiver ativa, exceto quando solicitada a exclusão'
      },
      dataSharing: {
        thirdParties: 'Não compartilhamos seus dados pessoais com terceiros para fins comerciais',
        legal: 'Podemos divulgar dados quando exigido por lei ou para proteger nossos direitos',
        services: 'Usamos serviços de terceiros apenas para operação técnica do sistema (banco de dados, autenticação)'
      },
      userRights: [
        'Acesso: Você pode solicitar uma cópia de todos os seus dados a qualquer momento',
        'Correção: Você pode atualizar ou corrigir suas informações pessoais',
        'Exclusão: Você pode excluir sua conta e todos os dados associados permanentemente',
        'Portabilidade: Você pode solicitar a transferência de seus dados para outro serviço',
        'Consentimento: Você pode revogar o consentimento para processamento de dados específicos'
      ],
      accountDeletion: {
        method: 'Para excluir sua conta, acesse seu perfil e clique em "Excluir minha conta"',
        consequences: 'Esta ação removerá permanentemente todos os seus dados, incluindo transações, metas e configurações',
        recovery: 'Após a exclusão, não é possível recuperar os dados ou reativar a conta'
      },
     
      updates: 'Esta política pode ser atualizada periodicamente. Notificaremos os usuários sobre mudanças significativas.'
    }
  });
});

export default router;