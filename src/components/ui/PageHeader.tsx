import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void; active?: boolean }>;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  kicker,
  breadcrumbs,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 pb-2 border-b border-slate-200/60 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-slate-500">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              {crumb.onClick && !crumb.active ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="hover:text-slate-800 transition-colors cursor-pointer"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={crumb.active ? 'text-slate-900 font-semibold' : ''}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="space-y-1 min-w-0">
          {kicker && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 block">
              {kicker}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-slate-900 truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="pt-2">
          {children}
        </div>
      )}
    </div>
  );
};
