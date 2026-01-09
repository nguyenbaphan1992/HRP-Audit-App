import { Requirement, RequirementLevel, ComplianceStatus, CapItem, DocumentItem, ProjectData } from './types';

// --- CONSTANTS & MAPS ---

export const CHAPTER_TITLES: Record<string, string> = {
  "1": "CHILD LABOUR",
  "2": "FORCED LABOUR",
  "3": "FREEDOM OF ASSOCIATION & GRIEVANCE",
  "4": "H&S - LEGAL AUTHORIZATIONS",
  "5": "H&S - RISK & SAFETY MANAGEMENT",
  "6": "H&S - CHEMICALS MANAGEMENT",
  "7": "H&S - FIRE SAFETY / EVACUATION",
  "8": "H&S - LIVING ENVIRONMENT",
  "9": "WORKING HOURS",
  "10": "WAGES & BENEFITS",
  "11": "EMPLOYMENT PRACTICES / HR",
  "12": "HRP MANAGEMENT SYSTEM"
};

// --- DOCUMENT SEED DATA ---
const DOC_SEED_RAW = [
  // General
  { no: "0", cat: "General", lvl: "INFO / PREPA", doc: "Factory / premises map", when: "To be transmitted to the assessor before the evaluation", who: "" },
  { no: "1", cat: "General", lvl: "INFO / PREPA", doc: "Fire protection system drawing", when: "", who: "" },
  { no: "2", cat: "General", lvl: "INFO / PREPA", doc: "Organizational chart", when: "To be transmitted to the assessor before the evaluation", who: "" },
  { no: "3", cat: "General", lvl: "INFO / PREPA", doc: "Production Flow Charts", when: "To be transmitted to the assessor before the evaluation", who: "" },
  { no: "4", cat: "General", lvl: "INFO / PREPA", doc: "The staff list", when: "To be transmitted to the assessor before the evaluation", who: "" },
  { no: "5", cat: "General", lvl: "INFO / PREPA", doc: "All former Social compliance audit reports and certification, if any", when: "To be transmitted to the assessor before the evaluation", who: "" },
  { no: "6", cat: "General", lvl: "INFO / PREPA", doc: "Factory risk analysis", when: "To be transmitted to the assessor before the evaluation", who: "" },
  { no: "7", cat: "General", lvl: "INFO / PREPA", doc: "Chemicals substance inventory", when: "To be transmitted to the assessor before the evaluation", who: "" },
  // Child Labour
  { no: "8", cat: "Child Labour", lvl: "INFO / PREPA", doc: "List of the young workers (birth date, contract date,working station name,gender )", who: "HR" },
  { no: "9", cat: "Child Labour", lvl: "INFO / PREPA", doc: "List of children ( If family staying with children in the dormitories)", who: "HR" },
  { no: "10", cat: "Child Labour", lvl: "0. UNACCEPTABLE", doc: "List of the workers ( birth date ,contract date,working place,gender)", who: "HR" },
  { no: "11", cat: "Child Labour", lvl: "1. CONSOLIDATED", doc: "List & management policy if family staying with children in the dormitories", who: "HR" },
  { no: "12", cat: "Child Labour", lvl: "1. CONSOLIDATED", doc: "Factory entire procedure / policy which is linked to the child enterance to the premises", who: "HR" },
  { no: "13", cat: "Child Labour", lvl: "1. CONSOLIDATED", doc: "Proof of Age documentation ( example: ID card copy, passport copy etc.)", who: "HR" },
  { no: "14", cat: "Child Labour", lvl: "2. ADVANCED", doc: "Child labor and young worker policy or procedure", who: "HR" },
  { no: "15", cat: "Child Labour", lvl: "2. ADVANCED", doc: "Formalized procedure to ensure the detection, prevention and remediation of child labor and the well-being of young workers", who: "HR" },
  { no: "16", cat: "Child Labour", lvl: "3. EXCELLENCE", doc: "A document/presentation/files proving the involvement of the supplier on education support", who: "MANAGEMENT" },
  // Forced Labour
  { no: "17", cat: "Forced Labour", lvl: "INFO / PREPA", doc: "List & management policy for foreign workers", who: "HR" },
  { no: "18", cat: "Forced Labour", lvl: "1. CONSOLIDATED", doc: "Copy of work permit for foreign worker", who: "HR" },
  { no: "19", cat: "Forced Labour", lvl: "1. CONSOLIDATED", doc: "List of recruitment agency/broker & business/operating license for them", who: "HR" },
  { no: "20", cat: "Forced Labour", lvl: "1. CONSOLIDATED", doc: "Overtime agrement which is signed by employee", who: "HR" },
  { no: "21", cat: "Forced Labour", lvl: "2. ADVANCED", doc: "Ethical recruitment policy/procedure", who: "HR" },
  { no: "22", cat: "Forced Labour", lvl: "2. ADVANCED", doc: "Contract with external hiring agency/labor agent/broker", who: "HR" },
  { no: "23", cat: "Forced Labour", lvl: "2. ADVANCED", doc: "Risk mapping and due diligence report", who: "HR" },
  { no: "24", cat: "Forced Labour", lvl: "2. ADVANCED", doc: "Proof of payment of fees associated with the contract (e.g, visas, transportation to country/province, repatriation, medical & in-transit)", who: "HR / Accounting" },
  { no: "25", cat: "Forced Labour", lvl: "2. ADVANCED", doc: "Training records / program documents or similar proofing pre-departure and post-arrival orientation", who: "HR / Accounting" },
  { no: "26", cat: "Forced Labour", lvl: "2. ADVANCED", doc: "Proof of payment of terminated migrant workers", who: "HR / Accounting" },
  { no: "27", cat: "Forced Labour", lvl: "2. ADVANCED", doc: "Contract, signed code of conduct, training documents informing Rank 2 suppliers on forced labor risk", who: "HR / Legal / Purchasing" },
  // Freedom of Association
  { no: "28", cat: "Freedom of Association", lvl: "1. CONSOLIDATED", doc: "List of Unions present in the company", who: "HR" },
  { no: "29", cat: "Freedom of Association", lvl: "1. CONSOLIDATED", doc: "Last agreement between Unions and Management", who: "HR" },
  { no: "30", cat: "Freedom of Association", lvl: "1. CONSOLIDATED", doc: "Last election documents for Union and workers representatives (preparation, candidates application, participation, results)", who: "HR" },
  { no: "31", cat: "Freedom of Association", lvl: "1. CONSOLIDATED", doc: "OSH commitee meeting schedule", who: "" },
  { no: "32", cat: "Freedom of Association", lvl: "2. ADVANCED", doc: "Meeting minutes between representatives and managements (OSH)", who: "" },
  { no: "33", cat: "Freedom of Association", lvl: "2. ADVANCED", doc: "Grievance procedure or policy", who: "MANAGEMENT" },
  { no: "34", cat: "Freedom of Association", lvl: "2. ADVANCED", doc: "Last two worker voice / worker happiness / engagement and wellbeing reports and corrective action plans", who: "MANAGEMENT" },
  // Legal Authorizations
  { no: "35", cat: "Legal Authorizations", lvl: "1. CONSOLIDATED", doc: "Factory License / Business License / National tax and land tax registration", who: "MANAGEMENT" },
  { no: "36", cat: "Legal Authorizations", lvl: "1. CONSOLIDATED", doc: "Fire department inspection certificate/ Local safety authority inspection report", who: "H&S" },
  { no: "37", cat: "Legal Authorizations", lvl: "1. CONSOLIDATED", doc: "Electrical maintenance and external inspection records", who: "H&S" },
  { no: "38", cat: "Legal Authorizations", lvl: "1. CONSOLIDATED", doc: "Forklift, lifts, automatics doors, boiler, compressors, pressurized tanks, crane… valid inspection certificates/reports", who: "H&S" },
  { no: "39", cat: "Legal Authorizations", lvl: "1. CONSOLIDATED", doc: "Licences (or Trainings) to operate the forklifts, lifts", who: "H&S" },
  { no: "40", cat: "Legal Authorizations", lvl: "2. ADVANCED", doc: "Expiry date alert for the legal authorization and certification", who: "H&S" },
  { no: "41", cat: "Legal Authorizations", lvl: "2. ADVANCED", doc: "Verification records and maintenance planning per equipment", who: "H&S" },
  { no: "42", cat: "Legal Authorizations", lvl: "2. ADVANCED", doc: "Preventive Maintenance plan and inspection records", who: "H&S" },
  // Risk & Safety
  { no: "43", cat: "Risk and Safety", lvl: "INFO / PREPA", doc: "List of pregnant / in maternity leave / breastfeeding workers", who: "H&S" },
  { no: "44", cat: "Risk and Safety", lvl: "0. UNACCEPTABLE", doc: "Stability certificate of buildings and infrastructure", who: "HR" },
  { no: "45", cat: "Risk and Safety", lvl: "0. UNACCEPTABLE", doc: "Written procedure to manage a worker during her pregnancy", who: "H&S" },
  { no: "46", cat: "Risk and Safety", lvl: "1. CONSOLIDATED", doc: "Temperature monitoring records", who: "H&S" },
  { no: "47", cat: "Risk and Safety", lvl: "1. CONSOLIDATED", doc: "Lighting monitoring records", who: "H&S" },
  { no: "48", cat: "Risk and Safety", lvl: "1. CONSOLIDATED", doc: "Air quality monitoring records", who: "" },
  { no: "49", cat: "Risk and Safety", lvl: "1. CONSOLIDATED", doc: "PPE list", who: "H&S" },
  { no: "50", cat: "Risk and Safety", lvl: "1. CONSOLIDATED", doc: "First aid kit list and expiry follow-up", who: "H&S" },
  { no: "51", cat: "Risk and Safety", lvl: "1. CONSOLIDATED", doc: "Workplace risk assessment with CAP actions", who: "H&S" },
  { no: "52", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Risk assessment showing preventive actions", who: "H&S" },
  { no: "53", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Lock out and tag out procedure for maintenance", who: "H&S" },
  { no: "54", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Records of injuries/accidents/illnesses & annual summary", who: "" },
  { no: "55", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Procedure/policy on injury and illness management", who: "" },
  { no: "56", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Noise measurement record (third party or internal)", who: "" },
  { no: "57", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Documents on H&S program (training records, schedule, awareness days, board/newsletter…)", who: "" },
  { no: "58", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Medical examination records, nursery records", who: "" },
  { no: "59", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "SOP on risky workstation", who: "" },
  { no: "60", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Health & safety committee records (agenda, participants, minutes)", who: "" },
  { no: "61", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Managers/supervisors/line leaders H&S training records", who: "" },
  { no: "62", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "First Aid Training records & list trained per shift", who: "" },
  { no: "63", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Clinic/first aid station doctor or nurse qualification certificate", who: "" },
  { no: "64", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Listing of vulnerable employees (disabled, pregnant, breastfeeding, young workers…)", who: "HR OR H&S" },
  { no: "65", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Formal emergency response plan for serious accidents/emergencies", who: "H&S" },
  { no: "66", cat: "Risk and Safety", lvl: "2. ADVANCED", doc: "Job description/certificates/CV of person responsible for H&S management", who: "" },
  { no: "67", cat: "Risk and Safety", lvl: "3. EXCELLENCE", doc: "Health & safety strategic plan/project", who: "H&S" },
  { no: "68", cat: "Risk and Safety", lvl: "3. EXCELLENCE", doc: "Third-party Certification of Health & Safety system", who: "H&S" },
  // Chemical
  { no: "70", cat: "Chemical Management", lvl: "0. UNACCEPTABLE", doc: "List for pregnant/breastfeeding women & pregnancy management procedure", who: "H&S" },
  { no: "71", cat: "Chemical Management", lvl: "0. UNACCEPTABLE", doc: "List of T/CMR present and used", who: "H&S" },
  { no: "72", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Inventory list of chemicals used", who: "H&S" },
  { no: "73", cat: "Chemical Management", lvl: "", doc: "Safety Data sheets of chemicals used", who: "" },
  { no: "74", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Follow up - Time management of PPE", who: "H&S" },
  { no: "75", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Procedure for collective protective equipment + maintenance reports", who: "" },
  { no: "76", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Internal air quality report for chemical areas", who: "H&S" },
  { no: "77", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Medical exam report", who: "H&S" },
  { no: "78", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "SOP for workstation using chemicals", who: "H&S" },
  { no: "79", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Emergency procedure related to chemical accidents", who: "H&S" },
  { no: "80", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Accidents record linked to chemicals", who: "H&S" },
  { no: "81", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Emergency exercises linked to chemical record", who: "" },
  { no: "82", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Procedure to validate chemicals to be purchased and rank chemicals used", who: "H&S" },
  { no: "83", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Chemical safety/storage manager job letter", who: "H&S" },
  { no: "84", cat: "Chemical Management", lvl: "2. ADVANCED", doc: "Training records on Chemicals", who: "H&S" },
  { no: "86", cat: "Chemical Management", lvl: "3. EXCELLENCE", doc: "Training records on Chemicals", who: "H&S" },
  // Fire Safety
  { no: "87", cat: "Fire Safety", lvl: "1. CONSOLIDATED", doc: "Fire Drill - Evacuation Records", who: "H&S" },
  { no: "88", cat: "Fire Safety", lvl: "1. CONSOLIDATED", doc: "Maintenance/Follow up Records of Alarm Backup Battery + manual book + working flow", who: "H&S" },
  { no: "89", cat: "Fire Safety", lvl: "1. CONSOLIDATED", doc: "Emergency Lighting System maintenance/follow up", who: "H&S" },
  { no: "90", cat: "Fire Safety", lvl: "1. CONSOLIDATED", doc: "Fire & smoke proof doors certification", who: "H&S" },
  { no: "91", cat: "Fire Safety", lvl: "1. CONSOLIDATED", doc: "Fire emergency procedure/protocol", who: "H&S" },
  { no: "92", cat: "Fire Safety", lvl: "2. ADVANCED", doc: "Updated evacuation map", who: "H&S" },
  { no: "93", cat: "Fire Safety", lvl: "2. ADVANCED", doc: "Maintenance records/certification of fire safety equipment", who: "H&S" },
  { no: "94", cat: "Fire Safety", lvl: "2. ADVANCED", doc: "Training records on basic fire safety", who: "H&S" },
  { no: "95", cat: "Fire Safety", lvl: "2. ADVANCED", doc: "Fire safety procedure (prevention, protection, precaution, emergency response)", who: "H&S" },
  { no: "96", cat: "Fire Safety", lvl: "2. ADVANCED", doc: "Training records on implementation + roles in emergency + list of special roles", who: "H&S" },
  { no: "97", cat: "Fire Safety", lvl: "2. ADVANCED", doc: "Job description/certificates/CV of responsible people for fire safety", who: "H&S" },
  { no: "98", cat: "Fire Safety", lvl: "2. ADVANCED", doc: "Fire fighting training records per shift (extinguishers, hydrants/hose, evacuation)", who: "H&S" },
  { no: "99", cat: "Fire Safety", lvl: "2. ADVANCED", doc: "Sprinkler system flow if necessary", who: "H&S" },
  // Living Env
  { no: "100", cat: "Living Environment", lvl: "1. CONSOLIDATED", doc: "Drinking water testing records", who: "H&S" },
  { no: "101", cat: "Living Environment", lvl: "1. CONSOLIDATED", doc: "Kitchen/canteen hygiene certificate", who: "H&S" },
  { no: "102", cat: "Living Environment", lvl: "1. CONSOLIDATED", doc: "Kitchen/canteen worker’s health certificate", who: "HR" },
  { no: "103", cat: "Living Environment", lvl: "1. CONSOLIDATED", doc: "Supplier Dormitory Guidelines (if dormitory)", who: "H&S" },
  { no: "104", cat: "Living Environment", lvl: "1. CONSOLIDATED", doc: "List of transportation routes and workers who benefit it", who: "" },
  { no: "105", cat: "Living Environment", lvl: "1. CONSOLIDATED", doc: "Check driving permit", who: "HR" },
  { no: "106", cat: "Living Environment", lvl: "2. ADVANCED", doc: "Official Document for Kinder garden", who: "H&S" },
  { no: "107", cat: "Living Environment", lvl: "2. ADVANCED", doc: "Check medical certificate of the drivers", who: "HR" },
  { no: "108", cat: "Living Environment", lvl: "2. ADVANCED", doc: "Records showing monthly room/board fees charged", who: "HR" },
  { no: "109", cat: "Living Environment", lvl: "2. ADVANCED", doc: "Vehicle maintenance plan/schedule + records/invoices", who: "MAINTENANCE" },
  { no: "110", cat: "Living Environment", lvl: "3. EXCELLENCE", doc: "Transportation allowance documents/equivalent value per worker", who: "HR" },
  { no: "111", cat: "Living Environment", lvl: "3. EXCELLENCE", doc: "Meal allowance documents/equivalent value per worker", who: "HR" },
  { no: "112", cat: "Living Environment", lvl: "3. EXCELLENCE", doc: "Official Document for Religion Facility", who: "HR" },
  { no: "113", cat: "Living Environment", lvl: "3. EXCELLENCE", doc: "Free dormitory / housing allowance documents", who: "HR" },
  // Working Hours
  { no: "114", cat: "Working Hours", lvl: "1. CONSOLIDATED", doc: "Working hour records + policy (breaks, operating hours, days off, OT policy)", who: "HR" },
  { no: "115", cat: "Working Hours", lvl: "1. CONSOLIDATED", doc: "Production planning (piece rate)", who: "MANAGEMENT" },
  { no: "116", cat: "Working Hours", lvl: "2. ADVANCED", doc: "Working hours policy", who: "HR" },
  { no: "117", cat: "Working Hours", lvl: "3. EXCELLENCE", doc: "Seasonal working hour planning + emergency plan", who: "HR" },
  // Compensation
  { no: "118", cat: "Compensation", lvl: "1. CONSOLIDATED", doc: "Payroll records/calculation + production records", who: "HR" },
  { no: "119", cat: "Compensation", lvl: "1. CONSOLIDATED", doc: "Local official minimum wage document", who: "HR" },
  { no: "120", cat: "Compensation", lvl: "1. CONSOLIDATED", doc: "Social Insurance payment slips", who: "HR" },
  { no: "121", cat: "Compensation", lvl: "1. CONSOLIDATED", doc: "Terminated employee list", who: "HR" },
  { no: "122", cat: "Compensation", lvl: "1. CONSOLIDATED", doc: "Wage deduction policy and records", who: "HR" },
  { no: "123", cat: "Compensation", lvl: "2. ADVANCED", doc: "Wage bonus policy and records", who: "HR" },
  { no: "124", cat: "Compensation", lvl: "2. ADVANCED", doc: "Salary matrix", who: "HR" },
  // HR Management
  { no: "125", cat: "HR Management", lvl: "INFO / PREPA", doc: "Number of men/women employed", who: "HR" },
  { no: "126", cat: "HR Management", lvl: "INFO / PREPA", doc: "Number of short term/temporary contract", who: "HR" },
  { no: "127", cat: "HR Management", lvl: "INFO / PREPA", doc: "Number employed by external company and roles", who: "HR" },
  { no: "128", cat: "HR Management", lvl: "1. CONSOLIDATED", doc: "In-house Regulations", who: "HR" },
  { no: "129", cat: "HR Management", lvl: "1. CONSOLIDATED", doc: "Local collective bargaining agreement (if any)", who: "HR" },
  { no: "130", cat: "HR Management", lvl: "1. CONSOLIDATED", doc: "All factory rules/regulations/policy + dormitory rules + bonus/penalty records", who: "HR" },
  { no: "131", cat: "HR Management", lvl: "1. CONSOLIDATED", doc: "All factory rules/regulations/policy + dormitory rules + bonus/penalty records", who: "HR" },
  { no: "132", cat: "HR Management", lvl: "1. CONSOLIDATED", doc: "Recruitment agency contract (if supplier is third party)", who: "HR" },
  { no: "133", cat: "HR Management", lvl: "1. CONSOLIDATED", doc: "Social insurance & health insurance compensation records", who: "HR" },
  { no: "134", cat: "HR Management", lvl: "1. CONSOLIDATED", doc: "Social insurance receipts", who: "HR" },
  { no: "135", cat: "HR Management", lvl: "1. CONSOLIDATED", doc: "List of short-term/temporary contracts + duration + renewals", who: "HR" },
  { no: "136", cat: "HR Management", lvl: "2. ADVANCED", doc: "Leave application/Resignation/Dismissal records", who: "HR" },
  { no: "137", cat: "HR Management", lvl: "2. ADVANCED", doc: "Severance/termination allowance policy and records", who: "HR" },
  { no: "138", cat: "HR Management", lvl: "2. ADVANCED", doc: "Disciplinary policies/procedures/notices/records + warning letters", who: "HR" },
  { no: "139", cat: "HR Management", lvl: "2. ADVANCED", doc: "List returning from maternity leave", who: "HR" },
  { no: "140", cat: "HR Management", lvl: "2. ADVANCED", doc: "Dismissal procedure", who: "HR" },
  { no: "141", cat: "HR Management", lvl: "2. ADVANCED", doc: "List & management policy for young workers", who: "HR" },
  { no: "142", cat: "HR Management", lvl: "2. ADVANCED", doc: "List & management policy for apprentice", who: "HR" },
  { no: "143", cat: "HR Management", lvl: "2. ADVANCED", doc: "List & management policy for pregnant and breastfeeding women", who: "HR" },
  { no: "144", cat: "HR Management", lvl: "2. ADVANCED", doc: "Employee training/communication/records", who: "HR" },
  { no: "145", cat: "HR Management", lvl: "2. ADVANCED", doc: "Human TO, accidents, absenteeism rate, sick-leave days", who: "HR" },
  { no: "146", cat: "HR Management", lvl: "2. ADVANCED", doc: "Annual leave records", who: "HR" },
  { no: "147", cat: "HR Management", lvl: "2. ADVANCED", doc: "Non-discrimination policy", who: "HR" },
  { no: "148", cat: "HR Management", lvl: "2. ADVANCED", doc: "Procedure against harassment and abuse", who: "HR" },
  { no: "149", cat: "HR Management", lvl: "3. EXCELLENCE", doc: "Equal opportunities & inclusion program evidence", who: "HR" },
  { no: "150", cat: "HR Management", lvl: "3. EXCELLENCE", doc: "Community investment program evidence", who: "HR" },
  // Management of SA
  { no: "M1", cat: "Management of SA", lvl: "0. UNACCEPTABLE", doc: "Decathlon MSA Contract signed (Appendix 1 showing production sites)", who: "MANAGEMENT" },
  { no: "151", cat: "Management of SA", lvl: "1. CONSOLIDATED", doc: "CAP follow-up meetings and records", who: "H&S/MANAGEMENT" },
  { no: "152", cat: "Management of SA", lvl: "1. CONSOLIDATED", doc: "Decathlon Code of Conduct (SIGNED)", who: "MANAGEMENT" },
  { no: "153", cat: "Management of SA", lvl: "2. ADVANCED", doc: "HRP internal assessment procedure", who: "MANAGEMENT" },
  { no: "154", cat: "Management of SA", lvl: "2. ADVANCED", doc: "Last self assessment report", who: "MANAGEMENT" },
  { no: "155", cat: "Management of SA", lvl: "2. ADVANCED", doc: "System details for regularly reviewing/updating/improving strategies", who: "MANAGEMENT" },
  { no: "156", cat: "Management of SA", lvl: "2. ADVANCED", doc: "List of service subcontractors on site + contracts + working hours + wages", who: "H&S/MANAGEMENT" },
  { no: "157", cat: "Management of SA", lvl: "2. ADVANCED", doc: "Supplier list of their suppliers involved Decathlon orders", who: "MANAGEMENT" },
  { no: "158", cat: "Management of SA", lvl: "2. ADVANCED", doc: "Policy of those supplier management (RANK2)", who: "MANAGEMENT" },
  { no: "159", cat: "Management of SA", lvl: "3. EXCELLENCE", doc: "Social sustainability strategy and targets", who: "MANAGEMENT" },
  { no: "160", cat: "Management of SA", lvl: "3. EXCELLENCE", doc: "Stakeholder initiatives participation evidence", who: "MANAGEMENT" },
  // Permits
  { no: "85", cat: "Permits Topics", lvl: "", doc: "Fire Safety Permit", who: "H&S" },
  { no: "86p", cat: "Permits Topics", lvl: "", doc: "Electrical Permit", who: "H&S" },
  { no: "87p", cat: "Permits Topics", lvl: "", doc: "Equipment Machinery (boiler, lift, etc…) Permit", who: "H&S" },
  { no: "88p", cat: "Permits Topics", lvl: "", doc: "Structural Integrity (Building / Occupancy)", who: "H&S" },
  { no: "89p", cat: "Permits Topics", lvl: "", doc: "License of hygiene parties", who: "H&S" },
  { no: "90p", cat: "Permits Topics", lvl: "", doc: "Air Emissions Permit", who: "H&S" },
  { no: "91p", cat: "Permits Topics", lvl: "", doc: "Water Source Permit", who: "H&S" },
  { no: "92p", cat: "Permits Topics", lvl: "", doc: "Solid Waste Permit", who: "H&S" },
  { no: "93p", cat: "Permits Topics", lvl: "", doc: "External Noise Permit", who: "H&S" },
  { no: "94p", cat: "Permits Topics", lvl: "", doc: "Industrial Wastewater Discharge Permit", who: "H&S" },
  { no: "95p", cat: "Permits Topics", lvl: "", doc: "Storm Water Discharge Permit", who: "H&S" },
  { no: "96p", cat: "Permits Topics", lvl: "", doc: "Hazardous Waste Permit", who: "H&S" }
];

// --- SANITIZATION HELPERS ---

export const normalizeChapter = (level: string | null): string => {
  if (!level) return "0.0";
  // Replace comma with dot (e.g. "1,3" -> "1.3")
  let clean = level.toString().replace(/,/g, '.').trim();
  // Ensure it looks like a version number
  if (!clean.includes('.')) clean += '.0';
  return clean;
};

export const getChapterNumber = (level: string | null): string => {
  const norm = normalizeChapter(level);
  return norm.split('.')[0];
};

export const sanitizeText = (text: string | null | undefined, fallback: string = ""): string => {
  if (!text) return fallback;
  const str = text.toString().trim();
  
  // Detect Excel formulas
  if (str.startsWith('=') || str.includes('=IF(') || str.includes('VLOOKUP') || str.includes('CONCAT')) {
    return fallback; // Return fallback if it looks like a formula
  }
  return str;
};

export const generateId = (req: Requirement) => {
  const chap = normalizeChapter(req.chapter_level);
  const textFragment = sanitizeText(req.requirement).substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
  return `${chap}::${textFragment}`;
};

export const initializeDocuments = (project: ProjectData): DocumentItem[] => {
  if (project.documents && project.documents.length > 0) return project.documents;
  
  return DOC_SEED_RAW.map(d => ({
    id: `DOC-${d.no}`,
    docNo: d.no,
    category: d.cat,
    level: d.lvl,
    documentName: d.doc,
    who: d.who,
    when_info: d.when || '',
    available: '',
    remarks: ''
  }));
};

// --- CSV PARSING ---

export const parseCSV = (csvText: string): any[] => {
  if (!csvText) return [];
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const parseLine = (text: string) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"') {
        inQuotes = !inQuotes;
      } else if (text[i] === ',' && !inQuotes) {
        let field = text.substring(start, i).trim();
        if (field.startsWith('"') && field.endsWith('"')) {
            field = field.substring(1, field.length - 1).replace(/""/g, '"');
        }
        result.push(field);
        start = i + 1;
      }
    }
    let lastField = text.substring(start).trim();
    if (lastField.startsWith('"') && lastField.endsWith('"')) {
        lastField = lastField.substring(1, lastField.length - 1).replace(/""/g, '"');
    }
    result.push(lastField);
    return result;
  };

  const headers = parseLine(lines[0]);
  
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    if (values.length === 1 && values[0] === '') continue;

    const row: any = {};
    headers.forEach((header, index) => {
        if (header) {
            row[header] = values[index] !== undefined ? values[index] : '';
        }
    });
    result.push(row);
  }
  return result;
};

// --- DATA MERGING ---

export const mergeRequirements = (master: Requirement[], responses: any[]): Requirement[] => {
  // Map responses by chapter and text approximation
  const responseMap = new Map<string, any>();
  responses.forEach(r => {
    const chap = normalizeChapter(r.chapter_level);
    const reqText = sanitizeText(r.requirement).substring(0, 30);
    const key = `${chap}::${reqText}`;
    responseMap.set(key, r);
  });

  return master.map(item => {
    const chap = normalizeChapter(item.chapter_level);
    // Sanitize the master requirement text immediately
    const cleanReq = sanitizeText(item.requirement, item.explanation || "Requirement text unavailable");
    const cleanExpl = sanitizeText(item.explanation, "");
    
    // Key generation for lookup
    const lookupKey = `${chap}::${cleanReq.substring(0, 30)}`;
    const resp = responseMap.get(lookupKey);
    
    const newItem: Requirement = {
      ...item,
      chapter_level: chap, // Use normalized chapter
      requirement: cleanReq, // Use sanitized text
      explanation: cleanExpl,
      id: generateId({ ...item, chapter_level: chap, requirement: cleanReq })
    };

    if (resp) {
      newItem.answer = sanitizeText(resp.answer);
      // Logic: Only accept valid compliance statuses
      const comp = sanitizeText(resp.complies);
      if (['OK', 'NOK', 'Not Assessed', 'Not Applicable', 'No but no risk'].includes(comp)) {
        newItem.complies = comp;
      } else {
        newItem.complies = ComplianceStatus.NOT_ASSESSED;
      }
      newItem.comments = sanitizeText(resp.comments);
    } else {
      newItem.complies = ComplianceStatus.NOT_ASSESSED;
    }
    
    return newItem;
  });
};

// --- CAP GENERATION (DETERMINISTIC) ---

const CAP_TEMPLATES: Record<string, { root: string, action: string, prevent: string }> = {
  "fire": {
    root: "Lack of regular maintenance or inspection of fire safety systems.",
    action: "Immediately repair/install equipment. Conduct full fire drill.",
    prevent: "Establish monthly inspection checklist and appoint Fire Safety Officer."
  },
  "chemical": {
    root: "Inadequate chemical management procedure or training.",
    action: "Provide secondary containment and PPE. Label all containers.",
    prevent: "Implement chemical inventory tracking and annual training program."
  },
  "wage": {
    root: "Payroll system calculation error or lack of awareness of legal minimums.",
    action: "Pay back arrears to affected workers immediately.",
    prevent: "Update payroll software parameters and audit monthly wage records."
  },
  "hour": {
    root: "Poor production planning leading to excessive overtime.",
    action: "Adjust production shifts. Guarantee 1 day off in 7.",
    prevent: "Implement capacity planning tool and strict OT authorization process."
  },
  "child": {
    root: "Ineffective recruitment age verification process.",
    action: "Remove child from work immediately, provide remediation/education support.",
    prevent: "Enhance age verification (ID check cross-reference) during hiring."
  },
  "default": {
    root: "Management system failure: Lack of policy or procedure implementation.",
    action: "Define and implement the missing procedure/process.",
    prevent: "Train responsible staff and conduct internal audits."
  }
};

const getCapTemplate = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('fire') || lower.includes('alarm') || lower.includes('exit')) return CAP_TEMPLATES.fire;
  if (lower.includes('chem') || lower.includes('toxic') || lower.includes('label')) return CAP_TEMPLATES.chemical;
  if (lower.includes('wage') || lower.includes('salary') || lower.includes('pay')) return CAP_TEMPLATES.wage;
  if (lower.includes('hour') || lower.includes('time') || lower.includes('overtime')) return CAP_TEMPLATES.hour;
  if (lower.includes('child') || lower.includes('age') || lower.includes('young')) return CAP_TEMPLATES.child;
  return CAP_TEMPLATES.default;
};

export const generateCapItems = (requirements: Requirement[]): CapItem[] => {
  return requirements
    .filter(r => {
        // Trigger CAP for NOK or "No but no risk"
        // Also trigger for "0. UNACCEPTABLE" if Not Assessed or Answer is No/Empty
        const isCritical = r.requirement_level.includes('0.');
        const isNOK = r.complies === ComplianceStatus.NOK;
        const isRisk = r.complies === ComplianceStatus.NO_BUT_NO_RISK;
        const criticalNotOk = isCritical && r.complies !== ComplianceStatus.OK && r.complies !== ComplianceStatus.NA;
        
        return isNOK || isRisk || criticalNotOk;
    })
    .map((r, index) => {
      let priority = 'Low';
      if (r.requirement_level.includes('0.')) priority = 'High (Immediate)';
      else if (r.requirement_level.includes('1.')) priority = 'Medium-High';
      else if (r.requirement_level.includes('2.')) priority = 'Medium';

      const template = getCapTemplate(r.requirement + " " + (r.explanation || ""));

      return {
        id: `CAP_${r.id}_${Date.now()}`,
        finding_id: r.chapter_level ? `${r.chapter_level}` : `Gen-${index}`,
        requirementId: r.id || '',
        chapter_level: normalizeChapter(r.chapter_level),
        requirement: r.requirement,
        level: r.requirement_level,
        status: 'Open',
        risk_explanation: `Non-compliance detected: ${r.complies || 'Not Assessed'}`,
        immediate_containment: '', // To be filled by user
        corrective_action: template.action,
        preventive_action: template.prevent,
        root_cause: template.root, // Added field
        owner: '',
        due_date: '',
        evidence_needed: 'Photo / Document / Policy',
        priority,
      };
    });
};

// --- SCORING & STATS ---

export const calculateGrade = (requirements: Requirement[], chapterFilter?: string): string => {
  const relevantReqs = chapterFilter 
    ? requirements.filter(r => r.chapter_level && r.chapter_level.startsWith(chapterFilter))
    : requirements;

  const countErrors = (levelStr: string) => 
    relevantReqs.filter(r => 
      r.requirement_level.includes(levelStr) && 
      (r.complies === ComplianceStatus.NOK)
    ).length;

  const E_count = countErrors('0.');
  const D_count = countErrors('1.');
  const C_count = countErrors('2.');
  const B_count = countErrors('3.');

  // Simplified Grading Logic
  if (E_count > 0) return 'E';
  if (D_count > 0) return 'D';
  if (C_count > 0) return 'C';
  if (B_count > 0) return 'B';
  return 'A';
};

export const getStats = (requirements: Requirement[]) => {
  const total = requirements.length;
  const ok = requirements.filter(r => r.complies === ComplianceStatus.OK).length;
  const nok = requirements.filter(r => r.complies === ComplianceStatus.NOK).length;
  const na = requirements.filter(r => r.complies === ComplianceStatus.NA).length;
  const notAssessed = requirements.filter(r => r.complies === ComplianceStatus.NOT_ASSESSED).length;
  
  return { total, ok, nok, na, notAssessed };
};