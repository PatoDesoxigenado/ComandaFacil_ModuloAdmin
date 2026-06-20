import { useQuery } from '@tanstack/react-query'
import { Activity, Award, Building, DollarSign, Layers, TrendingUp } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import {
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
  getGlobalAnalytics,
  getTenants,
  type Tenant,
  type TenantAnalyticsItem,
} from './adminService'

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6']

export const AdminDashboard: React.FC = () => {
  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  })

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: getGlobalAnalytics,
  })

  // Metric selector for Top 5
  const [topMetric, setTopMetric] = useState<
    'month_revenue' | 'year_revenue' | 'sales_count' | 'ticket_average' | 'employee_count'
  >('month_revenue')

  const totalRevenue = Array.isArray(analytics?.tenants)
    ? analytics.tenants.reduce((sum: number, t: TenantAnalyticsItem) => sum + t.total_revenue, 0)
    : 0

  const overallAverageTicket = analytics?.overall_average_ticket || 0

  const activeTenantsCount = Array.isArray(tenants)
    ? tenants.filter((t: Tenant) => t.is_active).length
    : 0

  // Chart 1: Revenue by Franchise Name (using YTD or all-time)
  const revenueChartData = Array.isArray(analytics?.tenants)
    ? analytics.tenants.map((t: TenantAnalyticsItem) => ({
        name: t.name,
        receita: t.total_revenue,
      }))
    : []

  // Chart 2: Plan distribution
  const plansDistribution = Array.isArray(tenants)
    ? tenants.reduce((acc: Record<string, number>, t: Tenant) => {
        acc[t.plan_type] = (acc[t.plan_type] || 0) + 1
        return acc
      }, {})
    : {}

  const planChartData = Object.entries(plansDistribution).map(([name, value]) => ({
    name: `Plano ${name}`,
    value,
  }))

  const sortedTopTenants = Array.isArray(analytics?.tenants)
    ? [...analytics.tenants].sort((a, b) => b[topMetric] - a[topMetric]).slice(0, 5)
    : []

  const formatMetricValue = (val: number, metric: typeof topMetric) => {
    if (metric === 'month_revenue' || metric === 'year_revenue' || metric === 'ticket_average') {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    if (metric === 'sales_count') {
      return `${val} ${val === 1 ? 'venda' : 'vendas'}`
    }
    return `${val} ${val === 1 ? 'funcionário' : 'funcionários'}`
  }

  if (loadingTenants || loadingAnalytics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Painel Geral</h1>
        <p className="text-xs font-medium text-gray-400 mt-1">
          Visão consolidada e métricas de desempenho de todas as franquias da rede.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Receita Geral */}
        <div className="p-4 bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md flex items-center justify-between shadow-lg shadow-brand-500/2">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Receita Geral
            </h3>
            <p className="text-xl font-black text-white">
              R${' '}
              {totalRevenue.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center shadow-inner">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Ticket Médio Consolidado */}
        <div className="p-4 bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md flex items-center justify-between shadow-lg shadow-brand-500/2">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Ticket Médio Consolidado
            </h3>
            <p className="text-xl font-black text-white">
              R${' '}
              {overallAverageTicket.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Total Franquias */}
        <div className="p-4 bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md flex items-center justify-between shadow-lg shadow-brand-500/2">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total Franquias
            </h3>
            <p className="text-xl font-black text-white">{tenants?.length || 0}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-inner">
            <Building className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Franquias Ativas */}
        <div className="p-4 bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md flex items-center justify-between shadow-lg shadow-brand-500/2">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Franquias Ativas
            </h3>
            <p className="text-xl font-black text-white">{activeTenantsCount}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner">
            <Activity className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Plano Predominante */}
        <div className="p-4 bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md flex items-center justify-between shadow-lg shadow-brand-500/2">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Plano Predominante
            </h3>
            <p className="text-xl font-black text-white">
              {planChartData.length > 0
                ? planChartData
                    .reduce((prev, current) => (prev.value > current.value ? prev : current))
                    .name.replace('Plano ', '')
                : 'N/A'}
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shadow-inner">
            <Award className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Top 5 Rankings - Metric Filter */}
      <div className="bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md overflow-hidden shadow-lg p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Top 5 Franquias por Desempenho
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Classifique e filtre as unidades com melhores resultados de acordo com o indicador.
            </p>
          </div>

          <div className="flex bg-gray-950/80 border border-gray-900 rounded-xl p-1 overflow-x-auto gap-1">
            {[
              { id: 'month_revenue', label: 'Receita (Mês)' },
              { id: 'year_revenue', label: 'Receita (Ano)' },
              { id: 'sales_count', label: 'Nº Vendas' },
              { id: 'ticket_average', label: 'Ticket Médio' },
              { id: 'employee_count', label: 'Funcionários' },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setTopMetric(m.id as typeof topMetric)}
                className={`rounded-lg px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider transition-all duration-305 ${
                  topMetric === m.id
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top 5 Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-900/60 bg-gray-900/10 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3">Posição</th>
                <th className="px-6 py-3">Franquia</th>
                <th className="px-6 py-3">Plano</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/40 text-xs font-medium text-gray-300">
              {sortedTopTenants.length > 0 ? (
                sortedTopTenants.map((t: TenantAnalyticsItem, index: number) => (
                  <tr key={t.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-3.5 font-bold text-brand-400">{index + 1}º</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-gray-500" />
                        <span className="font-bold text-white">{t.name}</span>
                        <span className="text-[10px] text-gray-500">(ID #{t.id})</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-bold ${
                          t.plan_type === 'PLUS'
                            ? 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                            : t.plan_type === 'PRO'
                              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                              : 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                        }`}
                      >
                        <Layers className="h-2.5 w-2.5" />
                        {t.plan_type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          t.is_active
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                      >
                        {t.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-black text-white">
                      {formatMetricValue(t[topMetric], topMetric)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhum dado analítico registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Ranking Chart */}
        <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md flex flex-col shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4">
            Ranking de Receita Geral por Franquia
          </h3>
          <div className="h-72 w-full">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#1f2937',
                      color: '#fff',
                      borderRadius: '12px',
                    }}
                    formatter={(value: unknown) => [
                      `R$ ${Number(typeof value === 'number' || typeof value === 'string' ? value : 0).toFixed(2)}`,
                      'Receita',
                    ]}
                  />
                  <Bar
                    dataKey="receita"
                    fill="url(#brandGradient)"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  >
                    <defs>
                      <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-gray-500">
                Nenhum dado de receita disponível.
              </div>
            )}
          </div>
        </div>

        {/* Subscription Plan Distribution Chart */}
        <div className="p-5 bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md flex flex-col shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4">
            Distribuição de Planos de Assinatura
          </h3>
          <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center gap-4">
            {planChartData.length > 0 ? (
              <>
                <div className="h-48 w-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {planChartData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#09090b',
                          borderColor: '#1f2937',
                          color: '#fff',
                          borderRadius: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-2">
                  {planChartData.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-900/20 border border-gray-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-semibold text-gray-300">{entry.name}</span>
                      </div>
                      <span className="font-bold text-white">
                        {entry.value} {entry.value === 1 ? 'franquia' : 'franquias'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-gray-500">
                Nenhuma franquia cadastrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
