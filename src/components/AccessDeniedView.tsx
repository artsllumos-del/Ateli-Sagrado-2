import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AccessDeniedViewProps {
  moduleName?: string;
  userRole?: string;
  onGoBack: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ 
  moduleName = 'este módulo', 
  userRole = 'Operador',
  onGoBack 
}) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6 shadow-xs text-amber-700">
        <ShieldAlert className="w-8 h-8" />
      </div>
      
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold mb-3 border border-stone-200">
        <Lock className="w-3.5 h-3.5" />
        Controle de Acesso Baseado em Papéis (RBAC)
      </div>

      <h2 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">
        Acesso Não Permitido
      </h2>
      
      <p className="text-stone-600 text-sm leading-relaxed mb-6">
        Seu perfil atual (<span className="font-semibold text-stone-800">{userRole}</span>) não possui permissão concedida para acessar <span className="font-semibold text-stone-800">{moduleName}</span>. Entre em contato com o Administrador do Ateliê para solicitar ampliação de privilégios.
      </p>

      <button
        onClick={onGoBack}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm transition-all duration-200 shadow-sm active:scale-98"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Painel Executivo
      </button>
    </div>
  );
};
