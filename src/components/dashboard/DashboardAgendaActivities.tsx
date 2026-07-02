import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Clock, 
  Activity, 
  ArrowRight, 
  User, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Filter, 
  Package, 
  ShoppingCart, 
  Layers, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Order, FinancialTransaction, AgendaActivity, AuditLog } from '../../types/erp';
import { useDb } from '../../context/DbContext';
import { toast } from '../Toast';

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  type: 'delivery' | 'meeting' | 'purchase' | 'production' | 'manual';
}

interface DashboardAgendaActivitiesProps {
  onViewChange: (view: string) => void;
  // Kept for backward compatibility with parent props
  activeOrders?: Order[];
  transactions?: FinancialTransaction[];
  agendaItems?: any[];
  setAgendaItems?: any;
}

export const DashboardAgendaActivities: React.FC<DashboardAgendaActivitiesProps> = ({
  onViewChange
}) => {
  // Consume unified real-time data from global DbContext
  const { 
    agendaActivities, 
    auditLogs, 
    addAgendaActivity, 
    updateAgendaActivity, 
    deleteAgendaActivity 
  } = useDb();

  // New activity form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('14:00');
  const [newEventType, setNewEventType] = useState<'delivery' | 'meeting' | 'purchase' | 'production' | 'manual'>('manual');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);

  // Tab/Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Filter activities based on selected tab and sort chronologically by time
  const filteredActivities = useMemo(() => {
    let list = [...agendaActivities];

    // Filter by tab
    if (statusFilter === 'pending') {
      list = list.filter(a => a.status === 'Pendente');
    } else if (statusFilter === 'completed') {
      list = list.filter(a => a.status === 'Concluída');
    }

    // Sort chronologically by date first, then by time
    return list.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [agendaActivities, statusFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: agendaActivities.length,
      pending: agendaActivities.filter(a => a.status === 'Pendente').length,
      completed: agendaActivities.filter(a => a.status === 'Concluída').length
    };
  }, [agendaActivities]);

  // Handle manual item addition
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error("Erro ao agendar", "O título do compromisso não pode estar vazio.");
      return;
    }

    addAgendaActivity({
      time: newEventTime,
      date: newEventDate,
      title: newEventTitle.trim(),
      type: newEventType,
      status: 'Pendente'
    });

    setNewEventTitle('');
    toast.success("Atividade Agendada", "Novo compromisso adicionado com sucesso.");
  };

  // Toggle completion status
  const handleToggleStatus = (activity: AgendaActivity) => {
    const newStatus = activity.status === 'Pendente' ? 'Concluída' : 'Pendente';
    updateAgendaActivity(activity.id, { status: newStatus });
    
    if (newStatus === 'Concluída') {
      toast.success("Atividade Concluída", `"${activity.title}" marcada como concluída!`);
    } else {
      toast.info("Atividade Reaberta", `"${activity.title}" marcada como pendente.`);
    }
  };

  // Handle deletion of activities
  const handleDeleteActivity = (id: string, title: string) => {
    deleteAgendaActivity(id);
    toast.success("Atividade Excluída", `Compromisso "${title}" removido com sucesso.`);
  };

  // Helper to format ISO audit log timestamps into user-friendly time
  const formatAuditTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      if (isToday) {
        return `Hoje às ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `${dateStr} às ${timeStr}`;
      }
    } catch (e) {
      return "Recentemente";
    }
  };

  // Helper to get matching icon for audit log modules
  const getAuditIcon = (module: string) => {
    switch (module) {
      case 'clients':
        return <User size={13} className="text-blue-600" />;
      case 'orders':
        return <ShoppingCart size={13} className="text-emerald-600" />;
      case 'quotes':
        return <FileText size={13} className="text-amber-600" />;
      case 'inventory':
        return <Package size={13} className="text-rose-600" />;
      case 'production':
        return <Layers size={13} className="text-indigo-600" />;
      case 'agenda':
        return <Calendar size={13} className="text-amber-500" />;
      default:
        return <Activity size={13} className="text-slate-600" />;
    }
  };

  // Helper to get audit badge color classes
  const getAuditBadgeColors = (module: string) => {
    switch (module) {
      case 'clients': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'orders': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'quotes': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'inventory': return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'production': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'agenda': return 'bg-amber-50 text-amber-700 border border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  const getModuleLabel = (module: string) => {
    switch (module) {
      case 'clients': return 'Clientes';
      case 'orders': return 'Pedidos';
      case 'quotes': return 'Orçamentos';
      case 'inventory': return 'Estoque';
      case 'production': return 'Produção';
      case 'agenda': return 'Agenda';
      default: return 'Sistema';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard_agenda_activities_section">
      
      {/* 1. WIDGET: AGENDA DO DIA */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between" id="agenda_diaria_widget">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-amber-600 animate-pulse" />
              <div>
                <h3 className="font-serif font-semibold text-base text-slate-900">Agenda Diária</h3>
                <p className="text-[11px] text-slate-500">Ferramenta integrada de controle de compromissos e tarefas</p>
              </div>
            </div>

            {/* Simple Tab Filters */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs" id="agenda_tabs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === 'all' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todas ({counts.all})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === 'pending' 
                    ? 'bg-white text-amber-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pendentes ({counts.pending})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  statusFilter === 'completed' 
                    ? 'bg-white text-emerald-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Concluídas ({counts.completed})
              </button>
            </div>
          </div>

          {/* Quick event form */}
          <form onSubmit={handleAddEvent} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl" id="agenda_quick_form">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Descreva o compromisso..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="w-full px-2 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="w-full px-2 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value as any)}
                className="w-full px-2 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
              >
                <option value="manual">Geral</option>
                <option value="meeting">Reunião</option>
                <option value="delivery">Entrega</option>
                <option value="production">Produção</option>
                <option value="purchase">Compra</option>
              </select>
            </div>
            <div className="sm:col-span-1 flex items-center justify-center">
              <button
                type="submit"
                className="w-full p-2 bg-slate-900 hover:bg-amber-600 text-white rounded-xl cursor-pointer flex items-center justify-center transition-all shadow-xs"
                title="Agendar atividade"
              >
                <Plus size={14} />
              </button>
            </div>
          </form>

          {/* Activities list */}
          <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1" id="agenda_activities_list">
            {filteredActivities.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                  item.status === 'Concluída' 
                    ? 'bg-emerald-50/20 border-emerald-100/50 hover:bg-emerald-50/30' 
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
                }`}
              >
                {/* Complete checkbox trigger */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item)}
                  className="mt-0.5 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer shrink-0"
                  title={item.status === 'Pendente' ? "Marcar como Concluída" : "Reabrir Atividade"}
                >
                  {item.status === 'Concluída' ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <Circle size={16} className="text-slate-300 hover:text-amber-600" />
                  )}
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 flex items-center gap-1 shrink-0">
                      <Clock size={10} /> {item.time}
                    </span>
                    {item.date !== new Date().toISOString().split('T')[0] && (
                      <span className="text-[9px] text-slate-400 font-medium">
                        • {new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs leading-tight font-semibold ${
                    item.status === 'Concluída' ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}>
                    {item.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      item.type === 'delivery' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                      item.type === 'meeting' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                      item.type === 'purchase' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                      item.type === 'production' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                      'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {item.type === 'delivery' ? 'Entrega' : 
                       item.type === 'meeting' ? 'Reunião' : 
                       item.type === 'purchase' ? 'Compra' : 
                       item.type === 'production' ? 'Produção' : 'Geral'}
                    </span>

                    {/* Status Badge */}
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.status === 'Concluída'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>

                    {/* Completion Date-Time */}
                    {item.status === 'Concluída' && item.completedAt && (
                      <span className="text-[9px] text-slate-400 font-medium italic">
                        concluído em {item.completedAt}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeleteActivity(item.id, item.title)}
                  className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-slate-50 shrink-0 cursor-pointer"
                  title="Excluir Atividade"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {filteredActivities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <AlertCircle size={24} className="text-slate-300" />
                <p className="text-[11px] text-slate-400 italic">
                  {statusFilter === 'all' ? 'Nenhum compromisso agendado.' : 
                   statusFilter === 'pending' ? 'Nenhum compromisso pendente!' : 
                   'Nenhum compromisso concluído ainda.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. WIDGET: ÚLTIMAS ATIVIDADES / LOG DE AUDITORIA */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4" id="historico_auditoria_widget">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-amber-600" />
            <div>
              <h3 className="font-serif font-semibold text-base text-slate-900">Histórico de Atividades</h3>
              <p className="text-[11px] text-slate-500">Log de auditoria em tempo real de rastreabilidade das operações</p>
            </div>
          </div>
        </div>

        <div className="relative border-l border-slate-200 ml-3.5 space-y-4 max-h-[310px] overflow-y-auto pr-1" id="audit_timeline_list">
          {auditLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="relative pl-6 group">
              {/* Bullet indicator */}
              <span className="absolute -left-[5.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-amber-500 border-2 border-white transition-colors flex items-center justify-center shadow-xs" />

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[9.5px] font-mono font-medium text-slate-400">{formatAuditTime(log.timestamp)}</span>
                  <span className="text-[9.5px] text-slate-400">•</span>
                  <span className="text-[9.5px] font-semibold text-slate-500">{log.user}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${getAuditBadgeColors(log.module)}`}>
                    {getModuleLabel(log.module)}
                  </span>
                </div>
                
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {log.action}
                </p>

                {log.module !== 'system' && log.module !== 'agenda' && (
                  <button
                    onClick={() => onViewChange(log.module === 'quotes' ? 'quotes' : log.module === 'orders' ? 'orders' : log.module === 'inventory' ? 'inventory' : log.module === 'production' ? 'production' : 'clients')}
                    className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-slate-400 hover:text-amber-700 cursor-pointer pt-0.5 transition-colors"
                  >
                    Rastrear Módulo {getAuditIcon(log.module)} <ArrowRight size={8} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <p className="text-center text-[11px] text-slate-400 italic py-12">Sem atividades registradas no log.</p>
          )}
        </div>
      </div>

    </div>
  );
};
