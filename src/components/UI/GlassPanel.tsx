import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  glow?: 'none' | 'cyan' | 'purple' | 'magenta';
}

const paddingMap = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const roundedMap = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
};

const glowMap = {
  none: '',
  cyan: 'glow-cyan',
  purple: 'glow-purple',
  magenta: 'glow-magenta',
};

export default function GlassPanel({
  children,
  className = '',
  onClick,
  padding = 'md',
  rounded = 'xl',
  glow = 'none',
}: GlassPanelProps) {
  return (
    <div
      className={`glass ${paddingMap[padding]} ${roundedMap[rounded]} ${glowMap[glow]} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  );
}
