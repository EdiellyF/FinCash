import AppShell from '../components/layout/AppShell';
import PageCard from '../components/ui/PageCard';
import { useState } from 'react';
import { Shield, TrendingUp, Building2, Calculator, ChevronDown, ChevronUp, BookOpen, Target, Info, Lightbulb, MapPin, Utensils, Bus, Zap } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Simulator Components                                                  */
/* ------------------------------------------------------------------ */

function EmergencyReserveSimulator() {
  const [monthly, setMonthly] = useState('');
  const [contribution, setContribution] = useState('');
  const [months, setMonths] = useState(6);

  const target = parseFloat(monthly || 0) * months;
  const c = parseFloat(contribution || 0);
  const monthsNeeded = c > 0 ? Math.ceil(target / c) : null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
      <div className="mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-emerald-600" />
        <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Simulador de Reserva</h4>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Despesa mensal (R$)</label>
          <input
            type="number"
            value={monthly}
            onChange={e => setMonthly(e.target.value)}
            placeholder="Ex: 3000"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Aporte mensal (R$)</label>
          <input
            type="number"
            value={contribution}
            onChange={e => setContribution(e.target.value)}
            placeholder="Ex: 500"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Meses de cobertura</label>
          <select
            value={months}
            onChange={e => setMonths(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value={3}>3 meses (mínimo)</option>
            <option value={6}>6 meses (recomendado)</option>
            <option value={12}>12 meses (ideal)</option>
          </select>
        </div>
      </div>
      {target > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-3 dark:bg-slate-800">
            <p className="text-xs text-slate-500">Meta de reserva</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              R$ {target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {monthsNeeded && (
            <div className="rounded-xl bg-white p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Tempo para atingir</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {monthsNeeded} {monthsNeeded === 1 ? 'mês' : 'meses'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FixedIncomeSimulator() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('12');
  const [period, setPeriod] = useState('12');

  const p = parseFloat(principal || 0);
  const r = parseFloat(rate || 0) / 100 / 12;
  const n = parseInt(period || 0);
  const amount = p * Math.pow(1 + r, n);
  const earnings = amount - p;

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-blue-600" />
        <h4 className="font-bold text-blue-800 dark:text-blue-300">Simulador de Renda Fixa</h4>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Valor inicial (R$)</label>
          <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="Ex: 1000"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Taxa anual (%)</label>
          <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="Ex: 12"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Período (meses)</label>
          <input type="number" value={period} onChange={e => setPeriod(e.target.value)} placeholder="Ex: 12"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800" />
        </div>
      </div>
      {p > 0 && n > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3 dark:bg-slate-800">
            <p className="text-xs text-slate-500">Valor final</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl bg-white p-3 dark:bg-slate-800">
            <p className="text-xs text-slate-500">Rendimento</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">+ R$ {earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl bg-white p-3 dark:bg-slate-800">
            <p className="text-xs text-slate-500">Rentabilidade</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{((earnings / p) * 100).toFixed(2)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion FAQ                                                         */
/* ------------------------------------------------------------------ */
function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-slate-800 dark:text-slate-200"
      >
        {q}
        {open ? <ChevronUp size={16} className="shrink-0 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
      </button>
      {open && <p className="border-t border-slate-100 px-4 pb-4 pt-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">{a}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Module Card                                                           */
/* ------------------------------------------------------------------ */
function ModuleCard({ icon: Icon, title, color, children }) {
  const colorMap = {
    emerald: { header: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    blue: { header: 'bg-blue-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    purple: { header: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  };
  const c = colorMap[color];

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
      <div className={`flex items-center gap-3 px-5 py-4 text-white ${c.header}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Icon size={20} />
        </div>
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Tip({ text }) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <Info size={15} className="mt-0.5 shrink-0 text-slate-400" />
      <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                             */
/* ------------------------------------------------------------------ */
export default function Education() {
  return (
    <AppShell>
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 p-6 text-white shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Módulos Educativos</p>
            <h2 className="mt-1 text-2xl font-bold">Educação Financeira</h2>
            <p className="mt-1 text-sm text-emerald-100">
              Aprenda sobre reservas de emergência, renda fixa e fundos imobiliários para construir sua independência financeira.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Shield, label: 'Reserva de Emergência' },
            { icon: TrendingUp, label: 'Renda Fixa' },
            { icon: Building2, label: 'Fundos Imobiliários' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold">
              <Icon size={16} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Dicas para Estudantes */}
      <ModuleCard icon={Lightbulb} title="💡 Dicas de Economia para Estudantes Universitários" color="blue">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Como estudante universitário, você tem gastos específicos que podem ser otimizados. Aqui estão dicas práticas para economizar dinheiro enquanto estuda:
        </p>

        <div className="space-y-3">
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Utensils size={16} className="text-orange-600" /> Alimentação
            </h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>✓ Use o restaurante universitário (R$ 2-5 por refeição vs. R$ 30-50 em restaurantes)</li>
              <li>✓ Compre alimentos em grupos para aproveitar descontos no atacado</li>
              <li>✓ Prepare marmitas para os dias de aula — economiza até 60% vs. comprar pronto</li>
              <li>✓ Evite delivery (cobra 20-30% de taxa) — pida comida com amigos ou compre no local</li>
              <li>✓ Procure por promoções de frutas e verduras de época no mercado</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Bus size={16} className="text-yellow-600" /> Transporte
            </h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>✓ Utilize o passe estudantil — pode gerar 40-50% de desconto</li>
              <li>✓ Faça caronas com outros estudantes ou use aplicativos de carona compartilhada</li>
              <li>✓ Prefira andar ou bicicleta para distâncias curtas (economia + saúde)</li>
              <li>✓ Compre passagens com antecedência para viagens (geralmente R$ 50-80 mais barato)</li>
              <li>✓ Estude na universidade em vez de ir para casa — economiza combustível/passagem</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <BookOpen size={16} className="text-blue-600" /> Materiais de Estudo
            </h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>✓ Compre livros usados em grupos de Facebook ou OLX (até 70% de desconto)</li>
              <li>✓ Use a biblioteca da universidade — é grátis e tem acervo considerável</li>
              <li>✓ Compartilhe materiais com colegas de curso e faça grupos de estudo</li>
              <li>✓ Procure PDFs legais de livros abertos e repositórios universitários</li>
              <li>✓ Negocie cadernos, canetas e materiais em grupo — muitas lojas dão desconto</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Zap size={16} className="text-purple-600" /> Descontos Estudantis
            </h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>✓ Cinema e teatro — apresente carteirinha estudantil para 50% de desconto</li>
              <li>✓ Livros — muitas editoras dão 10-15% para estudantes com carteira</li>
              <li>✓ Museus, parques e eventos — pesquise descontos estudantis com antecedência</li>
              <li>✓ Software — Adobe, Microsoft Office, JetBrains oferecem planos grátis para estudantes</li>
              <li>✓ Telefonia e internet — procure planos especiais para universitários</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <MapPin size={16} className="text-red-600" /> Palmas, Tocantins — Dicas Locais
            </h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>✓ <strong>IFTO/UFT:</strong> Restaurantes nas universidades oferecem as refeições mais baratas</li>
              <li>✓ <strong>Transporte:</strong> O passe estudantil em Palmas funciona em ônibus urbanos (R$ 4,50 → desconto)</li>
              <li>✓ <strong>República:</strong> Compartilhar casa com outros estudantes reduz aluguel em 40-60%</li>
              <li>✓ <strong>Shopping:</strong> Procure por cinemas com meia-entrada para estudantes</li>
              <li>✓ <strong>Mercados:</strong> Palmas tem algumas feiras de agricultores com preços 20-30% menores</li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-xs font-bold text-blue-800 dark:text-blue-300">💰 Meta: Economizar R$ 300-500/mês com essas dicas</p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Se você aplicar apenas metade dessas recomendações, é possível economizar R$ 150-300 mensais. Em 12 meses, isso pode render R$ 1.800 a R$ 3.600 — o suficiente para um notebook para estudos, um intercâmbio curto ou uma reserva de emergência!
          </p>
        </div>
      </ModuleCard>

      {/* Module 1: Emergency Reserve */}
      <ModuleCard icon={Shield} title="Módulo 1 — Reserva de Emergência" color="emerald">
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>A <strong>reserva de emergência</strong> é o alicerce da saúde financeira. Ela protege você de imprevistos como desemprego, problemas de saúde ou reparos urgentes, sem precisar recorrer a empréstimos ou cartão de crédito.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { who: 'Emprego estável', months: '3–6 meses' },
              { who: 'Autônomo / Freelancer', months: '6–12 meses' },
              { who: 'Empresário', months: '12 meses+' },
            ].map(item => (
              <div key={item.who} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{item.who}</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{item.months}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Onde guardar?</p>
          {[
            { name: 'Tesouro Selic', desc: 'Liquidez diária, rende mais que poupança, garantido pelo governo.' },
            { name: 'CDB com liquidez diária', desc: 'Oferecido por bancos, cobertura do FGC até R$ 250 mil.' },
            { name: 'Fundos DI', desc: 'Aplicação coletiva em títulos pós-fixados, acessível com valores baixos.' },
          ].map(item => (
            <div key={item.name} className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <Target size={14} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-bold">{item.name}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <EmergencyReserveSimulator />

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dúvidas frequentes</p>
          <FAQ q="Posso usar a poupança como reserva?" a="A poupança é uma opção, porém seu rendimento é menor. Para reserva de emergência, prefira Tesouro Selic ou CDB com liquidez diária, que rendem mais e têm resgate imediato." />
          <FAQ q="Preciso guardar o valor exato de 6 meses?" a="É uma referência. O mais importante é começar. Mesmo 1 mês de reserva já faz diferença. Vá construindo progressivamente sem comprometer seu orçamento." />
          <FAQ q="Reserva de emergência e investimento são a mesma coisa?" a="Não. A reserva é liquidez — precisa estar disponível imediatamente. Investimentos têm horizonte de médio/longo prazo e podem não estar disponíveis quando você precisar." />
        </div>
      </ModuleCard>

      {/* Module 2: Fixed Income */}
      <ModuleCard icon={TrendingUp} title="Módulo 2 — Renda Fixa" color="blue">
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>A <strong>renda fixa</strong> é a classe de investimentos onde você empresta dinheiro a bancos, empresas ou ao governo e recebe juros em troca. É ideal para iniciantes por ter menor risco e previsibilidade.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Tesouro Direto', risk: 'Baixíssimo', return: 'CDI / IPCA+', min: 'R$ 30', highlight: true },
            { title: 'CDB', risk: 'Baixo', return: '100%–120% CDI', min: 'Varia por banco', highlight: false },
            { title: 'LCI / LCA', risk: 'Baixo', return: 'CDI (isento IR)', min: 'A partir de R$ 1.000', highlight: false },
            { title: 'Debêntures', risk: 'Médio', return: 'CDI+', min: 'A partir de R$ 1.000', highlight: false },
          ].map(item => (
            <div key={item.title} className={`rounded-xl p-4 ${item.highlight ? 'border-2 border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20' : 'border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                {item.highlight && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">Indicado</span>}
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-500">Risco: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.risk}</span></p>
                <p className="text-xs text-slate-500">Retorno: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.return}</span></p>
                <p className="text-xs text-slate-500">Mínimo: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.min}</span></p>
              </div>
            </div>
          ))}
        </div>

        <FixedIncomeSimulator />

        <Tip text="Para iniciantes, comece pelo Tesouro Selic após montar sua reserva de emergência. É o investimento mais seguro do Brasil, com liquidez diária." />

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dúvidas frequentes</p>
          <FAQ q="O que é CDI e por que ele importa?" a="O CDI (Certificado de Depósito Interbancário) é a taxa de referência do mercado. Quando um CDB paga '100% do CDI', significa que seu rendimento acompanha essa taxa, que é próxima à taxa Selic." />
          <FAQ q="Tenho que pagar imposto nos investimentos?" a="Em geral sim, via tabela regressiva de IR. CDB paga IR sobre os rendimentos. LCI/LCA são isentas de IR para pessoa física, o que pode torná-las mais atraentes mesmo com menor taxa nominal." />
          <FAQ q="O que é o FGC?" a="O Fundo Garantidor de Crédito protege seus investimentos em CDB, LCI e LCA em até R$ 250 mil por instituição financeira (e R$ 1 milhão por CPF no total), em caso de falência do banco." />
        </div>
      </ModuleCard>

      {/* Module 3: FIIs */}
      <ModuleCard icon={Building2} title="Módulo 3 — Fundos de Investimento Imobiliário (FIIs)" color="purple">
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>Os <strong>FIIs</strong> permitem investir no mercado imobiliário sem precisar comprar um imóvel. Você adquire cotas de fundos que possuem galpões, shoppings, lajes corporativas, hospitais etc., e recebe aluguéis mensais isentos de IR.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { type: 'FIIs de Tijolo', desc: 'Imóveis físicos: shoppings, galpões, lajes corporativas.' },
            { type: 'FIIs de Papel', desc: 'Títulos imobiliários: CRI, LCI com mais liquidez.' },
            { type: 'FIIs Híbridos', desc: 'Combinam imóveis físicos e papéis para diversificação.' },
            { type: 'FOFs', desc: 'Fundos que investem em outros FIIs — diversificação automática.' },
          ].map(item => (
            <div key={item.type} className="rounded-xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
              <p className="text-xs font-bold text-purple-800 dark:text-purple-300">{item.type}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Como começar com FIIs</p>
          <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {[
              'Abra conta em uma corretora de valores (Rico, XP, Clear, BTG, etc.)',
              'Transfira o valor desejado por TED/PIX',
              'Pesquise FIIs no "home broker" usando o ticker (ex: HGLG11)',
              'Analise: dividend yield, vacância, tipo de imóvel, gestora',
              'Compre as cotas — mínimo: 1 cota (geralmente R$ 80–150)',
              'Receba dividendos mensais isentos de IR diretamente na conta',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Isenção de IR', desc: 'Dividendos mensais isentos para pessoa física' },
            { label: 'Acessibilidade', desc: 'Comece com menos de R$ 200' },
            { label: 'Liquidez', desc: 'Venda suas cotas na bolsa quando quiser' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-purple-100 bg-white p-3 dark:border-purple-900 dark:bg-slate-800">
              <p className="text-xs font-bold text-purple-700 dark:text-purple-400">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <Tip text="FIIs são investimentos de renda variável — o preço das cotas pode cair. Recomendado apenas após ter reserva de emergência e alguma experiência com renda fixa." />

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dúvidas frequentes</p>
          <FAQ q="Preciso de muito dinheiro para investir em FIIs?" a="Não. A maioria das cotas custa entre R$ 80 e R$ 200. Você pode começar com pouco e ir aumentando gradualmente, aproveitando o reinvestimento dos dividendos." />
          <FAQ q="Os dividendos são garantidos?" a="Não. Os dividendos dependem do desempenho do fundo — taxa de ocupação dos imóveis, contratos de aluguel, etc. No entanto, fundos bem geridos tendem a ter histórico consistente de pagamentos." />
          <FAQ q="FII é melhor que comprar um imóvel físico?" a="Depende do objetivo. FIIs oferecem maior liquidez, menor capital inicial e diversificação. Imóvel físico oferece controle total e possível valorização patrimonial. Muitos especialistas recomendam os dois como estratégia combinada." />
        </div>
      </ModuleCard>

      {/* Footer note */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex gap-3">
          <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-xs text-slate-500">
            <strong>Aviso:</strong> Este conteúdo tem caráter educativo e foi desenvolvido pelo Grupo 2 do Projeto de Extensão IFTO — Programa de Capacitação em Letramento Financeiro e Inclusão Digital. As informações não constituem recomendação de investimento. Consulte um profissional certificado (CFP) para decisões financeiras personalizadas.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
