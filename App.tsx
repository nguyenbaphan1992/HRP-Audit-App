import React, { useState, useEffect } from 'react';
import { ProjectData, Requirement, ProjectMeta, CapItem, EvidencePhoto, ComplianceStatus, DocumentItem, DocumentEvidence } from './types';
import { saveProject, getProject } from './db';
import { parseCSV, mergeRequirements, generateCapItems, calculateGrade, getStats, generateId, CHAPTER_TITLES, getChapterNumber, normalizeChapter, initializeDocuments } from './utils';
import { exportToExcel } from './services/excelService';
import { exportFullPackage } from './services/zipService';
import { generatePDFReport } from './services/pdfService';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

// --- COMPONENTS ---

const Header = () => (
  <header className="bg-blue-800 text-white p-4 shadow-md no-print flex justify-between items-center">
    <h1 className="text-xl font-bold">HRP Audit Tool (Offline)</h1>
    <nav className="space-x-4 text-sm md:text-base">
      <Link to="/" className="hover:text-blue-200">Home</Link>
      <Link to="/checklist" className="hover:text-blue-200">Checklist</Link>
      <Link to="/documents" className="hover:text-blue-200">Documents</Link>
      <Link to="/pictures" className="hover:text-blue-200">Pictures</Link>
      <Link to="/cap" className="hover:text-blue-200">CAP</Link>
      <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
    </nav>
  </header>
);

const FileUpload = ({ label, onUpload, accept }: { label: string, onUpload: (content: string) => void, accept: string }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) onUpload(evt.target.result as string);
    };
    reader.readAsText(file);
  };
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="file" accept={accept} onChange={handleChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
    </div>
  );
};

// --- VIEWS ---

const HomeView = ({ project, setProject }: { project: ProjectData | null, setProject: (p: ProjectData) => void }) => {
  const [meta, setMeta] = useState<ProjectMeta>(project?.meta || { supplierName: '', site: '', date: new Date().toISOString().split('T')[0], assessor: '', brand: '', notes: '' });
  const navigate = useNavigate();

  const handleCreate = async () => {
    const newProject: ProjectData = {
      id: 'current',
      meta,
      requirements: [],
      photos: [],
      capItems: [],
      documents: [],
      docEvidence: []
    };
    // Initialize docs immediately
    newProject.documents = initializeDocuments(newProject);
    
    await saveProject(newProject);
    setProject(newProject);
    alert('Project initialized. Documents seeded. Please import checklist.');
  };

  const handleJsonImport = (jsonStr: string) => {
    if (!project) return;
    try {
      const data = JSON.parse(jsonStr);
      // Assume JSON structure has { requirements: [] } or is array
      const rawReqs: Requirement[] = Array.isArray(data) ? data : (data.requirements || []);
      
      // Clean and normalize during import
      const cleanReqs = rawReqs.map(r => ({
          ...r,
          chapter_level: normalizeChapter(r.chapter_level),
          id: generateId(r)
      }));

      const updated = { ...project, requirements: cleanReqs };
      setProject(updated);
      saveProject(updated);
      alert(`Imported ${cleanReqs.length} requirements.`);
    } catch (e) {
      console.error(e);
      alert('Invalid JSON');
    }
  };

  const handleCsvImport = (csvStr: string) => {
    if (!project) return;
    try {
      const rows = parseCSV(csvStr);
      const merged = mergeRequirements(project.requirements, rows);
      const updated = { ...project, requirements: merged };
      setProject(updated);
      saveProject(updated);
      alert('Merged CSV responses. Requirement status updated.');
    } catch (e) {
      console.error(e);
      alert('Error parsing CSV');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Project Setup</h2>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">1. Project Details</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input className="border p-2 rounded" placeholder="Supplier Name" value={meta.supplierName} onChange={e => setMeta({...meta, supplierName: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Site" value={meta.site} onChange={e => setMeta({...meta, site: e.target.value})} />
          <input className="border p-2 rounded" type="date" value={meta.date} onChange={e => setMeta({...meta, date: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Assessor" value={meta.assessor} onChange={e => setMeta({...meta, assessor: e.target.value})} />
        </div>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {project ? 'Update Metadata' : 'Start New Project'}
        </button>
      </div>

      {project && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">2. Import Data</h3>
          <FileUpload label="Import Master Checklist (JSON)" accept=".json" onUpload={handleJsonImport} />
          <FileUpload label="Import Responses (CSV) - Optional" accept=".csv" onUpload={handleCsvImport} />
          <div className="mt-4 text-right">
            <button onClick={() => navigate('/checklist')} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              Go to Checklist &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ChecklistView = ({ project, setProject }: { project: ProjectData | null, setProject: (p: ProjectData) => void }) => {
  const [selectedChapter, setSelectedChapter] = useState<string>('1');
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  
  if (!project) return <div className="p-4">Please create a project first.</div>;

  // Group chapters properly
  const chapterKeys = Object.keys(CHAPTER_TITLES).sort((a,b) => parseInt(a) - parseInt(b));

  const filteredReqs = project.requirements.filter(r => 
    getChapterNumber(r.chapter_level) === selectedChapter
  );

  const updateRequirement = (updates: Partial<Requirement>) => {
    if (!selectedReq) return;
    const updatedReqs = project.requirements.map(r => 
      r.id === selectedReq.id ? { ...r, ...updates } : r
    );
    const updatedProject = { ...project, requirements: updatedReqs };
    setProject(updatedProject);
    saveProject(updatedProject);
    setSelectedReq({ ...selectedReq, ...updates });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedReq || !e.target.files) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        const newPhoto: EvidencePhoto = {
          id: Date.now().toString(),
          requirementId: selectedReq.id!,
          chapter_level: selectedReq.chapter_level,
          file_name: file.name,
          caption: '',
          timestamp: Date.now(),
          data: evt.target.result as string
        };
        const updatedProject = { ...project, photos: [...project.photos, newPhoto] };
        setProject(updatedProject);
        saveProject(updatedProject);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 overflow-y-auto border-r p-2 no-print text-sm">
        <h3 className="font-bold mb-2 p-2 uppercase text-gray-500 text-xs">Chapters</h3>
        {chapterKeys.map(key => (
          <button 
            key={key}
            onClick={() => { setSelectedChapter(key); setSelectedReq(null); }}
            className={`block w-full text-left p-2 rounded mb-1 text-xs md:text-sm ${selectedChapter === key ? 'bg-blue-200 font-bold text-blue-900' : 'hover:bg-gray-200 text-gray-700'}`}
          >
            <span className="font-mono font-bold mr-1">{key}.</span> {CHAPTER_TITLES[key]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="w-1/3 bg-white overflow-y-auto border-r no-print">
        {filteredReqs.length === 0 && <div className="p-4 text-gray-400">No requirements in this chapter.</div>}
        {filteredReqs.map(req => (
          <div 
            key={req.id} 
            onClick={() => setSelectedReq(req)}
            className={`p-3 border-b cursor-pointer hover:bg-blue-50 ${selectedReq?.id === req.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-bold text-gray-500">{req.chapter_level}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
                req.complies === 'OK' ? 'bg-green-500' : 
                req.complies === 'NOK' ? 'bg-red-500' : 
                'bg-gray-400'
              }`}>
                {req.complies || 'NA'}
              </span>
            </div>
            <p className="text-sm line-clamp-2">{req.requirement}</p>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {selectedReq ? (
          <div>
            <div className="bg-white p-4 rounded shadow mb-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold">{selectedReq.chapter_level}</h2>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">{selectedReq.requirement_level}</span>
              </div>
              
              <p className="mb-4 text-gray-900 font-medium text-lg">{selectedReq.requirement}</p>
              
              {selectedReq.explanation && (
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded mb-4 border border-yellow-100">
                  <strong className="block mb-1 text-yellow-700">Guidance / Explanation:</strong>
                  {selectedReq.explanation}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Answer</label>
                  <select 
                    className="w-full border p-2 rounded"
                    value={selectedReq.answer || ''}
                    onChange={(e) => updateRequirement({ answer: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="Not Assessed">Not Assessed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Complies</label>
                  <select 
                    className={`w-full border p-2 rounded font-bold ${
                      selectedReq.complies === 'OK' ? 'text-green-600' : 
                      selectedReq.complies === 'NOK' ? 'text-red-600' : ''
                    }`}
                    value={selectedReq.complies || ''}
                    onChange={(e) => updateRequirement({ complies: e.target.value })}
                  >
                    <option value="Not Assessed">Not Assessed</option>
                    <option value="OK">OK</option>
                    <option value="NOK">NOK</option>
                    <option value="No but no risk">No but no risk</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Auditor Comments</label>
                <textarea 
                  className="w-full border p-2 rounded h-24"
                  value={selectedReq.comments || ''}
                  onChange={(e) => updateRequirement({ comments: e.target.value })}
                  placeholder="Enter findings details..."
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-4 flex justify-between items-center text-gray-700">
                <span>📸 Evidence Photos</span>
                <label className="bg-blue-600 text-white px-3 py-1 text-sm rounded cursor-pointer hover:bg-blue-700 flex items-center">
                  <span className="mr-1">+</span> Add Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.photos.filter(p => p.requirementId === selectedReq.id).map(photo => (
                  <div key={photo.id} className="border rounded p-2 relative bg-gray-50 group">
                    <div className="h-32 w-full bg-gray-200 mb-2 rounded overflow-hidden">
                        <img src={photo.data} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                    <input 
                      className="w-full text-xs border p-1 rounded mb-1" 
                      placeholder="Add caption..." 
                      value={photo.caption}
                      onChange={(e) => {
                        const updatedPhotos = project.photos.map(p => p.id === photo.id ? {...p, caption: e.target.value} : p);
                        setProject({...project, photos: updatedPhotos});
                        saveProject({...project, photos: updatedPhotos});
                      }}
                    />
                    <button 
                      onClick={() => {
                        if(confirm('Delete photo?')) {
                          const updatedPhotos = project.photos.filter(p => p.id !== photo.id);
                          setProject({...project, photos: updatedPhotos});
                          saveProject({...project, photos: updatedPhotos});
                        }
                      }}
                      className="text-red-500 text-xs w-full text-right hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {project.photos.filter(p => p.requirementId === selectedReq.id).length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-4 italic">No photos added yet.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 flex-col">
            <span className="text-4xl mb-2">👈</span>
            <span>Select a requirement from the list to audit</span>
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentView = ({ project, setProject }: { project: ProjectData | null, setProject: (p: ProjectData) => void }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('General');
    const [searchTerm, setSearchTerm] = useState('');

    if (!project) return <div>No project</div>;
    // Check and init documents if missing (migration)
    if (!project.documents || project.documents.length === 0) {
        const updated = { ...project, documents: initializeDocuments(project) };
        setProject(updated);
        saveProject(updated);
        return <div>Initializing Documents...</div>;
    }

    const categories = Array.from(new Set(project.documents.map(d => d.category)));

    const filteredDocs = project.documents.filter(d => 
        d.category === selectedCategory && 
        (d.documentName.toLowerCase().includes(searchTerm.toLowerCase()) || d.docNo.includes(searchTerm))
    );

    const updateDoc = (id: string, updates: Partial<DocumentItem>) => {
        const updatedDocs = project.documents.map(d => d.id === id ? { ...d, ...updates } : d);
        const updatedProject = { ...project, documents: updatedDocs };
        setProject(updatedProject);
        saveProject(updatedProject);
    };

    const handleFileUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) {
                const newEvidence: DocumentEvidence = {
                    id: `DE-${Date.now()}`,
                    docId: docId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    timestamp: Date.now(),
                    data: evt.target.result as string
                };
                const updatedEvidence = [...(project.docEvidence || []), newEvidence];
                const updatedProject = { ...project, docEvidence: updatedEvidence };
                setProject(updatedProject);
                saveProject(updatedProject);
            }
        };
        reader.readAsDataURL(file);
    };

    const removeEvidence = (evId: string) => {
        if(!confirm('Remove this file?')) return;
        const updatedEvidence = project.docEvidence.filter(e => e.id !== evId);
        const updatedProject = { ...project, docEvidence: updatedEvidence };
        setProject(updatedProject);
        saveProject(updatedProject);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar Categories */}
            <div className="w-1/5 bg-gray-100 overflow-y-auto border-r p-2 text-sm no-print">
                <input 
                    className="w-full p-2 mb-2 border rounded" 
                    placeholder="Search docs..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <h3 className="font-bold mb-2 uppercase text-gray-500 text-xs">Categories</h3>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`block w-full text-left p-2 rounded mb-1 ${selectedCategory === cat ? 'bg-blue-200 font-bold text-blue-900' : 'hover:bg-gray-200'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Main Table */}
            <div className="w-4/5 overflow-y-auto p-6 bg-white">
                <h2 className="text-xl font-bold mb-4">{selectedCategory} Documents</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="p-2 border">N°</th>
                                <th className="p-2 border w-1/3">Document / Info</th>
                                <th className="p-2 border">Who/When</th>
                                <th className="p-2 border w-24">Available</th>
                                <th className="p-2 border w-1/3">Remarks</th>
                                <th className="p-2 border">Evidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocs.map(doc => {
                                const evidenceList = project.docEvidence ? project.docEvidence.filter(e => e.docId === doc.id) : [];
                                return (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="p-2 border font-mono text-center">{doc.docNo}</td>
                                        <td className="p-2 border">
                                            <div className="font-bold text-gray-800">{doc.documentName}</div>
                                            <div className="text-xs text-gray-500 mt-1">{doc.level}</div>
                                        </td>
                                        <td className="p-2 border">
                                            <div className="text-xs"><span className="font-bold">Who:</span> {doc.who}</div>
                                            {doc.when_info && <div className="text-xs mt-1 text-gray-500 italic">{doc.when_info}</div>}
                                        </td>
                                        <td className="p-2 border">
                                            <select 
                                                className={`w-full p-1 border rounded ${doc.available === 'Yes' ? 'bg-green-50 text-green-700' : doc.available === 'No' ? 'bg-red-50 text-red-700' : ''}`}
                                                value={doc.available || ''}
                                                onChange={(e) => updateDoc(doc.id, { available: e.target.value as any })}
                                            >
                                                <option value="">Select...</option>
                                                <option value="Yes">Yes</option>
                                                <option value="Partial">Partial</option>
                                                <option value="No">No</option>
                                                <option value="N/A">N/A</option>
                                            </select>
                                        </td>
                                        <td className="p-2 border">
                                            <textarea 
                                                className="w-full p-1 border rounded text-xs h-16"
                                                value={doc.remarks}
                                                onChange={e => updateDoc(doc.id, { remarks: e.target.value })}
                                                placeholder="Auditor remarks..."
                                            />
                                        </td>
                                        <td className="p-2 border text-center">
                                            <div className="flex flex-col items-center">
                                                <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs mb-2">
                                                    📎 Upload
                                                    <input 
                                                        type="file" 
                                                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx" 
                                                        className="hidden" 
                                                        onChange={(e) => handleFileUpload(doc.id, e)}
                                                    />
                                                </label>
                                                <div className="space-y-1 w-full">
                                                    {evidenceList.map(ev => (
                                                        <div key={ev.id} className="flex items-center justify-between bg-gray-100 p-1 rounded text-xs">
                                                            <span className="truncate max-w-[80px]" title={ev.fileName}>
                                                                {ev.fileType.includes('image') ? '🖼️' : '📄'} {ev.fileName}
                                                            </span>
                                                            <button onClick={() => removeEvidence(ev.id)} className="text-red-500 hover:text-red-700">×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PictureLibraryView = ({ project, setProject }: { project: ProjectData | null, setProject: (p: ProjectData) => void }) => {
  const [filterChapter, setFilterChapter] = useState('');
  
  if (!project) return <div>No project.</div>;

  const chapterKeys = Object.keys(CHAPTER_TITLES).sort((a,b) => parseInt(a) - parseInt(b));
  
  const filteredPhotos = project.photos.filter(p => {
      if(!filterChapter) return true;
      const pChap = getChapterNumber(p.chapter_level);
      return pChap === filterChapter;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Picture Library ({filteredPhotos.length})</h2>
        <select className="border p-2 rounded" value={filterChapter} onChange={e => setFilterChapter(e.target.value)}>
          <option value="">All Chapters</option>
          {chapterKeys.map(key => <option key={key} value={key}>Chapter {key}: {CHAPTER_TITLES[key]}</option>)}
        </select>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredPhotos.map(photo => (
          <div key={photo.id} className="bg-white p-2 rounded shadow border">
             <div className="h-32 overflow-hidden mb-2 rounded bg-gray-100 flex items-center justify-center">
               <img src={photo.data} className="object-contain h-full w-full" alt="evidence"/>
             </div>
             <div className="text-xs font-bold text-gray-600 mb-1">{photo.chapter_level || 'General'}</div>
             <div className="text-xs text-gray-500 italic truncate mb-2">{photo.caption || 'No caption'}</div>
          </div>
        ))}
        {filteredPhotos.length === 0 && <p className="text-gray-500">No photos found matching filter.</p>}
      </div>
    </div>
  );
};

const CapView = ({ project, setProject }: { project: ProjectData | null, setProject: (p: ProjectData) => void }) => {
  if (!project) return <div>No project loaded.</div>;

  const generate = () => {
    const caps = generateCapItems(project.requirements);
    // Smart merge: preserve existing CAP edits if ID matches
    const mergedCaps = caps.map(newCap => {
      const existing = project.capItems.find(c => c.requirementId === newCap.requirementId);
      if (existing) {
          // Keep manual edits
          return { ...newCap, ...existing, risk_explanation: newCap.risk_explanation }; // Update explanation but keep actions
      }
      return newCap;
    });
    
    const updated = { ...project, capItems: mergedCaps };
    setProject(updated);
    saveProject(updated);
    alert(`Regenerated CAPs. Total items: ${mergedCaps.length}`);
  };

  const updateCap = (id: string, updates: Partial<CapItem>) => {
    const updatedCaps = project.capItems.map(c => c.id === id ? { ...c, ...updates } : c);
    const updatedProject = { ...project, capItems: updatedCaps };
    setProject(updatedProject);
    saveProject(updatedProject);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4 no-print items-center">
        <div>
            <h2 className="text-2xl font-bold">Corrective Action Plan</h2>
            <p className="text-sm text-gray-500">Auto-generated based on non-compliances (NOK / No but no risk)</p>
        </div>
        <button onClick={generate} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
            🔄 Regenerate CAPs
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow rounded text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="p-3 text-left">Ref</th>
              <th className="p-3 text-left w-64">Non-Compliance / Risk</th>
              <th className="p-3 text-left w-64">Root Cause</th>
              <th className="p-3 text-left w-64">Corrective Action</th>
              <th className="p-3 text-left w-64">Preventive Action</th>
              <th className="p-3 text-left">Owner</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {project.capItems.map(cap => (
              <tr key={cap.id} className="border-t hover:bg-gray-50 align-top">
                <td className="p-3 font-mono text-xs font-bold">{cap.finding_id}</td>
                <td className="p-3">
                    <div className="font-bold text-gray-800 mb-1">{cap.chapter_level}</div>
                    <div className="text-xs text-gray-600 line-clamp-3" title={cap.requirement}>{cap.requirement}</div>
                    <div className="mt-1 text-xs text-red-600 font-bold bg-red-50 inline-block px-1 rounded">{cap.priority}</div>
                </td>
                <td className="p-3">
                  <textarea 
                    className="w-full border p-1 rounded text-xs bg-gray-50 focus:bg-white" 
                    rows={4}
                    value={cap.root_cause || ''}
                    onChange={(e) => updateCap(cap.id, { root_cause: e.target.value })}
                    placeholder="Why did this happen?"
                  />
                </td>
                <td className="p-3">
                  <textarea 
                    className="w-full border p-1 rounded text-xs focus:ring-1 ring-blue-200" 
                    rows={4}
                    value={cap.corrective_action}
                    onChange={(e) => updateCap(cap.id, { corrective_action: e.target.value })}
                    placeholder="Immediate fix..."
                  />
                </td>
                <td className="p-3">
                  <textarea 
                    className="w-full border p-1 rounded text-xs focus:ring-1 ring-green-200" 
                    rows={4}
                    value={cap.preventive_action}
                    onChange={(e) => updateCap(cap.id, { preventive_action: e.target.value })}
                    placeholder="Long term fix..."
                  />
                </td>
                <td className="p-3">
                  <input 
                    className="w-full border p-1 rounded text-xs" 
                    value={cap.owner}
                    onChange={(e) => updateCap(cap.id, { owner: e.target.value })}
                  />
                </td>
                <td className="p-3">
                  <input 
                    type="date"
                    className="w-full border p-1 rounded text-xs" 
                    value={cap.due_date}
                    onChange={(e) => updateCap(cap.id, { due_date: e.target.value })}
                  />
                </td>
                <td className="p-3">
                    <select 
                        className="border p-1 rounded text-xs"
                        value={cap.status}
                        onChange={(e) => updateCap(cap.id, { status: e.target.value })}
                    >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                    </select>
                </td>
              </tr>
            ))}
            {project.capItems.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">No CAP items found. Click 'Regenerate CAPs' to analyze findings.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DashboardView = ({ project }: { project: ProjectData | null }) => {
  if (!project) return <div>No project loaded.</div>;
  const stats = getStats(project.requirements);
  const grade = calculateGrade(project.requirements);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Audit Dashboard</h2>
      
      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm font-bold uppercase">Total Requirements</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <div className="text-gray-500 text-sm font-bold uppercase">Compliant (OK)</div>
          <div className="text-3xl font-bold text-green-600">{stats.ok}</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
          <div className="text-gray-500 text-sm font-bold uppercase">Non-Compliant (NOK)</div>
          <div className="text-3xl font-bold text-red-600">{stats.nok}</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
          <div className="text-gray-500 text-sm font-bold uppercase">Global Grade</div>
          <div className="text-4xl font-bold text-purple-700">{grade}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-xl font-bold mb-4">Export Reports (Offline)</h3>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => generatePDFReport(project)}
            className="bg-red-600 text-white px-6 py-4 rounded shadow hover:bg-red-700 flex items-center transition-colors"
          >
            <span className="text-xl mr-2">📄</span> Download PDF Report (w/ Photos)
          </button>
          <button 
            onClick={() => exportToExcel(project)}
            className="bg-green-600 text-white px-6 py-4 rounded shadow hover:bg-green-700 flex items-center transition-colors"
          >
            <span className="text-xl mr-2">📊</span> Download Excel
          </button>
          <button 
            onClick={() => exportFullPackage(project)}
            className="bg-purple-600 text-white px-6 py-4 rounded shadow hover:bg-purple-700 flex items-center transition-colors"
          >
            <span className="text-xl mr-2">📦</span> Download Full Package (Zip)
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">* All reports are generated locally in your browser. No internet required.</p>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProject();
        if (data) setProject(data);
      } catch (e) {
        console.error('Failed to load project', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-500">Loading Offline Database...</div>;

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomeView project={project} setProject={setProject} />} />
            <Route path="/checklist" element={<ChecklistView project={project} setProject={setProject} />} />
            <Route path="/documents" element={<DocumentView project={project} setProject={setProject} />} />
            <Route path="/pictures" element={<PictureLibraryView project={project} setProject={setProject} />} />
            <Route path="/cap" element={<CapView project={project} setProject={setProject} />} />
            <Route path="/dashboard" element={<DashboardView project={project} />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;