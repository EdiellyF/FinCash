import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TrendingUp, LogIn, Shield } from 'lucide-react';
import { useState } from 'react';
import PrivacyPolicy from '../components/ui/PrivacyPolicy';

export default function Login() {
  const { register: registerInput, handleSubmit, formState: { isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  async function onSubmit(values) {
    try {
      await login(values);
      toast.success('Login realizado com sucesso.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao entrar. Verifique seus dados.');
    }
  }

  // Mesma classe padronizada de inputs usada no Register
  const inputClass = "w-full rounded-md border border-fincash-ink/20 bg-white px-3 py-2 text-sm text-fincash-ink outline-none focus:border-fincash-forest focus:ring-1 focus:ring-fincash-forest placeholder:text-fincash-ink/40 transition-colors";

  return (
    <div className="flex min-h-screen items-center justify-center bg-fincash-cream p-4">
      <div className="w-full max-w-md">
        
        {/* Logo e Título */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fincash-forest text-fincash-cream">
            <TrendingUp size={28} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-fincash-ink">FinCash</h1>
          <p className="mt-1 text-sm text-fincash-ink/60">Financeiro</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-fincash-ink/10 bg-white p-8">
          <h2 className="mb-6 text-xl font-semibold text-fincash-ink">Entrar na conta</h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-fincash-ink/80">E-mail</label>
              <input 
                {...registerInput('email')} 
                type="email" 
                placeholder="seu@email.com" 
                className={inputClass}
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fincash-ink/80">Senha</label>
              <input 
                {...registerInput('password')} 
                type="password" 
                placeholder="••••••••" 
                className={inputClass}
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fincash-ink/80">Código TOTP (6 dígitos)</label>
              <input 
                {...registerInput('totpCode')} 
                type="text" 
                placeholder="123456" 
                className={inputClass}
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-fincash-forest px-4 py-3 text-sm font-medium text-fincash-cream hover:bg-fincash-forest/90 disabled:opacity-60 transition-colors"
            >
              <LogIn size={16} />
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          
          <div className="mt-6 flex justify-between text-sm">
            <Link to="/register" className="font-medium text-fincash-forest hover:underline">Criar conta</Link>
            <Link to="/reset-password-with-backup-code" className="font-medium text-fincash-ink/60 hover:text-fincash-ink hover:underline transition-colors">Esqueci minha senha</Link>
          </div>
          
          <div className="mt-4 text-center text-sm">
            <Link to="/backup-login" className="font-medium text-fincash-ink/60 hover:text-fincash-ink hover:underline transition-colors">Entrar com código de backup</Link>
          </div>
          
          <div className="mt-6 text-center border-t border-fincash-ink/10 pt-4">
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(true)}
              className="flex items-center justify-center gap-2 w-full text-sm text-fincash-ink/60 hover:text-fincash-forest transition-colors mx-auto"
            >
              <Shield size={14} />
              <span>Política de Privacidade</span>
            </button>
          </div>
        </form>

        <PrivacyPolicy
          isOpen={showPrivacyPolicy}
          onClose={() => setShowPrivacyPolicy(false)}
        />
      </div>
    </div>
  );
}