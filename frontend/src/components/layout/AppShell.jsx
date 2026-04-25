import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  Moon, Sun, LayoutDashboard, ArrowLeftRight, Tag, Target, Wallet,
  BarChart2, User, GraduationCap, TrendingUp, LogOut, Menu
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
  { to: '/profile', label: 'Perfil', icon: User },
];

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">Finance</p>
          <p className="text-xs text-emerald-600 font-semibold leading-tight">FinCash</p>
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        <p className="mb-1 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu Principal</p>
        {links.map(link => (
          <NavItem key={link.to} {...link} onClick={onNavClick} />
        ))}
      </nav>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-red-100 hover:text-red-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
        >
          <LogOut size={14} />
          Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 rounded-r-2xl bg-white p-5 shadow-xl transition-transform duration-300 lg:hidden dark:bg-slate-900 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <SidebarContent />
          </div>
        </div>

        <main className="min-w-0 space-y-4">
          <header className="flex items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm dark:bg-slate-900">
            <button className="rounded-xl border border-slate-200 p-2 lg:hidden dark:border-slate-700" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">FinCash</p>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Financeiro</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
