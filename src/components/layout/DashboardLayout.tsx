import React from 'react';
import { PageHeader, PageHeaderProps } from '../ui/PageHeader';

export interface DashboardLayoutProps {
  header?: PageHeaderProps;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1600px]',
  full: 'max-w-full',
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  header,
  children,
  className = '',
  maxWidth = '2xl',
}) => {
  return (
    <div className={`w-full mx-auto space-y-6 ${maxWidthClasses[maxWidth]} ${className}`}>
      {header && <PageHeader {...header} />}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
