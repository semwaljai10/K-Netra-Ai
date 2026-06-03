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
        bg: 'rgba(239, 68, 68, 0.12)',
        color: 'var(--color-red)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        text: 'text-red'
      };
    case 'High':
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        color: 'var(--color-yellow)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        text: 'text-yellow'
      };
    case 'Medium':
      return {
        bg: 'rgba(59, 130, 246, 0.12)',
        color: 'var(--color-blue)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        text: 'text-blue'
      };
    case 'Low':
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        color: 'var(--color-success)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
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

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "IncidentID,Classification,Sector,Severity,Timestamp,AssignedSuspect,Status\n";

  activeIncidents.forEach(inc => {
    const offender = offenders.find(o => o.id === inc.offenderId);
    const offenderName = offender ? offender.name : 'Unassigned';
    const district = MOCK_DISTRICTS[inc.districtId] || { name: inc.districtId };

    const row = `${inc.id},"${inc.type}","${district.name}",${inc.severity},${inc.timestamp},"${offenderName}",${inc.status}`;
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `AETHER_Incidents_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
