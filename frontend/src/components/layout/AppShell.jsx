import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  Moon, Sun, LayoutDashboard, ArrowLeftRight, Tag, Target, Wallet,
  BarChart2, User, GraduationCap, TrendingUp, LogOut, Menu, MessageSquare
} from 'lucide-react';
import { useState } from 'react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { to: '/categories', label: 'Categorias', icon: Tag },
  { to: '/goals', label: 'Metas', icon: Target },
  { to: '/budgets', label: 'Orçamentos', icon: Wallet },
  { to: '/reports', label: 'Relatórios', icon: BarChart2 },
  { to: '/education', label: 'Educação Financeira', icon: GraduationCap },
  { to: '/chat', label: 'Assistente IA', icon: MessageSquare },
  { to: '/profile', label: 'Perfil', icon: User },
];

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-fincash-forest/10 text-fincash-forest'
          : 'text-fincash-ink/60 hover:bg-fincash-ink/5 dark:text-fincash-cream/60 dark:hover:bg-fincash-cream/5'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const { logout, user } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex h-full flex-col gap-6">
      <Link to="/" className="flex items-center gap-2.5 px-1" onClick={onNavClick}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fincash-forest text-fincash-cream">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-fincash-ink dark:text-fincash-cream">Finance</p>
          <p className="text-xs text-fincash-forest font-semibold leading-tight">FinCash</p>
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        <p className="mb-1 px-4 text-[10px] font-bold text-fincash-ink/40 dark:text-fincash-cream/40">Menu Principal</p>
        {links.map(link => (
          <NavItem key={link.to} {...link} onClick={onNavClick} />
        ))}
      </nav>
      <div className="rounded-lg border border-fincash-ink/10 bg-fincash-ink/5 p-3 dark:border-fincash-cream/10 dark:bg-fincash-cream/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fincash-forest/10 text-sm font-bold text-fincash-forest dark:bg-fincash-forest/30 dark:text-fincash-forest">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fincash-ink dark:text-fincash-cream">{user?.name}</p>
            <p className="truncate text-xs text-fincash-ink/60">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm bg-fincash-ink/10 px-3 py-2 text-xs font-semibold text-fincash-ink transition hover:bg-fincash-terracotta/10 hover:text-fincash-terracotta dark:bg-fincash-cream/10 dark:text-fincash-cream dark:hover:bg-fincash-terracotta/20 dark:hover:text-fincash-terracotta"
        >
          <LogOut size={14} />
          Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-fincash-cream dark:bg-slate-950">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-fincash-ink/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 rounded-r-2xl bg-white p-5 shadow-xl transition-transform duration-300 lg:hidden dark:bg-slate-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-4 rounded-lg border border-fincash-ink/10 bg-white p-5 dark:bg-slate-800">
            <SidebarContent />
          </div>
        </div>

        <main className="min-w-0 space-y-4">
          <header className="flex items-center justify-between gap-3 rounded-lg border border-fincash-ink/10 bg-white px-5 py-4 dark:bg-slate-800">
            <button className="rounded-sm border border-fincash-ink/10 p-2 lg:hidden dark:border-fincash-cream/10" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-widest text-fincash-forest">FinCash</p>
              <h1 className="text-lg font-bold text-fincash-ink dark:text-fincash-cream">Financeiro</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-sm border border-fincash-ink/10 p-2.5 text-fincash-ink transition hover:bg-fincash-ink/5 dark:border-fincash-cream/10 dark:text-fincash-cream dark:hover:bg-fincash-cream/5"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
