import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'neutral' | 'gold' | 'rose' | 'emerald';
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  if (variant === 'underline') {
    return (
      <div className={`border-b border-slate-200 overflow-x-auto ${className}`}>
        <nav className="flex space-x-6 min-w-max">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={tab.disabled}
                onClick={() => onChange(tab.id)}
                className={`
                  flex items-center gap-2 py-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${isActive 
                    ? 'border-amber-600 text-amber-900 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}
                `}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // 'pills' variant (default)
  return (
    <div className={`overflow-x-auto pb-1 ${className}`}>
      <div className={`flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 gap-1 min-w-max ${fullWidth ? 'w-full' : ''}`}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center justify-center gap-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap select-none
                ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'}
                ${fullWidth ? 'flex-1' : ''}
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isActive 
                  ? 'bg-white text-slate-900 font-bold shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'}
              `}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none ${
                  isActive ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
