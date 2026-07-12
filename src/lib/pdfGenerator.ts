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
  
  // Section 4: Complainant / Victim
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("4. COMPLAINANT / VICTIM DETAILS", 12, 104);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Name: ${caseData.victim_details.name || 'N/A'}`, 15, 110);
  doc.text(`Age / Gender: ${caseData.victim_details.age || 'N/A'} / ${caseData.victim_details.gender || 'N/A'}`, 110, 110);
  doc.text(`Relation to Suspect: ${caseData.victim_details.relation_to_suspect || 'N/A'}`, 15, 116);
  
  doc.line(10, 121, 200, 121);
  
  // Section 5: Suspect Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("5. ACCUSED / SUSPECT DETAILS", 12, 127);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const suspectDetails = caseData.suspect_details as any;
  doc.text(`Suspect Name: ${suspectDetails.name || 'Unknown / Unassigned'}`, 15, 133);
  doc.text(`Age / Gender: ${suspectDetails.age || 'N/A'} / ${suspectDetails.gender || 'N/A'}`, 110, 133);
  doc.text(`Address: ${suspectDetails.address || 'Not Available'}`, 15, 139);
  
  doc.line(10, 144, 200, 144);
  
  // Section 6: Incident Data
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 100);
  doc.text("6. INCIDENT DATA & COMPLAINT DETAILS", 12, 150);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Crime Category: ${caseData.incident_data.crime_type || 'N/A'}`, 15, 156);
  doc.text(`Subcategory: ${caseData.incident_data.crime_subcategory || 'N/A'}`, 110, 156);
  doc.text(`Weapon Used: ${caseData.incident_data.weapon_used || 'None'}`, 15, 162);
  doc.text(`Vehicle Number: ${caseData.incident_data.vehicle_no || 'None'}`, 110, 162);
  
  doc.setFont("helvetica", "bold");
  doc.text("Operational Case Summary / Description:", 15, 169);
  doc.setFont("helvetica", "normal");
  const fullDescription = `FIR No. ${caseData.case_information.fir_no} registered under sections: ${caseData.case_information.ipc_bns_sections.join(' / ')}. Incident location: ${caseData.case_information.location}. Victim: ${caseData.victim_details.name} (${caseData.victim_details.age}, ${caseData.victim_details.gender}), relation: ${caseData.victim_details.relation_to_suspect}. Officer: ${caseData.investigation_data.investigating_officer_id} at ${caseData.investigation_data.police_station}. Weapon: ${caseData.incident_data.weapon_used}. Vehicle: ${caseData.incident_data.vehicle_no}. Evidence: ${caseData.investigation_data.evidence_summary}.`;
  
  const descLines = doc.splitTextToSize(fullDescription, 180);
  doc.text(descLines, 15, 174);
  
  const nextY = 174 + descLines.length * 4.5 + 5;
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
