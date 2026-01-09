import ExcelJS from 'exceljs';
import { ProjectData } from '../types';
import { calculateGrade, getStats } from '../utils';

// Helper to generate workbook
const createWorkbook = (project: ProjectData): ExcelJS.Workbook => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HRP Audit App';
  workbook.created = new Date();

  // --- SHEET 1: SUMMARY ---
  const summarySheet = workbook.addWorksheet('SUMMARY');
  summarySheet.columns = [
    { header: 'Item', key: 'item', width: 30 },
    { header: 'Value', key: 'value', width: 50 },
  ];
  
  summarySheet.addRows([
    ['Supplier Name', project.meta.supplierName],
    ['Site', project.meta.site],
    ['Date', project.meta.date],
    ['Assessor', project.meta.assessor],
    ['Brand', project.meta.brand],
    ['Global Grade', calculateGrade(project.requirements)],
  ]);
  
  summarySheet.addRow([]);
  summarySheet.addRow(['Requirement Level Stats']);
  const levels = ['0. UNACCEPTABLE', '1. CONSOLIDATED', '2. ADVANCED', '3. EXCELLENCE'];
  levels.forEach(lvl => {
    const reqs = project.requirements.filter(r => r.requirement_level.includes(lvl));
    const stats = getStats(reqs);
    summarySheet.addRow([lvl, `OK: ${stats.ok}, NOK: ${stats.nok}, N/A: ${stats.na}`]);
  });

  // --- SHEET 2: CHECKLIST ---
  const checklistSheet = workbook.addWorksheet('CHECKLIST');
  checklistSheet.columns = [
    { header: 'Chapter', key: 'chapter_level', width: 10 },
    { header: 'Level', key: 'requirement_level', width: 15 },
    { header: 'Requirement', key: 'requirement', width: 50 },
    { header: 'Answer', key: 'answer', width: 15 },
    { header: 'Complies', key: 'complies', width: 15 },
    { header: 'Comments', key: 'comments', width: 40 },
  ];
  
  project.requirements.forEach(req => {
    checklistSheet.addRow({
      chapter_level: req.chapter_level,
      requirement_level: req.requirement_level,
      requirement: req.requirement,
      answer: req.answer,
      complies: req.complies,
      comments: req.comments
    });
  });

  // --- SHEET 3: DOCUMENTS ---
  const docSheet = workbook.addWorksheet('DOCUMENTS');
  docSheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Category', key: 'cat', width: 20 },
      { header: 'Document', key: 'doc', width: 40 },
      { header: 'Who', key: 'who', width: 10 },
      { header: 'Available', key: 'avail', width: 12 },
      { header: 'Remarks', key: 'remark', width: 30 },
      { header: 'Evidence Files', key: 'files', width: 10 }
  ];

  if (project.documents) {
      project.documents.forEach(d => {
          const evidenceCount = project.docEvidence ? project.docEvidence.filter(e => e.docId === d.id).length : 0;
          docSheet.addRow({
              no: d.docNo,
              cat: d.category,
              doc: d.documentName,
              who: d.who,
              avail: d.available,
              remark: d.remarks,
              files: evidenceCount
          });
      });
  }

  // --- SHEET 4: PICTURES ---
  const picturesSheet = workbook.addWorksheet('PICTURES');
  picturesSheet.columns = [
    { header: 'Chapter', key: 'chapter', width: 10 },
    { header: 'Requirement', key: 'req', width: 40 },
    { header: 'Caption', key: 'caption', width: 30 },
    { header: 'Photo', key: 'photo', width: 50 },
  ];

  const ROW_HEIGHT = 119; 

  for (let i = 0; i < project.photos.length; i++) {
    const photo = project.photos[i];
    const req = project.requirements.find(r => r.id === photo.requirementId);
    
    const row = picturesSheet.addRow({
      chapter: photo.chapter_level,
      req: req ? req.requirement : 'Unknown',
      caption: photo.caption
    });
    
    row.height = ROW_HEIGHT;

    // Safety check for base64
    if (photo.data && photo.data.includes(',')) {
      const base64Data = photo.data.split(',')[1];
      const imageId = workbook.addImage({
        base64: base64Data,
        extension: 'jpeg',
      });

      picturesSheet.addImage(imageId, {
        tl: { col: 3, row: row.number - 1 } as any,
        br: { col: 4, row: row.number } as any,
        editAs: 'oneCell'
      });
    }
  }

  // --- SHEET 5: CAP ---
  const capSheet = workbook.addWorksheet('CAP');
  capSheet.columns = [
    { header: 'Finding ID', key: 'id', width: 15 },
    { header: 'Requirement', key: 'req', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Risk Explanation', key: 'risk', width: 30 },
    { header: 'Corrective Action', key: 'action', width: 30 },
    { header: 'Owner', key: 'owner', width: 15 },
    { header: 'Due Date', key: 'date', width: 15 },
    { header: 'Priority', key: 'priority', width: 15 },
  ];

  project.capItems.forEach(cap => {
    capSheet.addRow({
      id: cap.finding_id,
      req: cap.requirement,
      status: cap.status,
      risk: cap.risk_explanation,
      action: cap.corrective_action,
      owner: cap.owner,
      date: cap.due_date,
      priority: cap.priority
    });
  });

  return workbook;
};

export const exportToExcel = async (project: ProjectData) => {
  const workbook = createWorkbook(project);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `HRP_Audit_${project.meta.supplierName}_${project.meta.date}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const getExcelBuffer = async (project: ProjectData): Promise<ArrayBuffer> => {
  const workbook = createWorkbook(project);
  return await workbook.xlsx.writeBuffer();
};