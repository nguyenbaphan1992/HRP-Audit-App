import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectData } from '../types';
import { getStats, calculateGrade, CHAPTER_TITLES, getChapterNumber } from '../utils';

export const generatePDFReport = async (project: ProjectData) => {
  // Cast to any to allow access to internal, autoTable and other plugin methods 
  // without conflicting with stricter or missing type definitions.
  const doc: any = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // --- 1. COVER PAGE ---
  doc.setFillColor(30, 64, 175); // Blue-800
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("HRP SOCIAL AUDIT REPORT", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("Offline Audit Tool Generated", pageWidth / 2, 30, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`Supplier: ${project.meta.supplierName}`, 20, 60);
  doc.text(`Site: ${project.meta.site}`, 20, 70);
  doc.text(`Date: ${project.meta.date}`, 20, 80);
  doc.text(`Assessor: ${project.meta.assessor}`, 20, 90);
  doc.text(`Global Grade: ${calculateGrade(project.requirements)}`, 20, 110);

  // Stats Table
  const stats = getStats(project.requirements);
  autoTable(doc, {
    startY: 120,
    head: [['Metric', 'Count']],
    body: [
      ['Total Requirements', stats.total],
      ['Compliant (OK)', stats.ok],
      ['Non-Compliant (NOK)', stats.nok],
      ['Not Applicable (N/A)', stats.na],
      ['Not Assessed', stats.notAssessed]
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] }
  });

  doc.addPage();

  // --- 2. CAP SUMMARY ---
  doc.setFontSize(16);
  doc.text("Corrective Action Plan (CAP)", 14, 20);
  
  const capRows = project.capItems.map(cap => [
    cap.finding_id,
    cap.priority,
    cap.status,
    cap.requirement.substring(0, 50) + "...",
    cap.corrective_action,
    cap.due_date
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['ID', 'Priority', 'Status', 'Finding', 'Action', 'Due Date']],
    body: capRows,
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] }, // Red header
    styles: { fontSize: 8 }
  });

  // --- 3. DOCUMENT CHECKLIST ---
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Document Checking-List", 14, 20);

  // Summary of docs
  const totalDocs = project.documents?.length || 0;
  const availDocs = project.documents?.filter(d => d.available === 'Yes' || d.available === 'Partial').length || 0;
  const missingDocs = project.documents?.filter(d => d.available === 'No').length || 0;

  doc.setFontSize(10);
  doc.text(`Total Documents: ${totalDocs} | Available/Partial: ${availDocs} | Missing: ${missingDocs}`, 14, 28);

  const docRows = project.documents ? project.documents.map(d => [
      d.docNo,
      d.category,
      d.documentName.substring(0, 60),
      d.who,
      d.available || '-',
      d.remarks || ''
  ]) : [];

  autoTable(doc, {
      startY: 35,
      head: [['No', 'Category', 'Document', 'Who', 'Avail.', 'Remarks']],
      body: docRows,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50] },
      styles: { fontSize: 8 },
      columnStyles: { 2: { cellWidth: 70 } }
  });

  // --- 4. DOCUMENT EVIDENCE APPENDIX ---
  if (project.docEvidence && project.docEvidence.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Appendix: Document Evidence", 14, 20);

      let yPos = 30;
      project.docEvidence.forEach((ev, idx) => {
          const docItem = project.documents.find(d => d.id === ev.docId);
          const docName = docItem ? docItem.documentName : 'Unknown Doc';
          
          if (yPos > 250) {
              doc.addPage();
              yPos = 20;
          }

          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(`Doc: ${docName} (${ev.fileName})`, 14, yPos);
          yPos += 7;

          if (ev.fileType.startsWith('image/') && ev.data.includes(',')) {
              try {
                  const format = ev.fileType.includes('png') ? 'PNG' : 'JPEG';
                  // constrain image
                  const imgH = 60;
                  const imgW = 80;
                  doc.addImage(ev.data, format, 14, yPos, imgW, imgH);
                  yPos += imgH + 10;
              } catch (e) {
                  doc.setFont(undefined, 'normal');
                  doc.text("[Image Error]", 14, yPos);
                  yPos += 10;
              }
          } else {
              doc.setFont(undefined, 'normal');
              doc.text(`[File Attached: ${ev.fileName} - ${Math.round(ev.fileSize/1024)} KB]`, 14, yPos);
              yPos += 10;
          }
      });
  }

  // --- 5. PHOTO APPENDIX ---
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Audit Findings Photos", 14, 20);
  
  let yPos = 30;
  let xPos = 14;
  const imgWidth = 80;
  const imgHeight = 60;
  const margin = 10;

  for (let i = 0; i < project.photos.length; i++) {
    const photo = project.photos[i];
    
    // Check page break
    if (yPos + imgHeight + 20 > doc.internal.pageSize.height) {
      doc.addPage();
      yPos = 20;
    }

    // Embed Image
    try {
        if (photo.data && photo.data.includes(',')) {
            // Determine format
            const format = photo.data.includes('image/png') ? 'PNG' : 'JPEG';
            doc.addImage(photo.data, format, xPos, yPos, imgWidth, imgHeight);
            
            // Caption
            doc.setFontSize(10);
            doc.text(`ID: ${photo.chapter_level} - ${photo.caption.substring(0, 30)}`, xPos, yPos + imgHeight + 5);
            
            // Grid layout logic (2 columns)
            if (xPos === 14) {
                xPos += imgWidth + margin;
            } else {
                xPos = 14;
                yPos += imgHeight + 20;
            }
        }
    } catch (e) {
        console.error("Error adding image to PDF", e);
    }
  }

  // --- DOWNLOAD ---
  doc.save(`HRP_Report_${project.meta.supplierName}_${project.meta.date}.pdf`);
};