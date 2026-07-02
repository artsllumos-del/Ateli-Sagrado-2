import React from 'react';
import { Hammer, Clock, Users, Play, Pause, Check, AlertTriangle } from 'lucide-react';
import { ProductionTask } from '../../types/erp';
import { useDb } from '../../context/DbContext';
import { toast } from '../Toast';

interface DashboardProductionProps {
  onViewChange: (view: string) => void;
  productionTasks: ProductionTask[];
  pausedTaskIds: string[];
  setPausedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const DashboardProduction: React.FC<DashboardProductionProps> = ({
  onViewChange,
  productionTasks,
  pausedTaskIds,
  setPausedTaskIds,
}) => {
  const { updateProductionTask } = useDb();
  const activeTasks = productionTasks.filter(t => t.status !== 'done');

  const handleStart = (id: string) => {
    updateProductionTask(id, { status: 'producing', startDate: new Date().toISOString().split('T')[0] });
    // Remove from paused if it was
    setPausedTaskIds(prev => prev.filter(pId => pId !== id));
    toast.success("Produção Iniciada", "A peça está oficialmente em processo de montagem.");
  };

  const handleTogglePause = (id: string, name: string) => {
    const isPaused = pausedTaskIds.includes(id);
    if (isPaused) {
      setPausedTaskIds(prev => prev.filter(pId => pId !== id));
      toast.info("Produção Retomada", `A montagem de "${name}" foi reiniciada.`);
    } else {
      setPausedTaskIds(prev => [...prev, id]);
      toast.warning("Produção Pausada", `A montagem de "${name}" foi interrompida.`);
    }
  };

  const handleFinishing = (id: string) => {
    updateProductionTask(id, { status: 'finishing' });
    setPausedTaskIds(prev => prev.filter(pId => pId !== id));
    toast.success("Fase de Acabamento", "A joia foi encaminhada para banho e embalagem.");
  };

  const handleComplete = (id: string) => {
    updateProductionTask(id, { status: 'done', endDate: new Date().toISOString().split('T')[0], timeSpentMinutes: 45 });
    setPausedTaskIds(prev => prev.filter(pId => pId !== id));
    toast.success("Joia Concluída", "Montagem e polimento finalizados com sucesso.");
  };

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hammer size={18} className="text-amber-600" />
          <div>
            <h3 className="font-serif font-semibold text-base text-slate-900">Chão de Fábrica Operacional</h3>
            <p className="text-[11px] text-slate-500">Acompanhamento e controle direto da fila de produção</p>
          </div>
        </div>
        <button
          onClick={() => onViewChange('production')}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg cursor-pointer"
        >
          Ver Chão Completo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Columns matching stages */}
        {['todo', 'producing', 'finishing'].map((status) => {
          const tasksInStatus = activeTasks.filter(t => t.status === status);
          const title = status === 'todo' ? 'Aguardando' : status === 'producing' ? 'Em Montagem' : 'Acabamento';
          const titleColor = status === 'todo' ? 'text-slate-400 bg-slate-50 border-slate-200/60' : status === 'producing' ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-purple-700 bg-purple-50 border-purple-150';

          return (
            <div key={status} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl flex flex-col gap-3 min-h-[220px]">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${titleColor}`}>
                  {title} ({tasksInStatus.length})
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[280px] flex-1">
                {tasksInStatus.map(task => {
                  const isPaused = pausedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-lg border bg-white shadow-3xs space-y-2 transition-all ${
                        isPaused ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] font-bold text-slate-400">PED: {task.orderNumber}</span>
                        {isPaused && (
                          <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[8px] font-bold rounded uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                            <AlertTriangle size={8} /> Pausado
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-slate-800 leading-snug line-clamp-2">
                        {task.productName}
                      </h4>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                        <Users size={11} className="shrink-0" />
                        <span className="truncate">Resp: {task.responsible || 'Ateliê'}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2.5">
                        {/* Interactive Buttons */}
                        {status === 'todo' && (
                          <button
                            onClick={() => handleStart(task.id)}
                            className="w-full py-1.5 bg-slate-900 text-white hover:bg-slate-800 font-bold text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs"
                          >
                            <Play size={10} /> Iniciar Montagem
                          </button>
                        )}

                        {status === 'producing' && (
                          <>
                            <button
                              onClick={() => handleTogglePause(task.id, task.productName)}
                              className={`px-2 py-1.5 rounded-lg font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 border ${
                                isPaused
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isPaused ? <Play size={10} /> : <Pause size={10} />}
                              {isPaused ? 'Retomar' : 'Pausar'}
                            </button>

                            <button
                              disabled={isPaused}
                              onClick={() => handleFinishing(task.id)}
                              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Polimento <Check size={10} />
                            </button>
                          </>
                        )}

                        {status === 'finishing' && (
                          <button
                            onClick={() => handleComplete(task.id)}
                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[9px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs"
                          >
                            <Check size={10} /> Finalizar Peça (Concluir)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {tasksInStatus.length === 0 && (
                  <p className="text-center text-[10px] text-slate-400 italic py-8">Nenhuma joia neste estágio.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
