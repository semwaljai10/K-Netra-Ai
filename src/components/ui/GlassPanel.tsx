import React, { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  id?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

export default function GlassPanel({
  children,
  className = '',
  hoverable = false,
  id,
  onClick,
  style
}: GlassPanelProps) {
  const panelClass = `glass-panel ${hoverable ? 'glass-panel-hover' : ''} ${className}`;
  
  return (
    <div id={id} className={panelClass} onClick={onClick} style={style}>
      {children}
    </div>
  );
}
