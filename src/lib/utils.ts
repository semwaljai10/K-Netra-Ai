import { Incident, Offender, MOCK_DISTRICTS } from './data';

// Helper to format ISO timestamp into readable string
export function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    }) + ' IST';
  } catch {
    return isoString;
  }
}

// Convert a severity string to CSS classes or colors
export function getSeverityStyles(severity: 'Critical' | 'High' | 'Medium' | 'Low') {
  switch (severity) {
    case 'Critical':
      return {
        bg: 'var(--color-red-badge)',
        color: 'var(--color-red)',
        border: '1px solid var(--color-red)',
        text: 'text-red'
      };
    case 'High':
      return {
        bg: 'var(--color-yellow-badge)',
        color: 'var(--color-yellow)',
        border: '1px solid var(--color-yellow)',
        text: 'text-yellow'
      };
    case 'Medium':
      return {
        bg: 'var(--color-blue-badge)',
        color: 'var(--color-blue)',
        border: '1px solid var(--color-blue)',
        text: 'text-blue'
      };
    case 'Low':
      return {
        bg: 'var(--color-success-badge)',
        color: 'var(--color-success)',
        border: '1px solid var(--color-success)',
        text: 'text-success'
      };
    default:
      return {
        bg: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--text-muted)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        text: 'text-muted'
      };
  }
}

// CSV exporter trigger
export function exportIncidentMatrixToCSV(activeIncidents: Incident[], offenders: Offender[]) {
  if (activeIncidents.length === 0) return;

  let csvContent = "IncidentID,Classification,Sector,Severity,Timestamp,AssignedSuspect,Status\n";

  activeIncidents.forEach(inc => {
    const offender = offenders.find(o => o.id === inc.offenderId);
    const offenderName = offender ? offender.name : 'Unassigned';
    const district = MOCK_DISTRICTS[inc.districtId] || { name: inc.districtId };

    const row = `${inc.id},"${inc.type}","${district.name}",${inc.severity},${inc.timestamp},"${offenderName}",${inc.status}`;
    csvContent += row + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `K-NETRA_Incidents_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
