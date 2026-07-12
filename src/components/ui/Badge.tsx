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
      bg: 'var(--color-red-badge)',
      color: 'var(--color-red)',
      border: '1px solid var(--color-red)'
    };
  } else if (status === 'Dispatched' || status === 'Parole') {
    styles = {
      bg: 'var(--color-yellow-badge)',
      color: 'var(--color-yellow)',
      border: '1px solid var(--color-yellow)'
    };
  } else if (status === 'Resolved' || status === 'Incarcerated') {
    styles = {
      bg: 'var(--color-blue-badge)',
      color: 'var(--color-blue)',
      border: '1px solid var(--color-blue)'
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

interface StatusBadgeClickableProps {
  status: 'Open' | 'Dispatched' | 'Resolved';
  rawStatus?: string;
  onClick?: () => void;
}

export function StatusBadgeClickable({ status, rawStatus, onClick }: StatusBadgeClickableProps) {
  let styles = {
    bg: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-muted)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  if (status === 'Open') {
    styles = {
      bg: 'var(--color-red-badge)',
      color: 'var(--color-red)',
      border: '1px solid var(--color-red)'
    };
  } else if (status === 'Dispatched') {
    styles = {
      bg: 'var(--color-yellow-badge)',
      color: 'var(--color-yellow)',
      border: '1px solid var(--color-yellow)'
    };
  } else if (status === 'Resolved') {
    styles = {
      bg: 'var(--color-blue-badge)',
      color: 'var(--color-blue)',
      border: '1px solid var(--color-blue)'
    };
  }

  return (
    <span
      className="badge-severity status-badge-clickable"
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
        display: 'inline-block',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      onClick={onClick}
      title="Click to modify status"
    >
      {status}
    </span>
  );
}
