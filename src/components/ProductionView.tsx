import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { ProductionTask } from '../types/erp';
import { 
 Play, Check, AlertTriangle, Users, Clock, Calendar, Shield, Sparkles, Plus,
 Wrench, CheckCircle, Flame, Layers, X
} from 'lucide-react';
import { toast } from './Toast';

export const ProductionView: React.FC = () => {
 const { productionTasks, updateProductionTask } = useDb();

 // Selected state
 const [responsibleName, setResponsibleName] = useState('');
 const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

 const activeTasks = productionTasks.filter(t => !t.isDeleted);

 // Kanban Columns
 const todoTasks = activeTasks.filter(t => t.status === 'todo');
 const inProgressTasks = activeTasks.filter(t => t.status === 'in_production');
 const finishingTasks = activeTasks.filter(t => t.status === 'in_finishing');
 const completedTasks = activeTasks.filter(t => t.status === 'completed');

 // Indicators / Stats calculations
 const dailyProdCount = completedTasks.filter(t => t.endDate === new Date().toISOString().split('T')[0]).length;
 const weeklyProdCount = completedTasks.length; // Simplified active weekly total
 const totalTasks = activeTasks.length;
 const efficiency = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 100;
 
 // Tasks past due date
 const delayedTasks = activeTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length;

 const handleStartTask = (id: string) => {
 updateProductionTask(id, { 
 status: 'in_production',
 startDate: new Date().toISOString().split('T')[0]
 });
 toast.success("Produção Iniciada", "A tarefa foi movida para 'Em Produção'.");
 };

 const handleFinishPhase = (id: string) => {
 updateProductionTask(id, { 
 status: 'in_finishing'
 });
 toast.success("Fase de Acabamento", "A peça foi enviada para o polimento e banho.");
 };

 const handleCompleteTask = (id: string) => {
 updateProductionTask(id, { 
 status: 'completed',
 endDate: new Date().toISOString().split('T')[0],
 timeSpentMin: 45 // Simulated default final time
 });
 toast.success("Peça Concluída!", "Joia finalizada com sucesso e pronta para remessa.");
 };

 const handleSetResponsible = (id: string) => {
 if (!responsibleName) {
 toast.warning("Validação", "Digite o nome do artesão responsável.");
 return;
 }
 updateProductionTask(id, { responsible: responsibleName });
 toast.success("Responsável Vinculado", `Artesão ${responsibleName} assumiu a montagem.`);
 setSelectedTaskId(null);
 setResponsibleName('');
 };

 return (
 <div className="space-y-6 animate-slide-in-up">
 
 {/* Upper KPIs Bento Block */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 
 <div className="bg-white border border-slate-200/85 p-4.5 rounded-2xl shadow-sm">
 <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
 <span>Produção Diária</span>
 <CheckCircle size={15} className="text-emerald-500" />
 </div>
 <h2 className="text-xl font-black mt-2 text-slate-900 font-mono">
 {dailyProdCount} peças
 </h2>
 <p className="text-[9.5px] text-slate-400 mt-1">Metas de montagem ativas</p>
 </div>

 <div className="bg-white border border-slate-200/85 p-4.5 rounded-2xl shadow-sm">
 <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
 <span>Produção Semanal</span>
 <Flame size={15} className="text-amber-500 animate-pulse" />
 </div>
 <h2 className="text-xl font-black mt-2 text-slate-900 font-mono">
 {weeklyProdCount} concluídas
 </h2>
 <p className="text-[9.5px] text-slate-400 mt-1">Terços e joias religiosas</p>
 </div>

 <div className="bg-white border border-slate-200/85 p-4.5 rounded-2xl shadow-sm">
 <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
 <span>Eficiência Geral</span>
 <Wrench size={15} className="text-purple-500" />
 </div>
 <h2 className="text-xl font-black mt-2 text-slate-900 font-mono">
 {efficiency}%
 </h2>
 <p className="text-[9.5px] text-slate-400 mt-1">Taxa de entrega no prazo</p>
 </div>

 <div className="bg-white border border-slate-200/85 p-4.5 rounded-2xl shadow-sm">
 <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
 <span>Atrasos Ativos</span>
 <AlertTriangle size={15} className="text-rose-500" />
 </div>
 <h2 className="text-xl font-black mt-2 text-slate-900 font-mono">
 {delayedTasks} tarefas
 </h2>
 <p className="text-[9.5px] text-slate-400 mt-1">Atenção imediata requerida</p>
 </div>

 </div>

 {/* Kanban Floor Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5 items-start">
 
 {/* Column: To Do / A Fazer */}
 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/40 space-y-4">
 <div className="flex justify-between items-center pb-2 border-b border-slate-150 ">
 <h3 className="font-bold text-xs uppercase tracking-wider text-slate-650 ">Pendente ({todoTasks.length})</h3>
 <span className="w-5 h-5 bg-slate-200 rounded-full text-[10px] font-bold text-slate-600 flex items-center justify-center font-mono">{todoTasks.length}</span>
 </div>

 <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
 {todoTasks.map(task => (
 <div key={task.id} className="bg-white border border-slate-150 rounded-xl p-4.5 shadow-xs space-y-3">
 <div className="flex justify-between items-start">
 <span className="text-[9.5px] font-bold font-mono text-slate-400">PED: {task.orderNumber}</span>
 <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold rounded">Cód: {task.id.substring(6, 11).toUpperCase()}</span>
 </div>
 
 <h4 className="font-bold text-xs text-slate-800 leading-snug">{task.productName}</h4>

 <div className="text-[10px] space-y-1 text-slate-450 font-semibold">
 <p className="flex items-center gap-1"><Users size={11} /> Resp: {task.responsible || 'Sem artesão asignado'}</p>
 <p className="flex items-center gap-1"><Calendar size={11} /> Prazo: {task.dueDate}</p>
 </div>

 <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
 <button
 onClick={() => setSelectedTaskId(task.id)}
 className="text-[10px] font-bold text-amber-600 hover:underline cursor-pointer"
 >
 Mudar Artesão
 </button>

 <button
 onClick={() => handleStartTask(task.id)}
 className="px-2.5 py-1 bg-slate-950 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 hover:opacity-90 transition-all cursor-pointer"
 >
 <Play size={10} /> Iniciar
 </button>
 </div>
 </div>
 ))}
 {todoTasks.length === 0 && (
 <p className="text-center text-[11px] text-slate-400 italic py-6">Nenhuma tarefa pendente.</p>
 )}
 </div>
 </div>

 {/* Column: In Production / Em Produção */}
 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/40 space-y-4">
 <div className="flex justify-between items-center pb-2 border-b border-slate-150 ">
 <h3 className="font-bold text-xs uppercase tracking-wider text-slate-650 ">Em Produção ({inProgressTasks.length})</h3>
 <span className="w-5 h-5 bg-amber-500/10 rounded-full text-[10px] font-bold text-amber-600 flex items-center justify-center font-mono">{inProgressTasks.length}</span>
 </div>

 <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
 {inProgressTasks.map(task => (
 <div key={task.id} className="bg-white border border-slate-150 rounded-xl p-4.5 shadow-xs space-y-3">
 <div className="flex justify-between items-start">
 <span className="text-[9.5px] font-bold font-mono text-amber-600">ATIVO</span>
 <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-bold rounded">PRODUÇÃO</span>
 </div>
 
 <h4 className="font-bold text-xs text-slate-800 leading-snug">{task.productName}</h4>

 <div className="text-[10px] space-y-1 text-slate-450 font-semibold">
 <p className="flex items-center gap-1"><Users size={11} /> Resp: {task.responsible || 'Ateliê Sagrado'}</p>
 <p className="flex items-center gap-1"><Clock size={11} /> Iniciado: {task.startDate}</p>
 </div>

 <div className="pt-3 border-t border-slate-100 flex justify-end">
 <button
 onClick={() => handleFinishPhase(task.id)}
 className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all cursor-pointer"
 >
 Concluir Montagem <Play size={10} />
 </button>
 </div>
 </div>
 ))}
 {inProgressTasks.length === 0 && (
 <p className="text-center text-[11px] text-slate-400 italic py-6">Nenhum terço ou joia sendo montada no momento.</p>
 )}
 </div>
 </div>

 {/* Column: Finishing / Acabamento */}
 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/40 space-y-4">
 <div className="flex justify-between items-center pb-2 border-b border-slate-150 ">
 <h3 className="font-bold text-xs uppercase tracking-wider text-slate-650 ">Em Acabamento ({finishingTasks.length})</h3>
 <span className="w-5 h-5 bg-purple-500/10 rounded-full text-[10px] font-bold text-purple-600 flex items-center justify-center font-mono">{finishingTasks.length}</span>
 </div>

 <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
 {finishingTasks.map(task => (
 <div key={task.id} className="bg-white border border-slate-150 rounded-xl p-4.5 shadow-xs space-y-3">
 <div className="flex justify-between items-start">
 <span className="text-[9.5px] font-bold font-mono text-purple-500">ACABAMENTO</span>
 <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 text-[9px] font-bold rounded">BANHO & EMBALAGEM</span>
 </div>
 
 <h4 className="font-bold text-xs text-slate-800 leading-snug">{task.productName}</h4>

 <div className="text-[10px] space-y-1 text-slate-450 font-semibold">
 <p className="flex items-center gap-1"><Users size={11} /> Resp: {task.responsible || 'Artesão Especialista'}</p>
 <p className="flex items-center gap-1"><Calendar size={11} /> Prazo Final: {task.dueDate}</p>
 </div>

 <div className="pt-3 border-t border-slate-100 flex justify-end">
 <button
 onClick={() => handleCompleteTask(task.id)}
 className="px-2.5 py-1 bg-purple-550 hover:bg-purple-650 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all cursor-pointer"
 >
 <Check size={10} /> Finalizar Peça
 </button>
 </div>
 </div>
 ))}
 {finishingTasks.length === 0 && (
 <p className="text-center text-[11px] text-slate-400 italic py-6">Nenhuma peça na fase final de acabamento.</p>
 )}
 </div>
 </div>

 {/* Column: Completed / Concluído */}
 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/40 space-y-4">
 <div className="flex justify-between items-center pb-2 border-b border-slate-150 ">
 <h3 className="font-bold text-xs uppercase tracking-wider text-slate-650 ">Concluído ({completedTasks.length})</h3>
 <span className="w-5 h-5 bg-emerald-550/10 rounded-full text-[10px] font-bold text-emerald-600 flex items-center justify-center font-mono">{completedTasks.length}</span>
 </div>

 <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
 {completedTasks.map(task => (
 <div key={task.id} className="bg-white border border-slate-150 rounded-xl p-4.5 shadow-xs space-y-3 opacity-80 hover:opacity-100 transition-opacity">
 <div className="flex justify-between items-start">
 <span className="text-[9.5px] font-bold font-mono text-emerald-600 flex items-center gap-1">
 <Check size={10} /> FINALIZADO
 </span>
 <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold rounded">{task.endDate}</span>
 </div>
 
 <h4 className="font-bold text-xs text-slate-800 leading-snug line-through">{task.productName}</h4>

 <div className="text-[10px] space-y-1 text-slate-450 font-semibold">
 <p>Artesão: <strong>{task.responsible || 'Ateliê'}</strong></p>
 <p>Tempo investido: <strong>{task.timeSpentMin} minutos</strong></p>
 </div>
 </div>
 ))}
 {completedTasks.length === 0 && (
 <p className="text-center text-[11px] text-slate-400 italic py-6">Nenhuma joia concluída hoje ainda.</p>
 )}
 </div>
 </div>

 </div>

 {/* MODAL RESPONSIBLE ARTISAN */}
 {selectedTaskId && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[90vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between bg-slate-50 ">
 <h3 className="font-bold text-sm text-slate-900 ">Vincular Artesão Responsável</h3>
 <button onClick={() => setSelectedTaskId(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <div className="p-6 space-y-4 overflow-y-auto flex-1">
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome do Artesão</label>
 <input
 type="text"
 required
 value={responsibleName}
 onChange={(e) => setResponsibleName(e.target.value)}
 placeholder="Ex: Francisco de Assis"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="pt-2 border-t border-slate-150 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setSelectedTaskId(null)}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={() => handleSetResponsible(selectedTaskId)}
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 Confirmar
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 </div>
 );
};
