import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TrendingUp, UserPlus, Shield } from 'lucide-react';
import validator from 'validator';
import { useState } from 'react';
import PrivacyPolicy from '../components/ui/PrivacyPolicy';

export default function Register() {
  const {
    register: reg,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  async function onSubmit(values) {
    if (!privacyAccepted) {
      toast.error('Você precisa aceitar a política de privacidade para criar uma conta.');
      return;
    }

    try {
      const result = await register(values);

      toast.success('Conta criada. Configure o TOTP e salve seus códigos de backup.');

      navigate('/setup-totp', {
        state: {
          totpUri: result.totpUri,
          backupCodes: result.backupCodes
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível criar a conta. Tente novamente.');
    }
  }

  // Input atualizado com bordas finas, raio menor e foco na cor forest
  const inputClass = "w-full rounded-md border border-fincash-ink/20 bg-white px-3 py-2 text-sm text-fincash-ink outline-none focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest placeholder:text-fincash-ink/40 transition-colors";

  return (
    <div className="flex min-h-screen items-center justify-center bg-fincash-cream p-4">
      <div className="w-full max-w-md">
        
        {/* Header (Logo e Título) */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fincash-forest text-fincash-cream">
            <TrendingUp size={28} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-fincash-ink">FinCash</h1>
          <p className="mt-1 text-sm text-fincash-ink/60">Financeiro</p>
        </div>

        {/* Card do Formulário - Sem shadow, com borda fina */}
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-fincash-ink/10 bg-white p-8">
          <h2 className="mb-6 text-xl font-semibold text-fincash-ink">Criar conta</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium text-fincash-ink/80">Nome completo</label>
              <input 
                id="name"
                className={inputClass}
                {...reg('name', { required: 'Informe seu nome completo.' })} 
                placeholder="Seu nome" 
              />
              {errors.name && <p className="mt-1 text-sm text-fincash-terracotta">{errors.name.message}</p>}
            </div>
            
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-fincash-ink/80">E-mail</label>
              <input
                id="email"
                className={inputClass}
                {...reg('email', {
                  required: 'Informe seu e-mail.',
                  validate: (value) =>
                    validator.isEmail(value) || 'Informe um e-mail válido.',
                })}
                type="email"
                placeholder="seu@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-fincash-terracotta">{errors.email.message}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-fincash-ink/80">Senha</label>
              <input
                id="password"
                className={inputClass}
                {...reg('password', {
                  required: 'Crie uma senha.',
                  minLength: {
                    value: 6,
                    message: 'A senha precisa ter pelo menos 6 caracteres.'
                  }
                })}
                type="password"
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && <p className="mt-1 text-sm text-fincash-terracotta">{errors.password.message}</p>}
            </div>

            {/* Aceite de Privacidade */}
            <div className="flex items-start gap-3 rounded-lg border border-fincash-ink/10 bg-fincash-ink/5 p-4 mt-2">
              <input
                type="checkbox"
                id="privacy"
                {...reg('privacy', {
                  required: 'Você precisa aceitar a política de privacidade.'
                })}
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-fincash-ink/20 text-fincash-forest focus:ring-fincash-forest"
              />
              <div className="flex-1">
                <label htmlFor="privacy" className="text-sm text-fincash-ink/80">
                  Eu li e aceito a{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="font-medium text-fincash-forest hover:underline"
                  >
                    Política de Privacidade
                  </button>
                </label>
                {errors.privacy && (
                  <p className="mt-1 text-sm text-fincash-terracotta">{errors.privacy.message}</p>
                )}
              </div>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-fincash-forest px-4 py-3 text-sm font-medium text-fincash-cream hover:bg-fincash-forest/90 disabled:opacity-60 transition-colors"
            >
              <UserPlus size={16} />
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
          
          <p className="mt-6 text-center text-sm text-fincash-ink/60">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-fincash-forest hover:underline">Entrar</Link>
          </p>
        </form>

        <PrivacyPolicy
          isOpen={showPrivacyPolicy}
          onClose={() => setShowPrivacyPolicy(false)}
          onAccept={() => setPrivacyAccepted(true)}
        />
      </div>
    </div>
  );
}