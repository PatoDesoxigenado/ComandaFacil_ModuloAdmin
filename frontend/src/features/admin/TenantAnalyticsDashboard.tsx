import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { httpClient } from '@/shared/lib/http_client'

interface DashboardStats {
  total_sales: string
  orders_count: number
  average_ticket: string
  low_stock_items: number
  average_prep_time_minutes: number
}

interface SalesReport {
  period: string
  total_sales: string
  total_orders: number
  average_ticket: string
  by_category: Record<string, string>
}

interface KitchenPerformance {
  period: string
  average_prep_time_minutes: number
  items_prepared: number
  completion_rate: number
}

interface TenantAnalyticsDashboardProps {
  tenantId: number
  tenantName: string
  onBack: () => void
}

export default function TenantAnalyticsDashboard({
  tenantId,
  tenantName,
  onBack,
}: TenantAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [kitchenStats, setKitchenStats] = useState<KitchenPerformance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const headers = { 'X-Tenant-ID': String(tenantId) }
      const [statsRes, salesRes, kitchenRes] = await Promise.all([
        httpClient.get<DashboardStats>('/v1/analytics/dashboard', {
          params: { period: period },
          headers,
        }),
        httpClient.get<SalesReport>('/v1/analytics/sales', {
          params: { period: period },
          headers,
        }),
        httpClient.get<KitchenPerformance>('/v1/analytics/kitchen', {
          params: { period: period },
          headers,
        }),
      ])

      setStats(statsRes.data)
      setSalesReport(salesRes.data)
      setKitchenStats(kitchenRes.data)
    } catch (_err) {
      setError('Erro ao carregar dados analíticos da franquia. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }, [period, tenantId])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Transform category data for Recharts Bar Chart
  const categoryChartData = Object.entries(salesReport?.by_category || {}).map(
    ([category, val]) => ({
      name: category,
      valor: Number(val),
    }),
  )

  // Seed mock trend data based on period for a premium Line/Area chart visual
  const trendChartData = (() => {
    if (period === 'day') {
      return [
        { time: '11:00', total: 120 },
        { time: '12:00', total: 450 },
        { time: '13:00', total: 600 },
        { time: '14:00', total: 200 },
        { time: '18:00', total: 300 },
        { time: '19:00', total: 800 },
        { time: '20:00', total: 950 },
        { time: '21:00', total: 500 },
      ]
    }
    if (period === 'week') {
      return [
        { time: 'Seg', total: 1200 },
        { time: 'Ter', total: 1800 },
        { time: 'Qua', total: 1500 },
        { time: 'Qui', total: 2200 },
        { time: 'Sex', total: 3500 },
        { time: 'Sáb', total: 4200 },
        { time: 'Dom', total: 3805 },
      ]
    }
    return [
      { time: 'Semana 1', total: 12000 },
      { time: 'Semana 2', total: 15400 },
      { time: 'Semana 3', total: 18900 },
      { time: 'Semana 4', total: 22100 },
    ]
  })()

  const chartColors = ['#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-900/60 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white border border-gray-800 transition-all"
            title="Voltar para Franquias"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide uppercase">
              Analytics — {tenantName}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Visão do gerente para a franquia de ID #{tenantId}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-950/40 border border-gray-900 rounded-xl p-1">
            {[
              { id: 'day', label: 'Hoje' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mês' },
            ].map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPeriod(p.id as 'day' | 'week' | 'month')}
                className={`rounded-lg px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                  period === p.id
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="rounded-xl bg-gray-900/30 border border-gray-850 p-2.5 text-gray-400 hover:text-white transition-all duration-300"
            title="Atualizar Indicadores"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="flex py-24 justify-center items-center gap-2.5">
          <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
          <span className="text-xs text-gray-400 font-medium">
            Calculando estatísticas analíticas...
          </span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-955 bg-red-950/20 p-6 text-center text-red-400 font-bold text-xs">
          {error}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-900/60 bg-gray-950/15 p-5 space-y-2 backdrop-blur-md glass-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500">
                  Faturamento
                </span>
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-455">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                R$ {Number(stats?.total_sales).toFixed(2)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-900/60 bg-gray-950/15 p-5 space-y-2 backdrop-blur-md glass-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500">
                  Ticket Médio
                </span>
                <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-455">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                R$ {Number(stats?.average_ticket).toFixed(2)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-900/60 bg-gray-950/15 p-5 space-y-2 backdrop-blur-md glass-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500">
                  Total Pedidos
                </span>
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-455">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {stats?.orders_count}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-900/60 bg-gray-950/15 p-5 space-y-2 backdrop-blur-md glass-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500">
                  Preparo Médio
                </span>
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-455">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
                {stats?.average_prep_time_minutes.toFixed(1)}
                <span className="text-xs text-gray-500 font-medium">min</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Chart 1: Revenue trend */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-900/60 bg-gray-950/15 p-5 flex flex-col backdrop-blur-md glass-card">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Desempenho de Vendas
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendChartData}
                    margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
                    <XAxis dataKey="time" stroke="#4b5563" fontSize={9} tickLine={false} />
                    <YAxis stroke="#4b5563" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#1f2937',
                        color: '#fff',
                        borderRadius: '12px',
                      }}
                      formatter={(value: unknown) => [
                        `R$ ${Number(typeof value === 'number' || typeof value === 'string' ? value : 0).toFixed(2)}`,
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

            {/* Chart 2: Category sales */}
            <div className="rounded-2xl border border-gray-900/60 bg-gray-950/15 p-5 flex flex-col backdrop-blur-md glass-card">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Vendas por Categoria
              </h3>
              <div className="h-64 w-full">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
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
                          `R$ ${Number(typeof value === 'number' || typeof value === 'string' ? value : 0).toFixed(2)}`,
                          'Total',
                        ]}
                      />
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={30}>
                        {categoryChartData.map((_entry, index) => (
                          <Cell key={_entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-500 font-medium">
                    Nenhuma venda registrada no período.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kitchen stats section */}
          <div className="rounded-2xl border border-gray-900/60 bg-gray-950/15 p-5 flex flex-col backdrop-blur-md glass-card">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Desempenho de Preparo da Cozinha
            </h3>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-850 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-gray-500">
                    Itens Preparados
                  </span>
                  <div className="text-xl font-black text-white mt-1">
                    {kitchenStats?.items_prepared || 0}
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-500/70" />
              </div>

              <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-850 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-gray-500">
                    Taxa de Conclusão
                  </span>
                  <div className="text-xl font-black text-white mt-1">
                    {((kitchenStats?.completion_rate || 0) * 100).toFixed(0)}%
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 text-brand-500/70" />
              </div>

              <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-850 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-gray-500">
                    Itens com Alerta de Atraso
                  </span>
                  <div className="text-xl font-black text-red-400 mt-1">
                    {stats?.low_stock_items || 0}
                  </div>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500/70" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
