'use client';

import { jsPDF } from 'jspdf';
import { rawCrimeData } from './data';

export function generateFIRPDF(incidentId: string, customCaseData?: any) {
  const caseData = customCaseData || rawCrimeData.find((item: any) => item.case_information.unique_id === incidentId);
  if (!caseData) {
    alert("Error: Case data not found in dataset.");
    return;
  }

  // Create new jsPDF document
  const doc = new jsPDF();
  
  // Page Border
  doc.setLineWidth(0.5);
  doc.setDrawColor(20, 30, 50);
  doc.rect(5, 5, 200, 287); // outer border
  doc.rect(6, 6, 198, 285); // inner border
  
  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 50, 100);
  doc.text("KARNATAKA STATE POLICE DEPARTMENT", 105, 18, { align: "center" });
  
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text("FIRST INFORMATION REPORT", 105, 25, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("(Under Section 154 Cr.P.C.)", 105, 30, { align: "center" });
  
  // Divider
  doc.setLineWidth(0.3);
  doc.line(10, 35, 200, 35);
  
  // Section 1: FIR Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("1. DISTRICT / POLICE STATION DETAILS", 12, 41);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const districtName = caseData.case_information.location.split(',').pop()?.trim() || 'Karnataka';
  doc.text(`District: ${districtName}`, 15, 47);
  doc.text(`Police Station: ${caseData.investigation_data.police_station || 'N/A'}`, 110, 47);
  doc.text(`FIR Number: ${caseData.case_information.fir_no || 'N/A'}`, 15, 53);
  doc.text(`Date & Time of FIR: ${new Date(caseData.case_information.date_time).toLocaleString('en-IN')}`, 110, 53);
  
  doc.line(10, 58, 200, 58);
  
  // Section 2: Acts & Sections
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("2. ACTS & SECTIONS", 12, 64);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Act/Sections: ${caseData.case_information.ipc_bns_sections.join(' / ') || 'N/A'}`, 15, 70);
  
  doc.line(10, 75, 200, 75);
  
  // Section 3: Occurrence of Offence
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("3. OCCURRENCE OF OFFENCE", 12, 81);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Date & Time: ${new Date(caseData.case_information.date_time).toLocaleString('en-IN')}`, 15, 87);
  doc.text(`Place of Occurrence: ${caseData.case_information.location || 'N/A'}`, 15, 93);
  
  doc.line(10, 98, 200, 98);
  
  // Dynamic Y-coordinate layout starting at 104
  let currentY = 104;

  // Section 4: Complainant / Victim
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("4. COMPLAINANT / VICTIM DETAILS", 12, currentY);
  currentY += 6;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);

  const victimsList = (caseData.victims && caseData.victims.length > 0) ? caseData.victims : 
                      (caseData.all_victims && caseData.all_victims.length > 0) ? caseData.all_victims :
                      (caseData._source?.all_victims && caseData._source.all_victims.length > 0) ? caseData._source.all_victims :
                      (caseData._source?.victims && caseData._source.victims.length > 0) ? caseData._source.victims :
                      (caseData.victim_details ? [caseData.victim_details] : []);

  if (victimsList.length === 0) {
    doc.text("No victims listed in FIR.", 15, currentY);
    currentY += 6;
  } else {
    victimsList.forEach((v: any, idx: number) => {
      const label = victimsList.length > 1 ? `${idx + 1}. Name: ` : "Name: ";
      doc.text(`${label}${v.name || 'N/A'}`, 15, currentY);
      doc.text(`Age / Gender: ${v.age || 'N/A'} / ${v.gender || 'N/A'}`, 110, currentY);
      currentY += 5;
      doc.text(`Relation to Suspect: ${v.relation_to_accused || v.relation_to_suspect || v.relation || 'N/A'}`, 19, currentY);
      currentY += 6;
    });
  }
  
  doc.line(10, currentY, 200, currentY);
  currentY += 6;
  
  // Section 5: Suspect Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("5. ACCUSED / SUSPECT DETAILS", 12, currentY);
  currentY += 6;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);

  const suspectsList = (caseData.accusedSuspects && caseData.accusedSuspects.length > 0) ? caseData.accusedSuspects :
                       (caseData.accused_suspects && caseData.accused_suspects.length > 0) ? caseData.accused_suspects :
                       (caseData.suspects && caseData.suspects.length > 0) ? caseData.suspects :
                       (caseData._source?.all_suspects && caseData._source.all_suspects.length > 0) ? caseData._source.all_suspects :
                       (caseData._source?.accused_suspects && caseData._source.accused_suspects.length > 0) ? caseData._source.accused_suspects :
                       (caseData._source?.suspects && caseData._source.suspects.length > 0) ? caseData._source.suspects :
                       (caseData.suspect_details ? [caseData.suspect_details] : []);

  if (suspectsList.length === 0) {
    doc.text("No suspects listed in FIR.", 15, currentY);
    currentY += 6;
  } else {
    suspectsList.forEach((s: any, idx: number) => {
      const label = suspectsList.length > 1 ? `${idx + 1}. Suspect Name: ` : "Suspect Name: ";
      doc.text(`${label}${s.name || 'Unknown / Unassigned'} (${s.suspect_id || 'N/A'})`, 15, currentY);
      doc.text(`Age / Gender: ${s.age || 'N/A'} / ${s.gender || 'N/A'}`, 110, currentY);
      currentY += 5;
      doc.text(`Address: ${s.address || 'Not Available'}`, 19, currentY);
      currentY += 6;
    });
  }
  
  doc.line(10, currentY, 200, currentY);
  currentY += 6;
  
  // Section 6: Incident Data
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("6. INCIDENT DATA & COMPLAINT DETAILS", 12, currentY);
  currentY += 6;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Crime Category: ${caseData.incident_data.crime_type || 'N/A'}`, 15, currentY);
  doc.text(`Subcategory: ${caseData.incident_data.crime_subcategory || 'N/A'}`, 110, currentY);
  currentY += 6;
  doc.text(`Weapon Used: ${caseData.incident_data.weapon_used || 'None'}`, 15, currentY);
  doc.text(`Vehicle Number: ${caseData.incident_data.vehicle_no || 'None'}`, 110, currentY);
  currentY += 8;
  
  doc.setFont("helvetica", "bold");
  doc.text("Operational Case Summary / Description:", 15, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal");

  const victimsSummary = victimsList.map((v: any) => `${v.name} (${v.age || 'N/A'}, ${v.gender || 'N/A'})`).join(', ') || caseData.victim_details.name;
  const suspectsSummary = suspectsList.map((s: any) => `${s.name} (${s.age || 'N/A'}, ${s.gender || 'N/A'})`).join(', ') || caseData.suspect_details.name;
  const fullDescription = `FIR No. ${caseData.case_information.fir_no} registered under sections: ${caseData.case_information.ipc_bns_sections.join(' / ')}. Incident location: ${caseData.case_information.location}. Victims: ${victimsSummary}. Suspects: ${suspectsSummary}. Officer: ${caseData.investigation_data.investigating_officer_id} at ${caseData.investigation_data.police_station}. Weapon: ${caseData.incident_data.weapon_used}. Vehicle: ${caseData.incident_data.vehicle_no}. Evidence: ${caseData.investigation_data.evidence_summary}.`;
  
  const descLines = doc.splitTextToSize(fullDescription, 180);
  doc.text(descLines, 15, currentY);
  
  const nextY = currentY + descLines.length * 4.5 + 5;
  doc.line(10, nextY, 200, nextY);
  
  // Section 7: Investigation Data
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("7. INVESTIGATION & EVIDENCE DETAILS", 12, nextY + 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Investigating Officer: ${caseData.investigation_data.investigating_officer_id || 'N/A'}`, 15, nextY + 12);
  doc.text(`Charge Sheet Filed: ${caseData.legal_outcome.charge_sheet_filed ? 'YES' : 'NO'}`, 110, nextY + 12);
  doc.text(`Legal Outcome Status: ${caseData.legal_outcome.conviction_status || 'Under Investigation'}`, 15, nextY + 18);
  
  doc.setFont("helvetica", "bold");
  doc.text("Evidence Summary / Findings:", 15, nextY + 25);
  doc.setFont("helvetica", "normal");
  const evidenceLines = doc.splitTextToSize(caseData.investigation_data.evidence_summary || 'No evidence summaries logged at this stage.', 180);
  doc.text(evidenceLines, 15, nextY + 30);
  
  const footerY = nextY + 30 + evidenceLines.length * 4.5 + 15;
  
  // Footer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("K-NETRA COMMAND CENTER - AUTOMATED INQUEST SYSTEM", 105, footerY, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Report Date: ${new Date().toLocaleString('en-IN')} | Secure Hash Verification: K-NETRA-${incidentId}-SEC`, 105, footerY + 5, { align: "center" });
 
  // Generate blob URL
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const fileName = `K-NETRA_FIR_${caseData.case_information.fir_no.replace(/\//g, '_')}.pdf`;
 
  return { url, fileName };
}
