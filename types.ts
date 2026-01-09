export enum RequirementLevel {
  INFO = 'INFO',
  PREPA = 'INFO / PREPA',
  UNACCEPTABLE = '0. UNACCEPTABLE',
  CONSOLIDATED = '1. CONSOLIDATED',
  ADVANCED = '2. ADVANCED',
  EXCELLENCE = '3. EXCELLENCE',
}

export enum ComplianceStatus {
  OK = 'OK',
  NOK = 'NOK',
  NOT_ASSESSED = 'Not Assessed',
  NA = 'Not Applicable',
  NO_BUT_NO_RISK = 'No but no risk',
}

export interface Requirement {
  chapter_level: string | null;
  requirement_level: string;
  requirement: string;
  answer: string | null;
  complies: string | null;
  temporarily_solved: string | null;
  explanation: string | null;
  comments: string | null;
  score_E: string | null;
  score_Ep: string | null;
  score_D: string | null;
  score_C: string | null;
  score_B: string | null;
  source_row?: number;
  id?: string; // Generated ID for internal use
}

export interface EvidencePhoto {
  id: string;
  requirementId: string;
  chapter_level: string | null;
  file_name: string;
  caption: string;
  timestamp: number;
  data: string; // Base64
}

export interface DocumentItem {
  id: string;        // e.g., "DOC-0"
  docNo: string;     // Display Number
  category: string;  // e.g., "Child Labour"
  level: string;     // e.g., "1. CONSOLIDATED"
  documentName: string;
  who: string;
  when_info: string; // 'when' is a reserved keyword in some contexts, using when_info
  available: 'Yes' | 'No' | 'Partial' | 'N/A' | '';
  remarks: string;
}

export interface DocumentEvidence {
  id: string;
  docId: string;
  fileName: string;
  fileType: string;  // MIME type
  fileSize: number;
  data: string;      // Base64
  timestamp: number;
  note?: string;
}

export interface CapItem {
  id: string;
  finding_id: string;
  requirementId: string;
  chapter_level: string | null;
  requirement: string;
  level: string;
  status: string;
  risk_explanation: string;
  immediate_containment: string;
  root_cause?: string;
  corrective_action: string;
  preventive_action: string;
  owner: string;
  due_date: string;
  evidence_needed: string;
  priority: string;
}

export interface ProjectMeta {
  supplierName: string;
  site: string;
  date: string;
  assessor: string;
  brand: string;
  notes: string;
}

export interface ProjectData {
  id: string; // usually 'current' for single project app
  meta: ProjectMeta;
  requirements: Requirement[];
  photos: EvidencePhoto[];
  capItems: CapItem[];
  documents: DocumentItem[]; // New module
  docEvidence: DocumentEvidence[]; // New module evidence
}