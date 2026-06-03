import React from 'react';
import { getSeverityStyles } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const styles = getSeverityStyles(severity);
  return (
    <span
      className={`badge-severity ${severity}`}
      style={{
        backgroundColor: styles.bg,
        color: styles.color,
        borderColor: styles.color,
      }}
    >
      {severity}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'Open' | 'Dispatched' | 'Resolved' | 'Active' | 'Parole' | 'Incarcerated';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let styles = {
    bg: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-muted)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  if (status === 'Open' || status === 'Active') {
    styles = {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: 'var(--color-red)',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    };
  } else if (status === 'Dispatched' || status === 'Parole') {
    styles = {
      bg: 'rgba(245, 158, 11, 0.1)',
      color: 'var(--color-yellow)',
      border: '1px solid rgba(245, 158, 11, 0.2)'
    };
  } else if (status === 'Resolved' || status === 'Incarcerated') {
    styles = {
      bg: 'rgba(59, 130, 246, 0.1)',
      color: 'var(--color-blue)',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    };
  }

  return (
    <span
      className="badge-severity"
      style={{
        backgroundColor: styles.bg,
        color: styles.color,
        border: styles.border,
        fontSize: '0.65rem',
        padding: '0.15rem 0.4rem',
        borderRadius: '4px',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontFamily: 'var(--font-family-mono)',
        display: 'inline-block'
      }}
    >
      {status}
    </span>
  );
}
