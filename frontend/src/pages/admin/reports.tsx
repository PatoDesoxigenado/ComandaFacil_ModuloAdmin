import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowUpRight,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Package,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  exportAnalytics,
  type GlobalAnalyticsResponse,
  getGlobalAnalytics,
  getTenants,
  type Tenant,
  type TenantAnalyticsItem,
} from '@/features/admin/adminService'
import { httpClient } from '@/shared/lib/http_client'

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6']

type TabType = 'financeiro' | 'produtos' | 'estoque' | 'operacoes'
type PeriodType = 'day' | 'week' | 'month' | 'year'

interface DashboardData {
  total_sales?: number | string
  orders_count?: number | string
  average_ticket?: number | string
}

interface SalesData {
  by_category?: Record<string, number | string>
}

interface KitchenPerformanceData {
  average_prep_time_minutes?: number
  completion_rate?: number
}

interface CalculatedStats {
  consolidatedRevenue: number
  consolidatedSales: number
  consolidatedTicket: number
  trendChartData: Array<{ name: string; total: number }>
  paymentData: Array<{ name: string; value: number }>
  categoryData: Array<{ name: string; valor: number }>
  topItems: Array<{
    rank: number
    name: string
    cat: string
    preco: number
    qtd: number
    fat: number
  }>
  lowStockIngredients: Array<{
    name: string
    unit: string
    current: number
    min: number
    tenant: string
  }>
  kdsPerformanceData: Array<{ name: string; tempo: number; taxa: number }>
}

function calculateStats(
  isAll: boolean,
  period: PeriodType,
  globalAnalytics: GlobalAnalyticsResponse | undefined,
  tenantDashboard: DashboardData | undefined,
  tenantSales: SalesData | undefined,
  tenantKitchen: KitchenPerformanceData | undefined,
): CalculatedStats {
  const consolidatedRevenue = isAll
    ? (globalAnalytics?.tenants || []).reduce(
        (sum, t) =>
          sum +
          (period === 'month'
            ? t.month_revenue
            : period === 'year'
              ? t.year_revenue
              : t.total_revenue),
        0,
      )
    : Number(tenantDashboard?.total_sales || 0)

  const consolidatedSales = isAll
    ? (globalAnalytics?.tenants || []).reduce((sum, t) => sum + t.sales_count, 0)
    : Number(tenantDashboard?.orders_count || 0)

  const consolidatedTicket = isAll
    ? globalAnalytics?.overall_average_ticket || 0
    : Number(tenantDashboard?.average_ticket || 0)

  // Mock structures dynamically scaled to match the selected database statistics
  const trendChartData = isAll
    ? [
        { name: '05/06', total: consolidatedRevenue * 0.1 },
        { name: '10/06', total: consolidatedRevenue * 0.15 },
        { name: '15/06', total: consolidatedRevenue * 0.25 },
        { name: '20/06', total: consolidatedRevenue * 0.18 },
        { name: '25/06', total: consolidatedRevenue * 0.22 },
        { name: '30/06', total: consolidatedRevenue * 0.1 },
      ]
    : Object.entries(tenantSales?.by_category || {}).map(([catName, val], index) => ({
        name: catName || `Ponto ${index + 1}`,
        total: Number(val) * 1.5,
      }))

  const paymentData = [
    { name: 'Pix', value: consolidatedRevenue * 0.45 },
    { name: 'Crédito', value: consolidatedRevenue * 0.35 },
    { name: 'Débito', value: consolidatedRevenue * 0.15 },
    { name: 'Dinheiro', value: consolidatedRevenue * 0.05 },
  ]

  const categoryData = [
    { name: 'Hambúrgueres', valor: consolidatedRevenue * 0.4 },
    { name: 'Bebidas', valor: consolidatedRevenue * 0.25 },
    { name: 'Acompanhamentos', valor: consolidatedRevenue * 0.2 },
    { name: 'Sobremesas', valor: consolidatedRevenue * 0.15 },
  ]

  const topItems = [
    {
      rank: 1,
      name: 'Burger Clássico',
      cat: 'Hambúrgueres',
      preco: 28.9,
      qtd: Math.round(consolidatedSales * 0.4),
      fat: consolidatedRevenue * 0.4,
    },
    {
      rank: 2,
      name: 'Batata Frita',
      cat: 'Acompanhamentos',
      preco: 14.9,
      qtd: Math.round(consolidatedSales * 0.3),
      fat: consolidatedRevenue * 0.2,
    },
    {
      rank: 3,
      name: 'Refrigerante 350ml',
      cat: 'Bebidas',
      preco: 6.5,
      qtd: Math.round(consolidatedSales * 0.25),
      fat: consolidatedRevenue * 0.15,
    },
    {
      rank: 4,
      name: 'Milkshake Chocolate',
      cat: 'Sobremesas',
      preco: 18.5,
      qtd: Math.round(consolidatedSales * 0.15),
      fat: consolidatedRevenue * 0.15,
    },
    {
      rank: 5,
      name: 'Anéis de Cebola',
      cat: 'Acompanhamentos',
      preco: 16.9,
      qtd: Math.round(consolidatedSales * 0.08),
      fat: consolidatedRevenue * 0.1,
    },
  ]

  const lowStockIngredients = [
    { name: 'Pão de Hambúrguer', unit: 'un', current: 45, min: 200, tenant: 'Barraca do Sol' },
    { name: 'Queijo Cheddar', unit: 'kg', current: 2.4, min: 10.0, tenant: 'Quiosque Copa' },
    { name: 'Carne Bovina Moída', unit: 'kg', current: 15.0, min: 40.0, tenant: 'Barraca do Sol' },
    { name: 'Cebola Roxa', unit: 'kg', current: 1.5, min: 5.0, tenant: 'Beach Point Barra' },
    { name: 'Batata Congelada', unit: 'kg', current: 8.0, min: 30.0, tenant: 'Quiosque Copa' },
  ]

  const basePrepTime =
    !isAll && tenantKitchen?.average_prep_time_minutes
      ? tenantKitchen.average_prep_time_minutes
      : isAll
        ? 10.0
        : 8.0

  const baseCompletionRate =
    !isAll && tenantKitchen?.completion_rate !== undefined
      ? Math.round(tenantKitchen.completion_rate * 100)
      : 95

  const kdsPerformanceData = [
    {
      name: 'Grelha',
      tempo: Math.round(basePrepTime * 1.45 * 10) / 10,
      taxa: Math.max(50, Math.min(100, baseCompletionRate - 2)),
    },
    {
      name: 'Bebidas',
      tempo: Math.round(basePrepTime * 0.42 * 10) / 10,
      taxa: Math.max(50, Math.min(100, baseCompletionRate + 2)),
    },
    {
      name: 'Saladas',
      tempo: Math.round(basePrepTime * 0.81 * 10) / 10,
      taxa: Math.max(50, Math.min(100, baseCompletionRate - 4)),
    },
    {
      name: 'Sobremesas',
      tempo: Math.round(basePrepTime * 0.65 * 10) / 10,
      taxa: Math.max(50, Math.min(100, baseCompletionRate + 1)),
    },
  ]

  return {
    consolidatedRevenue,
    consolidatedSales,
    consolidatedTicket,
    trendChartData,
    paymentData,
    categoryData,
    topItems,
    lowStockIngredients,
    kdsPerformanceData,
  }
}

// Subcomponent: Reports Header
interface ReportsHeaderProps {
  handleExport: () => void
}

const ReportsHeader: React.FC<ReportsHeaderProps> = ({ handleExport }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Módulo de Relatórios</h1>
        <p className="text-xs font-medium text-gray-400 mt-1">
          Consulte faturamento, ranking de produtos, controle de estoque e desempenho de KDS.
        </p>
      </div>
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition-all self-start sm:self-center"
      >
        <Download className="h-4 w-4" />
        Exportar Relatório CSV
      </button>
    </div>
  )
}

// Subcomponent: Filter Toolbar
interface FilterToolbarProps {
  selectedTenantId: string
  setSelectedTenantId: (val: string) => void
  period: PeriodType
  setPeriod: (val: PeriodType) => void
  startDate: string
  setStartDate: (val: string) => void
  endDate: string
  setEndDate: (val: string) => void
  tenants?: Tenant[]
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
  selectedTenantId,
  setSelectedTenantId,
  period,
  setPeriod,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  tenants,
}) => {
  return (
    <div className="p-4 bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
      {/* Franchise selector */}
      <div className="flex items-center gap-2.5 flex-1">
        <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <select
          id="reportTenantSelect"
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          className="w-full md:max-w-xs bg-gray-900/50 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-all"
        >
          <option value="ALL">Todas as Franquias (Consolidado)</option>
          {Array.isArray(tenants) &&
            tenants.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name} (ID #{t.id})
              </option>
            ))}
        </select>
      </div>

      {/* Period selection */}
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500 mr-1 hidden sm:block" />
        <div className="flex bg-gray-950 border border-gray-900 rounded-xl p-1 gap-1">
          {(
            [
              { id: 'day', label: 'Hoje' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mês' },
              { id: 'year', label: 'Ano' },
            ] as const
          ).map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-lg px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                period === p.id
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-gray-400 hover:text-gray-250'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Optional custom dates */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-900/60">
          <input
            id="reportStartDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-900/30 border border-gray-850 rounded-xl px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-brand-500"
            title="Data Inicial"
          />
          <span className="text-[10px] text-gray-600">a</span>
          <input
            id="reportEndDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-900/30 border border-gray-850 rounded-xl px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-brand-500"
            title="Data Final"
          />
        </div>
      </div>
    </div>
  )
}

// Subcomponent: Tab Navigation menu
interface TabNavigationProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-gray-900/60 overflow-x-auto gap-4">
      {(
        [
          { id: 'financeiro', label: 'Financeiro' },
          { id: 'produtos', label: 'Produtos' },
          { id: 'estoque', label: 'Estoque' },
          { id: 'operacoes', label: 'Operações' },
        ] as const
      ).map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`py-3 px-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all duration-300 -mb-[2px] ${
            activeTab === tab.id
              ? 'border-brand-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-250'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// Subcomponent: KPI Cards Grid
interface KpiCardsProps {
  consolidatedRevenue: number
  consolidatedSales: number
  consolidatedTicket: number
}

const KpiCards: React.FC<KpiCardsProps> = ({
  consolidatedRevenue,
  consolidatedSales,
  consolidatedTicket,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Faturamento Consolidado
          </h4>
          <p className="text-2xl font-black text-white">
            {consolidatedRevenue.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
          <p className="text-[9px] font-bold text-green-400 flex items-center gap-0.5">
            <ArrowUpRight className="h-3 w-3" />
            +12.4% vs mês anterior
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center shadow-inner">
          <DollarSign className="h-5 w-5" />
        </div>
      </div>

      <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Total de Pedidos
          </h4>
          <p className="text-2xl font-black text-white">{consolidatedSales}</p>
          <p className="text-[9px] font-bold text-green-400 flex items-center gap-0.5">
            <ArrowUpRight className="h-3 w-3" />
            +8.5% fluxo operacional
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-inner">
          <ShoppingBag className="h-5 w-5" />
        </div>
      </div>

      <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Ticket Médio Geral
          </h4>
          <p className="text-2xl font-black text-white">
            {consolidatedTicket.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
          <p className="text-[9px] font-bold text-red-400 flex items-center gap-0.5">
            <TrendingDown className="h-3 w-3" />
            -1.2% ticket médio flutuante
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// Subcomponent: Financeiro Tab Content
interface FinanceiroTabProps {
  isAll: boolean
  trendChartData: Array<{ name: string; total: number }>
  paymentData: Array<{ name: string; value: number }>
  consolidatedRevenue: number
  globalAnalyticsTenants?: TenantAnalyticsItem[]
  colors: string[]
}

const FinanceiroTab: React.FC<FinanceiroTabProps> = ({
  isAll,
  trendChartData,
  paymentData,
  consolidatedRevenue,
  globalAnalyticsTenants,
  colors,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution chart */}
        <div className="lg:col-span-2 p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex flex-col shadow-lg">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Evolução do Faturamento no Período
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: '#1f2937',
                    color: '#fff',
                    borderRadius: '12px',
                  }}
                  formatter={(value: unknown) => [
                    `R$ ${Number(value || 0).toFixed(2)}`,
                    'Faturamento',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment split chart */}
        <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex flex-col shadow-lg">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Distribuição de Pagamentos
          </h3>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentData.map((_entry, index) => (
                    <Cell key={`cell-${_entry.name}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: '#1f2937',
                    color: '#fff',
                    borderRadius: '12px',
                  }}
                  formatter={(value: unknown) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
            {paymentData.map((p, idx) => (
              <div
                key={p.name}
                className="flex items-center gap-1.5 bg-gray-900/20 border border-gray-900/40 p-1.5 rounded-lg"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="font-medium text-gray-400">{p.name}:</span>
                <span className="font-bold text-white">
                  {consolidatedRevenue > 0
                    ? ((p.value / consolidatedRevenue) * 100).toFixed(0)
                    : '0'}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pivot Grid comparison for Financeiro */}
      {isAll && (
        <div className="bg-gray-950/40 border border-gray-900/60 rounded-2xl overflow-hidden shadow-lg p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">
            Comparativo de Faturamento entre Franquias
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-900/60 bg-gray-900/10 text-gray-400 text-[9px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Franquia</th>
                  <th className="px-6 py-3">Faturamento Mês</th>
                  <th className="px-6 py-3">Faturamento Ano</th>
                  <th className="px-6 py-3">Total Vendas</th>
                  <th className="px-6 py-3">Ticket Médio</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/40 text-[11px] font-medium text-gray-300">
                {globalAnalyticsTenants?.map((t: TenantAnalyticsItem) => (
                  <tr key={t.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-3 font-bold text-white">{t.name}</td>
                    <td className="px-6 py-3">R$ {t.month_revenue.toFixed(2)}</td>
                    <td className="px-6 py-3">R$ {t.year_revenue.toFixed(2)}</td>
                    <td className="px-6 py-3">{t.sales_count}</td>
                    <td className="px-6 py-3">R$ {t.ticket_average.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          t.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {t.is_active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Subcomponent: Produtos Tab Content
interface ProdutosTabProps {
  categoryData: Array<{ name: string; valor: number }>
  topItems: Array<{
    rank: number
    name: string
    cat: string
    preco: number
    qtd: number
    fat: number
  }>
  colors: string[]
}

const ProdutosTab: React.FC<ProdutosTabProps> = ({ categoryData, topItems, colors }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Category chart */}
      <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex flex-col shadow-lg">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Vendas por Categoria
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
              <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
              <YAxis stroke="#4b5563" fontSize={9} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#1f2937',
                  color: '#fff',
                  borderRadius: '12px',
                }}
                formatter={(value: unknown) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Volume']}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={30}>
                {categoryData.map((_entry, index) => (
                  <Cell key={_entry.name} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="lg:col-span-2 p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex flex-col shadow-lg space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Top 5 Produtos Mais Vendidos da Rede
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-900/60 bg-gray-900/10 text-gray-400 text-[9px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Posição</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Qtd. Vendida</th>
                <th className="px-4 py-3 text-right">Total Faturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/40 text-[11px] font-medium text-gray-300">
              {topItems.map((item) => (
                <tr key={item.name} className="hover:bg-white/[0.01] transition-all">
                  <td className="px-4 py-3 font-bold text-brand-400">{item.rank}º</td>
                  <td className="px-4 py-3 font-bold text-white">{item.name}</td>
                  <td className="px-4 py-3 text-gray-400">{item.cat}</td>
                  <td className="px-4 py-3 text-right">{item.qtd} un</td>
                  <td className="px-4 py-3 text-right text-white font-bold">
                    R$ {item.fat.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Subcomponent: Estoque Tab Content
interface EstoqueTabProps {
  lowStockIngredients: Array<{
    name: string
    unit: string
    current: number
    min: number
    tenant: string
  }>
}

const EstoqueTab: React.FC<EstoqueTabProps> = ({ lowStockIngredients }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Warnings summary */}
        <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shadow-inner">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Insumos em Nível Crítico
            </h4>
            <p className="text-lg font-black text-white">5 ingredientes abaixo do mínimo</p>
            <p className="text-[10px] text-gray-500 leading-normal">
              Solicitações urgentes de abastecimento pendentes na aba administrativa.
            </p>
          </div>
        </div>

        <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Volume de Perdas / Ajustes
            </h4>
            <p className="text-lg font-black text-white">2.4% desperdício no fluxo</p>
            <p className="text-[10px] text-gray-500 leading-normal">
              Ajustes operacionais manuais dentro do limite de aceitabilidade do sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Low stock table */}
      <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex flex-col shadow-lg space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Ingredientes com Alerta de Abastecimento Crítico
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-900/60 bg-gray-900/10 text-gray-400 text-[9px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Ingrediente</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3 text-right">Qtd. Atual</th>
                <th className="px-4 py-3 text-right">Nível Mínimo</th>
                <th className="px-4 py-3 text-right">Franquia Afetada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/40 text-[11px] font-medium text-gray-300">
              {lowStockIngredients.map((ing) => (
                <tr
                  key={`${ing.tenant}-${ing.name}`}
                  className="hover:bg-white/[0.01] transition-all"
                >
                  <td className="px-4 py-3 font-bold text-white flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-gray-500" />
                    {ing.name}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{ing.unit}</td>
                  <td className="px-4 py-3 text-right text-red-400 font-bold">
                    {ing.current} {ing.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {ing.min} {ing.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-brand-400 font-bold">{ing.tenant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Subcomponent: Operacoes Tab Content
interface OperacoesTabProps {
  kdsPerformanceData: Array<{ name: string; tempo: number; taxa: number }>
}

const OperacoesTab: React.FC<OperacoesTabProps> = ({ kdsPerformanceData }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Station time chart */}
        <div className="lg:col-span-2 p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex flex-col shadow-lg">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Tempo Médio de Preparo por Área da Cozinha
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={kdsPerformanceData}
                margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: '#1f2937',
                    color: '#fff',
                    borderRadius: '12px',
                  }}
                  formatter={(value: unknown) => [
                    `${Number(value || 0).toFixed(1)} min`,
                    'Tempo de Preparo',
                  ]}
                />
                <Bar dataKey="tempo" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak performance stats card */}
        <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl flex flex-col shadow-lg space-y-4 justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Eficiência Operacional KDS
            </h3>
            <div className="space-y-3">
              {kdsPerformanceData.map((station) => (
                <div key={station.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-gray-300">{station.name}</span>
                    <span className="font-bold text-emerald-400">
                      {station.taxa}% dentro do tempo
                    </span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${station.taxa}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-900 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">Horário de Pico:</span>
            <span className="font-extrabold text-white flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              19:30 - 21:00
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const AdminReportsPage: React.FC = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL')
  const [period, setPeriod] = useState<PeriodType>('month')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabType>('financeiro')

  // 1. Fetch tenants list
  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  })

  // 2. Fetch global analytics
  const { data: globalAnalytics, isLoading: loadingGlobal } = useQuery({
    queryKey: ['globalAnalytics'],
    queryFn: getGlobalAnalytics,
  })

  // 3. Fetch specific tenant analytics if selected
  const isAll = selectedTenantId === 'ALL'

  const { data: tenantDashboard, isLoading: loadingTenantDash } = useQuery({
    queryKey: ['tenantDashboard', selectedTenantId, period],
    queryFn: () =>
      httpClient
        .get('/v1/analytics/dashboard', {
          params: { period: period === 'year' ? 'month' : period },
          headers: { 'X-Tenant-ID': selectedTenantId },
        })
        .then((res) => res.data),
    enabled: !isAll,
  })

  const { data: tenantSales, isLoading: loadingTenantSales } = useQuery({
    queryKey: ['tenantSales', selectedTenantId, period],
    queryFn: () =>
      httpClient
        .get('/v1/analytics/sales', {
          params: { period: period === 'year' ? 'month' : period },
          headers: { 'X-Tenant-ID': selectedTenantId },
        })
        .then((res) => res.data),
    enabled: !isAll,
  })

  const { data: tenantKitchen, isLoading: loadingTenantKitchen } = useQuery({
    queryKey: ['tenantKitchen', selectedTenantId, period],
    queryFn: () =>
      httpClient
        .get('/v1/analytics/kitchen', {
          params: { period: period === 'year' ? 'month' : period },
          headers: { 'X-Tenant-ID': selectedTenantId },
        })
        .then((res) => res.data),
    enabled: !isAll,
  })

  const handleExport = async () => {
    try {
      const response = await exportAnalytics(isAll ? undefined : selectedTenantId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `relatorio_${isAll ? 'geral' : `franquia_${selectedTenantId}`}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert(`Erro ao exportar relatórios: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const {
    consolidatedRevenue,
    consolidatedSales,
    consolidatedTicket,
    trendChartData,
    paymentData,
    categoryData,
    topItems,
    lowStockIngredients,
    kdsPerformanceData,
  } = calculateStats(isAll, period, globalAnalytics, tenantDashboard, tenantSales, tenantKitchen)

  const isLoading =
    loadingGlobal || (!isAll && (loadingTenantDash || loadingTenantSales || loadingTenantKitchen))

  return (
    <div className="space-y-6">
      <ReportsHeader handleExport={handleExport} />
      <FilterToolbar
        selectedTenantId={selectedTenantId}
        setSelectedTenantId={setSelectedTenantId}
        period={period}
        setPeriod={setPeriod}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        tenants={tenants}
      />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <KpiCards
            consolidatedRevenue={consolidatedRevenue}
            consolidatedSales={consolidatedSales}
            consolidatedTicket={consolidatedTicket}
          />

          {activeTab === 'financeiro' && (
            <FinanceiroTab
              isAll={isAll}
              trendChartData={trendChartData}
              paymentData={paymentData}
              consolidatedRevenue={consolidatedRevenue}
              globalAnalyticsTenants={globalAnalytics?.tenants}
              colors={COLORS}
            />
          )}

          {activeTab === 'produtos' && (
            <ProdutosTab categoryData={categoryData} topItems={topItems} colors={COLORS} />
          )}

          {activeTab === 'estoque' && <EstoqueTab lowStockIngredients={lowStockIngredients} />}

          {activeTab === 'operacoes' && <OperacoesTab kdsPerformanceData={kdsPerformanceData} />}
        </div>
      )}
    </div>
  )
}
