import {
  AlertCircle,
  ArrowUpCircle,
  CheckCircle2,
  DollarSign,
  Package,
  XCircle,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

interface RequestTicket {
  id: number
  tenantName: string
  type: 'UPGRADE' | 'SUPORTE' | 'PAGAMENTO' | 'ABASTECIMENTO'
  description: string
  date: string
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'RESOLVIDO'
}

const INITIAL_TICKETS: RequestTicket[] = [
  {
    id: 1,
    tenantName: 'Barraca do Sol',
    type: 'UPGRADE',
    description: 'Solicitação de upgrade de plano: BASIC para PRO para habilitar múltiplas KDS.',
    date: 'Hoje, 10:24',
    status: 'PENDENTE',
  },
  {
    id: 2,
    tenantName: 'Quiosque Copacabana',
    type: 'SUPORTE',
    description: 'Dificuldade na integração de impressoras térmicas Bluetooth nas comandas.',
    date: 'Ontem, 16:45',
    status: 'PENDENTE',
  },
  {
    id: 3,
    tenantName: 'Lanchonete Express',
    type: 'PAGAMENTO',
    description: 'Ajuste cadastral de dados na nota de serviço consolidada do mês.',
    date: '2 dias atrás',
    status: 'PENDENTE',
  },
  {
    id: 4,
    tenantName: 'Restaurante Central',
    type: 'UPGRADE',
    description: 'Upgrade automático solicitado para plano PLUS (Faturamento Ilimitado).',
    date: '3 dias atrás',
    status: 'APROVADO',
  },
  {
    id: 5,
    tenantName: 'Beach Point Barra',
    type: 'SUPORTE',
    description: 'Suporte urgente: Erro de sincronização no painel financeiro histórico.',
    date: '4 dias atrás',
    status: 'RESOLVIDO',
  },
  {
    id: 6,
    tenantName: 'Pastelaria da Avenida',
    type: 'ABASTECIMENTO',
    description:
      'Solicitação de abastecimento: Reposição urgente de 50kg de Farinha de Trigo e 20L de Óleo de Soja.',
    date: 'Hoje, 08:15',
    status: 'PENDENTE',
  },
  {
    id: 7,
    tenantName: 'Pizzaria Bella Italia',
    type: 'ABASTECIMENTO',
    description:
      'Solicitação de abastecimento: Pedido semanal de insumos (molho de tomate, queijo mussarela e pepperoni).',
    date: 'Ontem, 14:30',
    status: 'RESOLVIDO',
  },
]

const TYPE_BADGE_STYLES: Record<RequestTicket['type'], string> = {
  UPGRADE: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  SUPORTE: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  PAGAMENTO: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  ABASTECIMENTO: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
}

const renderTypeIcon = (type: RequestTicket['type']) => {
  switch (type) {
    case 'UPGRADE':
      return <ArrowUpCircle className="h-3 w-3" />
    case 'SUPORTE':
      return <AlertCircle className="h-3 w-3" />
    case 'PAGAMENTO':
      return <DollarSign className="h-3 w-3" />
    case 'ABASTECIMENTO':
      return <Package className="h-3 w-3" />
  }
}

const renderStatusBadge = (status: RequestTicket['status']) => {
  const isApprovedOrResolved = status === 'APROVADO' || status === 'RESOLVIDO'
  const style = isApprovedOrResolved
    ? 'bg-green-500/10 border-green-500/20 text-green-400'
    : 'bg-red-500/10 border-red-500/20 text-red-400'

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold border ${style}`}
    >
      {isApprovedOrResolved ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {status}
    </span>
  )
}

const RequestTicketCard: React.FC<{
  ticket: RequestTicket
  onUpdateStatus: (id: number, status: 'APROVADO' | 'REJEITADO' | 'RESOLVIDO') => void
}> = ({ ticket: t, onUpdateStatus }) => {
  return (
    <div className="bg-gray-950/40 border border-gray-900/60 rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg hover:border-gray-800 transition-all animate-fade-in">
      <div className="space-y-2 max-w-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-white text-xs">{t.tenantName}</span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-500 font-bold">{t.date}</span>
          <span className="text-gray-600">•</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-bold ${TYPE_BADGE_STYLES[t.type]}`}
          >
            {renderTypeIcon(t.type)}
            {t.type}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-300 leading-relaxed">{t.description}</p>
      </div>

      {/* Status badge & Actions */}
      <div className="flex items-center gap-3 self-end md:self-center">
        {t.status === 'PENDENTE' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateStatus(t.id, t.type === 'UPGRADE' ? 'APROVADO' : 'RESOLVIDO')}
              className="flex items-center justify-center gap-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/40 text-green-400 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Marcar como Resolvido
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(t.id, 'REJEITADO')}
              className="flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/40 text-red-400 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all"
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejeitar
            </button>
          </div>
        ) : (
          renderStatusBadge(t.status)
        )}
      </div>
    </div>
  )
}

type FilterType = 'ALL' | 'SUPORTE' | 'PAGAMENTO' | 'ABASTECIMENTO' | 'UPGRADE'
type FilterStatus = 'PENDING' | 'RESOLVED' | 'ALL'

export const AdminRequestsPage: React.FC = () => {
  const [tickets, setTickets] = useState<RequestTicket[]>(INITIAL_TICKETS)

  // Filters State
  const [selectedType, setSelectedType] = useState<FilterType>('ALL')
  const [showStatus, setShowStatus] = useState<FilterStatus>('PENDING')

  const handleUpdateStatus = (id: number, newStatus: 'APROVADO' | 'REJEITADO' | 'RESOLVIDO') => {
    setTickets(tickets.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))
  }

  const filteredTickets = tickets.filter((t) => {
    // 1. Filter by Type
    if (selectedType !== 'ALL' && t.type !== selectedType) {
      return false
    }

    // 2. Filter by Resolution Status (Unresolved = PENDENTE, Resolved = APROVADO, REJEITADO, RESOLVIDO)
    const isUnresolved = t.status === 'PENDENTE'
    if (showStatus === 'PENDING') {
      return isUnresolved
    }
    if (showStatus === 'RESOLVED') {
      return !isUnresolved
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Solicitações de Franquias</h1>
        <p className="text-xs font-medium text-gray-400 mt-1">
          Gerencie solicitações de licenças, upgrades, suporte técnico e abastecimento de insumos
          enviadas pelas unidades.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gray-950/20 border border-gray-900/60 rounded-2xl backdrop-blur-md">
        {/* Type Filter Tabs */}
        <div className="flex bg-gray-950/80 border border-gray-900 rounded-xl p-1 overflow-x-auto gap-1">
          {[
            { id: 'ALL' as FilterType, label: 'Todos os Tipos' },
            { id: 'SUPORTE' as FilterType, label: 'Suporte' },
            { id: 'PAGAMENTO' as FilterType, label: 'Pagamento' },
            { id: 'ABASTECIMENTO' as FilterType, label: 'Abastecimento' },
            { id: 'UPGRADE' as FilterType, label: 'Upgrade' },
          ].map((typeItem) => (
            <button
              type="button"
              key={typeItem.id}
              onClick={() => setSelectedType(typeItem.id)}
              className={`rounded-lg px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                selectedType === typeItem.id
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-gray-400 hover:text-gray-250'
              }`}
            >
              {typeItem.label}
            </button>
          ))}
        </div>

        {/* Status Filter Toggle */}
        <div className="flex bg-gray-950/80 border border-gray-900 rounded-xl p-1 gap-1">
          {[
            { id: 'PENDING' as FilterStatus, label: 'Pendentes' },
            { id: 'RESOLVED' as FilterStatus, label: 'Resolvidos' },
            { id: 'ALL' as FilterStatus, label: 'Todos' },
          ].map((statusItem) => (
            <button
              type="button"
              key={statusItem.id}
              onClick={() => setShowStatus(statusItem.id)}
              className={`rounded-lg px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                showStatus === statusItem.id
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-gray-400 hover:text-gray-250'
              }`}
            >
              {statusItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((t) => (
            <RequestTicketCard key={t.id} ticket={t} onUpdateStatus={handleUpdateStatus} />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-950/20 border border-gray-900/60 rounded-2xl text-xs text-gray-500 font-medium">
            Nenhuma solicitação encontrada para o filtro selecionado.
          </div>
        )}
      </div>
    </div>
  )
}
