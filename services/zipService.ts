import JSZip from 'jszip';
import { ProjectData } from '../types';
import { getExcelBuffer } from './excelService';

export const exportFullPackage = async (project: ProjectData) => {
  const zip = new JSZip();
  const folderName = `HRP_Audit_${project.meta.supplierName.replace(/\s+/g, '_')}`;
  const root = zip.folder(folderName);

  if (!root) return;

  // 1. Add Excel Report
  const excelBuffer = await getExcelBuffer(project);
  root.file(`Audit_Report.xlsx`, excelBuffer);

  // 2. Add Requirement Photos Folder
  const imgFolder = root.folder("Evidence_Photos");
  if (imgFolder) {
    project.photos.forEach((photo, idx) => {
      if (photo.data && photo.data.includes(',')) {
        const base64Data = photo.data.split(',')[1];
        // Clean filename
        const safeName = photo.file_name.replace(/[^a-z0-9.]/gi, '_');
        const fileName = `${photo.chapter_level || 'GEN'}_${idx}_${safeName}.jpg`; // Force jpg extension for simplicity or detect from header
        imgFolder.file(fileName, base64Data, { base64: true });
      }
    });
  }

  // 3. Add Document Evidence Folder
  if (project.docEvidence && project.docEvidence.length > 0) {
      const docFolder = root.folder("Document_Evidence");
      if (docFolder) {
          project.docEvidence.forEach((ev, idx) => {
              if (ev.data && ev.data.includes(',')) {
                  const base64Data = ev.data.split(',')[1];
                  const safeName = ev.fileName.replace(/[^a-z0-9.]/gi, '_');
                  const docRef = project.documents?.find(d => d.id === ev.docId);
                  const prefix = docRef ? `Doc${docRef.docNo}` : `Unknown`;
                  // Try to keep extension from original filename, or guess
                  let finalName = `${prefix}_${safeName}`;
                  if (!finalName.includes('.')) {
                       if(ev.fileType.includes('pdf')) finalName += '.pdf';
                       else if(ev.fileType.includes('image')) finalName += '.jpg';
                       else finalName += '.bin';
                  }
                  docFolder.file(finalName, base64Data, { base64: true });
              }
          });
      }
  }

  // 4. Add HTML Report (Simple printable version)
  // We reconstruct a basic HTML string here to allow them to open and print "PDF" style from the zip
  const htmlContent = `
    <html>
    <head>
      <title>Audit Report - ${project.meta.supplierName}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h1, h2 { color: #333; }
        .finding { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px; }
        .status { font-weight: bold; color: red; }
        img { max-width: 300px; max-height: 200px; display: block; margin-top: 5px; }
      </style>
    </head>
    <body>
      <h1>Audit Report: ${project.meta.supplierName}</h1>
      <p>Date: ${project.meta.date} | Assessor: ${project.meta.assessor}</p>
      <h2>Findings & CAP</h2>
      ${project.capItems.map(item => {
        const photos = project.photos.filter(p => p.requirementId === item.requirementId);
        return `
          <div class="finding">
            <h3>#${item.finding_id} ${item.requirement}</h3>
            <p><strong>Status:</strong> <span class="status">${item.status}</span></p>
            <p><strong>Action:</strong> ${item.corrective_action || 'N/A'}</p>
            <div>
              ${photos.map(p => `<img src="${p.data}" /><p><i>${p.caption}</i></p>`).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </body>
    </html>
  `;
  root.file("Printable_Report.html", htmlContent);

  // Generate Zip
  const content = await zip.generateAsync({ type: "blob" });
  
  // Download
  const url = window.URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${folderName}_Package.zip`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};