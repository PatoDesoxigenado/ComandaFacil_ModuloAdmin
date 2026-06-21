import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Building, Download, Edit2, Layers, Plus, Trash2 } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import {
  createTenant,
  deleteTenant,
  exportAnalytics,
  getTenants,
  type Tenant,
  updateTenant,
} from '@/features/admin/adminService'
import TenantAnalyticsDashboard from '@/features/admin/TenantAnalyticsDashboard'

export const AdminTenantsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { data: tenants, isLoading } = useQuery({ queryKey: ['tenants'], queryFn: getTenants })
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantPlan, setNewTenantPlan] = useState<'BASIC' | 'PRO' | 'PLUS'>('BASIC')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Edit Tenant State
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [editName, setEditName] = useState('')
  const [editPlan, setEditPlan] = useState<'BASIC' | 'PRO' | 'PLUS'>('BASIC')
  const [editIsActive, setEditIsActive] = useState(true)

  // Analytics View State
  const [selectedTenantForAnalytics, setSelectedTenantForAnalytics] = useState<Tenant | null>(null)

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setNewTenantName('')
      setShowCreateModal(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { name?: string; plan_type?: 'BASIC' | 'PRO' | 'PLUS'; is_active?: boolean }
    }) => updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setEditingTenant(null)
    },
  })

  const handleExport = async () => {
    try {
      const response = await exportAnalytics()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'analytics_global.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert(`Erro ao exportar analytics: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTenantName.trim()) return
    createMutation.mutate({ name: newTenantName, plan_type: newTenantPlan })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTenant) return
    updateMutation.mutate({
      id: editingTenant.id,
      data: {
        name: editName,
        plan_type: editPlan,
        is_active: editIsActive,
      },
    })
  }

  if (selectedTenantForAnalytics) {
    return (
      <TenantAnalyticsDashboard
        tenantId={selectedTenantForAnalytics.id}
        tenantName={selectedTenantForAnalytics.name}
        onBack={() => setSelectedTenantForAnalytics(null)}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Gerenciamento de Franquias
          </h1>
          <p className="text-xs font-medium text-gray-400 mt-1">
            Cadastre novas unidades, alterne planos e gerencie o status das franquias no
            ecossistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <Download className="h-4 w-4 text-brand-400" />
            Exportar CSV Geral
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova Franquia
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-gray-950/40 border border-gray-900/60 rounded-2xl backdrop-blur-md overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-900/60 bg-gray-900/10 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nome da Franquia</th>
                <th className="px-6 py-4">Plano Ativo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/40 text-xs font-medium text-gray-300">
              {Array.isArray(tenants) && tenants.length > 0 ? (
                tenants.map((t: Tenant) => (
                  <tr key={t.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-4 font-bold text-brand-400">#{t.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-gray-500" />
                        <span className="font-bold text-white">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                          t.plan_type === 'PLUS'
                            ? 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                            : t.plan_type === 'PRO'
                              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                              : 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        {t.plan_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.is_active
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                      >
                        {t.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTenantForAnalytics(t)}
                        className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 border border-transparent hover:border-pink-500/20 p-2 rounded-xl transition-all mr-2"
                        title="Ver Dashboard de Analytics"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTenant(t)
                          setEditName(t.name)
                          setEditPlan(t.plan_type)
                          setEditIsActive(t.is_active)
                        }}
                        className="text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 border border-transparent hover:border-brand-500/20 p-2 rounded-xl transition-all mr-2"
                        title="Editar Franquia"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja excluir a franquia "${t.name}"?`)) {
                            deleteMutation.mutate(t.id)
                          }
                        }}
                        disabled={t.id === 1}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 p-2 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title={
                          t.id === 1
                            ? 'Franquia principal não pode ser excluída'
                            : 'Excluir Franquia'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma franquia cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-950 border border-gray-900 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-black text-white">Cadastrar Nova Franquia</h3>
              <p className="text-xs text-gray-400 mt-1">
                Insira os dados iniciais do novo locatário.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="newTenantName"
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  Nome da Unidade
                </label>
                <input
                  id="newTenantName"
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Ex: Barraca de Copacabana"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="newTenantPlan"
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  Plano de Assinatura
                </label>
                <select
                  id="newTenantPlan"
                  value={newTenantPlan}
                  onChange={(e) => setNewTenantPlan(e.target.value as 'BASIC' | 'PRO' | 'PLUS')}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500 transition-all"
                >
                  <option value="BASIC">BASIC (Rede Base)</option>
                  <option value="PRO">PRO (Multi-KDS)</option>
                  <option value="PLUS">PLUS (Faturamento Ilimitado)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-900 hover:bg-gray-850 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-brand-500 hover:bg-brand-600 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-950 border border-gray-900 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-black text-white">Editar Franquia</h3>
              <p className="text-xs text-gray-400 mt-1">
                Altere as informações da franquia de ID #{editingTenant.id}.
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="editTenantName"
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  Nome da Unidade
                </label>
                <input
                  id="editTenantName"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Barraca de Copacabana"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="editTenantPlan"
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  Plano de Assinatura
                </label>
                <select
                  id="editTenantPlan"
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as 'BASIC' | 'PRO' | 'PLUS')}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500 transition-all"
                >
                  <option value="BASIC">BASIC (Rede Base)</option>
                  <option value="PRO">PRO (Multi-KDS)</option>
                  <option value="PLUS">PLUS (Faturamento Ilimitado)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="editTenantStatus"
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  Status da Franquia
                </label>
                <select
                  id="editTenantStatus"
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500 transition-all"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="bg-gray-900 hover:bg-gray-850 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-brand-500 hover:bg-brand-600 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
