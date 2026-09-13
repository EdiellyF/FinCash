# FinCash Design System - Componentes UI Base

Este repositório contém os componentes UI reutilizáveis do frontend FinCash. Utilize sempre estes componentes em vez de criar elementos visuais duplicados ou estilos inline com Tailwind genérico.

---

## 1. StatCard
Card de estatística/métrica financeira com formatação monetária e indicador visual de tipo.

### Props
- `title` (string): Título da estatística.
- `value` (number): Valor numérico formatado automaticamente como moeda (`R$ ...`) na fonte monoespaçada.
- `subtitle` (string, opcional): Descrição ou contexto secundário.
- `type` ('income' | 'expense' | 'neutral', opcional): Define as cores do ícone/indicador (`income` -> forest, `expense` -> terracotta, `neutral` -> ink/70).
- `icon` (Componente Lucide, opcional): Ícone customizado. Se omitido, usa o ícone de tendência padrão.

### Exemplo
```jsx
import StatCard from '../components/ui/StatCard';
import { Wallet } from 'lucide-react';

<StatCard
  title="Receita Mensal"
  value={5400.50}
  subtitle="+12% em relação ao mês anterior"
  type="income"
  icon={Wallet}
/>
```

---

## 2. PageCard
Container em cartão estático com borda suave, utilizado para seções ou blocos de conteúdo nas páginas.

### Props
- `title` (string, opcional): Título da seção.
- `actions` (ReactNode, opcional): Botões ou controles alinhados à direita do cabeçalho.
- `children` (ReactNode): Conteúdo interno do card.

### Exemplo
```jsx
import PageCard from '../components/ui/PageCard';

<PageCard
  title="Histórico de Transações"
  actions={<button className="btn-secondary">Exportar</button>}
>
  <p>Conteúdo da tabela de transações...</p>
</PageCard>
```

---

## 3. ProgressBar
Barra de progresso reutilizável com detecção automática de limite excedido.

### Props
- `value` (number): Percentual de progresso (0-100+). Valores > 100 aplicam a cor `fincash-terracotta` automaticamente.
- `color` (string, opcional): Classe CSS de cor de preenchimento (default: `'bg-fincash-forest'`).
- `showLabel` (boolean, opcional): Exibe o percentual formatado acima da barra.
- `className` (string, opcional): Classes adicionais de estilização.

### Exemplo
```jsx
import ProgressBar from '../components/ui/ProgressBar';

<ProgressBar value={75} showLabel />
<ProgressBar value={110} showLabel /> {/* Muda automaticamente para terracotta */}
```

---

## 4. Badge
Tag/Pill visual para exibição de status, categorias ou indicadores.

### Props
- `children` (ReactNode): Conteúdo do badge (texto/ícone).
- `tone` ('forest' | 'gold' | 'terracotta' | 'neutral', opcional): Tom visual (default: `'neutral'`).
- `className` (string, opcional): Classes adicionais de estilização.

### Exemplo
```jsx
import Badge from '../components/ui/Badge';

<Badge tone="forest">Concluído</Badge>
<Badge tone="gold">+12% este mês</Badge>
<Badge tone="terracotta">Excedido</Badge>
<Badge tone="neutral">Em andamento</Badge>
```

---

## 5. FormModal
Modal flutuante centralizado com backdrop e sombra flutuante (`shadow-floating`).

### Props
- `open` (boolean): Controla a visibilidade do modal.
- `title` (string): Título exibido no cabeçalho do modal.
- `onClose` (function): Callback disparado ao clicar no botão de fechar ou cancelar.
- `children` (ReactNode): Conteúdo do formulário ou modal.

### Exemplo
```jsx
import FormModal from '../components/ui/FormModal';

<FormModal open={isOpen} title="Nova Transação" onClose={() => setIsOpen(false)}>
  <form>
    {/* campos de formulário */}
  </form>
</FormModal>
```
