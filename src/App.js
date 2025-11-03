


// ...existing Section component and export default...
import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./App.css";

// Background image URL for landing page (GitHub Pages friendly)
const BG_IMAGE_URL = `${process.env.PUBLIC_URL}/MNMS_bcgnd.png?v=2`;

// Define form sections and their fields
const sections = [
  {
    key: "studyDesign",
    title: "Study Design",
    fields: [
      { key: "startDate", label: "Start date of the in‑life phase" },
      { key: "endDate", label: "End date of the in‑life phase" }
    ]
  },
  {
    key: "outcomeMeasures",
    title: "Outcome Measures",
    fields: [
      { key: "measureName", label: "Outcome measure" },
      { key: "measureUnit", label: "Unit of measurement" }
    ]
  },
  {
    key: "experimentalAnimals",
    title: "Experimental Animals",
    fields: [
      { key: "animalId", label: "Unique animal identifier" },
      { key: "localId", label: "Local identifiers / other IDs" },
      { key: "species", label: "Species" },
      { key: "strainMGI", label: "Strain (MGI reference number)" },
      { key: "sex", label: "Sex" },
      { key: "transgenic", label: "Transgenic (yes/no)" },
      { key: "genotype", label: "Genotype information" },
      { key: "alleleInfo", label: "Allele information" },
      { key: "vendorSite", label: "Animal vendor (site & location)" },
      { key: "dob", label: "Date of birth" },
      { key: "developmentalStage", label: "Developmental stage" },
      { key: "weightStart", label: "Animal weight at start of experiment" },
      { key: "weightUnit", label: "Weight unit" },
      { key: "severityGrade", label: "Severity grade of manipulation" }
    ]
  },
  {
    key: "experimentalProcedures",
    title: "Experimental Procedures",
    fields: [
      { key: "testSubstanceName", label: "Test substance (common name)" },
      { key: "testSubstanceCAS", label: "Test substance (CAS number)" },
      { key: "doseValue", label: "Numerical dose" },
      { key: "doseUnit", label: "Dose unit" },
      { key: "vehicleComp", label: "Vehicle composition" },
      { key: "routeAdmin", label: "Route of administration" },
      { key: "adminMethod", label: "Administration method" }
    ]
  },
  {
    key: "housingHusbandry",
    title: "Housing & Husbandry",
    fields: [
      { key: "lightCycle", label: "Light cycle" },
      { key: "testingLocation", label: "Testing location / research site" },
      { key: "enrichment", label: "Enrichment" }
    ]
  }
];

function App() {
  // Calculate completeness scores and missing fields for each section
  function isValueMissing(val) {
    if (val === undefined || val === null) return true;
    const v = String(val).trim().toLowerCase();
    return v === "" || v === "na" || v === "-";
  }

  function getSectionCompleteness(section, data) {
    if (!section || !section.fields || !Array.isArray(section.fields)) {
      return { percent: 0, missing: [] };
    }
    const total = section.fields.length;
    let filled = 0;
    const missing = [];
    section.fields.forEach(f => {
      if (!isValueMissing(data && data[f.key])) {
        filled++;
      } else {
        missing.push(f.label);
      }
    });
    return {
      percent: total === 0 ? 100 : Math.round((filled / total) * 100),
      missing
    };
  }

  // Calculate global completeness
    function getGlobalCompleteness(subjectsArr = subjects) {
      let totalFields = 0;
      let filledFields = 0;
      if (!Array.isArray(sections)) return 0;
      sections.forEach(sec => {
        if (!sec || !sec.fields || !Array.isArray(sec.fields)) return;
        totalFields += sec.fields.length * subjectsArr.length;
        sec.fields.forEach(f => {
          subjectsArr.forEach(subj => {
            if (!isValueMissing(subj && subj[f.key])) {
              filledFields++;
            }
          });
        });
      });
      return totalFields === 0 ? 100 : Math.round((filledFields / totalFields) * 100);
    }
  // Support multiple subjects (rows)
  const [subjects, setSubjects] = useState([]); // Array of subject objects
  const [selectedSubject, setSelectedSubject] = useState(0); // For single-subject view fallback

  // Create and manage subjects (animals)
  const createEmptySubject = () => {
    const subj = {};
    sections.forEach(sec => {
      (sec.fields || []).forEach(f => {
        subj[f.key] = '';
      });
    });
    return subj;
  };

  const handleAddAnimal = () => {
    setSubjects(prev => {
      const next = [...prev, createEmptySubject()];
      return next;
    });
    setSelectedSubject(prev => Math.max(prev, subjects.length));
  };

  const handleDeleteAnimal = (index) => {
    setSubjects(prev => {
      const next = prev.filter((_, i) => i !== index);
      // adjust selected index relative to new length
      setSelectedSubject(sel => {
        if (sel > index) return sel - 1;
        if (sel >= next.length) return Math.max(0, next.length - 1);
        if (sel === index) return Math.max(0, sel - 1);
        return sel;
      });
      return next;
    });
  };

  // Import CSV/XLSX and populate formData
  // Mapping from template CSV headers to internal field keys
  const csvToFieldMap = {
    Unique_Animal_Identifier: "animalId",
    Local_Identifiers: "localId",
    Species: "species",
    Strain_ILAR_Name: "strainMGI",
    Strain_Short_Name: "strainShortName", // Not in form, can ignore or add
    Sex: "sex",
    Transgenic: "transgenic",
    Genotype_Information: "genotype",
    Allele_Information: "alleleInfo",
    Animal_Vendor: "vendorSite",
    Date_of_Birth: "dob",
    Developmental_Stage: "developmentalStage",
    Animal_Weight_at_Start: "weightStart",
    Weight_Unit: "weightUnit",
    Severity_Grade_of_Manipulation: "severityGrade",
    "In-life_Phase_Start_Date": "startDate",
    "In-life_Phase_End_Date": "endDate",
    Test_Substance_Common_Name: "testSubstanceName",
    Test_Substance_CAS_Number: "testSubstanceCAS",
    Numerical_Dose: "doseValue",
    Dose_Unit: "doseUnit",
    Vehicle_Composition: "vehicleComp",
    Route_of_Administration: "routeAdmin",
    Administration_Method: "adminMethod",
    Testing_Location: "testingLocation",
    Light_Cycle: "lightCycle",
    Enrichment: "enrichment",
    Outcome_Measure: "measureName",
    Value: "value", // Not in form, can ignore or add
    Unit_of_Measurement: "measureUnit"
  };

  const requiredHeaders = Object.keys(csvToFieldMap);

  const normalizeHeader = (h) => String(h || '')
    .replace(/^\uFEFF/, '') // strip BOM
    .trim();

  function validateHeaders(headers = []) {
    const normHeaders = headers.map(normalizeHeader);
    const req = requiredHeaders.map(normalizeHeader);
    const missing = req.filter(h => !normHeaders.includes(h));
    return { missing, ok: missing.length === 0 };
  }

  async function parseFile(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'csv') {
      const parsed = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => normalizeHeader(h),
          complete: (results) => resolve(results),
          error: (err) => reject(err)
        });
      });
      const rows = parsed.data || [];
      const headers = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields.map(normalizeHeader) : (rows.length > 0 ? Object.keys(rows[0]).map(normalizeHeader) : []);
      return { rows, headers };
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const headerRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const headers = Array.isArray(headerRows) && headerRows.length > 0 ? headerRows[0].map(normalizeHeader) : [];
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      // normalize keys on each row
      const rows = rawRows.map(obj => {
        const out = {};
        Object.entries(obj).forEach(([k, v]) => {
          out[normalizeHeader(k)] = v;
        });
        return out;
      });
      return { rows, headers };
    }
    throw new Error('Unsupported file type');
  }

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { rows, headers } = await parseFile(file);
      const { missing, ok } = validateHeaders(headers);
      if (!ok) {
        window.alert(`The selected file is missing required columns:\n\n${missing.join(', ')}`);
        return;
      }
      // Map template columns to internal field keys for each row
      const mappedRows = (rows || []).map(row => {
        const mapped = {};
        Object.entries(csvToFieldMap).forEach(([csvKey, fieldKey]) => {
          if (row[csvKey] !== undefined) {
            mapped[fieldKey] = row[csvKey];
          }
        });
        return mapped;
      });
      setSubjects(mappedRows);
      setSelectedSubject(0);
    } catch (err) {
      console.error(err);
      window.alert('Failed to import file. Please ensure it is a valid CSV/XLSX with the correct headers.');
    }
  };

  // Export current formData as CSV
  const handleExport = () => {
    // Prompt for filename
    let filename = window.prompt('Enter a file name for export (without extension):', 'mnms_export');
    if (!filename) return;
    if (!filename.endsWith('.csv')) filename += '.csv';
    // Use the same headers as the import template
    const exportHeaders = Object.keys(csvToFieldMap);
    // Build rows for all subjects
    const rows = subjects.map(subject => {
      const row = {};
      Object.entries(csvToFieldMap).forEach(([csvKey, fieldKey]) => {
        row[csvKey] = subject[fieldKey] || "";
      });
      return row;
    });
    const csv = Papa.unparse({
      fields: exportHeaders,
      data: rows
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, filename);
  };

  const handleExportXLSX = () => {
    let filename = window.prompt('Enter a file name for export (without extension):', 'mnms_export');
    if (!filename) return;
    if (!filename.endsWith('.xlsx')) filename += '.xlsx';
    const exportHeaders = Object.keys(csvToFieldMap);
    const rows = subjects.map(subject => {
      const row = {};
      Object.entries(csvToFieldMap).forEach(([csvKey, fieldKey]) => {
        row[csvKey] = subject[fieldKey] || "";
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows, { header: exportHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MNMS');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  };

  // Handle input changes
  // Edit a field for all or one subject
  const handleChange = (sectionKey, fieldKey, value, subjectIdx = null) => {
    setSubjects(prev => {
      if (subjectIdx === null) {
        // Edit all subjects
        return prev.map(subj => ({ ...subj, [fieldKey]: value }));
      } else {
        // Edit one subject
        return prev.map((subj, idx) => idx === subjectIdx ? { ...subj, [fieldKey]: value } : subj);
      }
    });
  };

  // Compute common and differing fields
  function getCommonFields() {
    if (subjects.length === 0) return {};
    const keys = Object.keys(subjects[0] || {});
    const common = {};
    keys.forEach(key => {
      const firstVal = subjects[0][key];
      if (subjects.every(subj => subj[key] === firstVal)) {
        common[key] = firstVal;
      }
    });
    return common;
  }

  function getDifferingFields() {
    if (subjects.length === 0) return [];
    const keys = Object.keys(subjects[0] || {});
    return keys.filter(key => {
      const firstVal = subjects[0][key];
      return !subjects.every(subj => subj[key] === firstVal);
    });
  }

  const commonFields = getCommonFields();
  const differingFields = getDifferingFields();

  return (
    <div
      className="app-container"
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '1800px',
        margin: '0 auto',
        boxSizing: 'border-box',
        background: subjects.length === 0
          ? `url(${BG_IMAGE_URL}) center center / cover no-repeat`
          : '#fff',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: subjects.length === 0 ? 'center' : 'flex-start',
      }}
    >
      <header style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent', boxShadow: 'none'}}>
        <h1 style={{marginBottom: 32, color: '#222', fontWeight: 700, fontSize: 36, letterSpacing: 1}}> </h1>
        {subjects.length === 0 ? (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300}}>
            <label htmlFor="file-upload" style={{
              display: 'inline-block',
              padding: '18px 48px',
              background: 'rgba(255,255,255,0.92)',
              color: '#222',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 20,
              boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
              cursor: 'pointer',
              border: '2px solid #1976d2',
              transition: 'background 0.2s, color 0.2s',
            }}>
              Browse CSV/XLSX File
              <input id="file-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileImport} style={{display: 'none'}} />
            </label>
            {/* <button onClick={handleAddAnimal} style={{marginTop: 16, padding: '14px 32px', borderRadius: 10, background: '#2e7d32', color: '#fff', fontWeight: 600, fontSize: 18, border: 'none', cursor: 'pointer'}}>
              Add Animal
            </button> */}
          </div>
        ) : (
          <div className="controls" style={{display: 'flex', gap: 16, marginBottom: 24}}>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileImport} />
            <button onClick={handleExport} disabled={subjects.length === 0} style={{padding: '10px 28px', borderRadius: 8, background: '#1976d2', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer'}}>Export CSV</button>
            <button onClick={handleExportXLSX} disabled={subjects.length === 0} style={{padding: '10px 28px', borderRadius: 8, background: '#2e7d32', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer'}}>Export XLSX</button>
            <button onClick={handleAddAnimal} style={{padding: '10px 28px', borderRadius: 8, background: '#555', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer'}}>Add Animal</button>
            <button onClick={() => handleDeleteAnimal(subjects.length - 1)} disabled={subjects.length === 0} style={{padding: '10px 28px', borderRadius: 8, background: '#b00020', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer'}}>Delete Animal</button>
          </div>
        )}
      </header>

      {subjects.length > 1 && (
        <>
          <div className="mnms-summary" style={{margin: '1em 0', padding: '1em', border: '1px solid #ccc', borderRadius: 8}}>
            <h2>MNMS Completeness Summary</h2>
            <div style={{marginTop: '1em', fontWeight: 'bold'}}>
              Global MNMS Score: {getGlobalCompleteness()}%{' '}
              <span style={{color: getGlobalCompleteness() >= 80 ? 'green' : getGlobalCompleteness() >= 50 ? 'orange' : 'red'}}>
                ({getGlobalCompleteness() >= 80 ? 'Good' : getGlobalCompleteness() >= 50 ? 'Average' : 'Bad'})
              </span>
            </div>
          </div>
          <div className="multi-summary" style={{margin: '1em 0', padding: '1em', border: '1px solid #ccc', borderRadius: 8}}>
            <h2>Multiple Subjects Detected</h2>
            {sections.map(sec => (
              <div key={sec.key} style={{marginBottom: '2em'}}>
                <h3 style={{marginBottom: 8}}>{sec.title}</h3>
                <div style={{overflowX: 'auto', width: '100%', paddingBottom: 8}}>
                  <table style={{borderCollapse: 'collapse', minWidth: Math.max(900, 180 + 180 * subjects.length), width: '100%'}}>
                    <thead>
                      <tr>
                        <th style={{
                          textAlign: 'left',
                          background: '#f8f8f8',
                          border: '1px solid #ccc',
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          minWidth: 180
                        }}>Field</th>
                        {subjects.map((_, idx) => (
                          <th key={idx} style={{
                            textAlign: 'center',
                            border: '1px solid #ccc',
                            minWidth: 160,
                            background: '#f8f8f8',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                          }}>
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
                              <span>Animal {idx + 1}</span>
                              <button onClick={() => handleDeleteAnimal(idx)} style={{background: '#b00020', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer'}} title="Delete this animal">Delete</button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.fields.map(f => (
                        <tr key={f.key}>
                          <td style={{fontWeight: 'bold', border: '1px solid #ccc', background: '#fafafa', minWidth: 180, position: 'sticky', left: 0, zIndex: 1}}>{f.label}</td>
                          {subjects.map((subj, idx) => (
                            <td key={idx} style={{border: '1px solid #ccc', minWidth: 160}}>
                              <input
                                type="text"
                                value={subj[f.key] || ''}
                                onChange={e => handleChange(sec.key, f.key, e.target.value, idx)}
                                style={isValueMissing(subj[f.key]) ? { border: '2px solid #b00', background: '#ffeaea' } : {}}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fallback: single subject or detailed edit for selected subject */}
      {subjects.length === 1 && (
        <>
          <div className="mnms-summary" style={{margin: '1em 0', padding: '1em', border: '1px solid #ccc', borderRadius: 8}}>
            <h2>MNMS Completeness Summary</h2>
            <ul>
              {sections.map(sec => {
                const comp = getSectionCompleteness(sec, subjects[0]);
                return (
                  <li key={sec.key} style={{marginBottom: '0.5em'}}>
                    <strong>{sec.title}:</strong> {comp.percent}% complete
                    {comp.missing.length > 0 && (
                      <span style={{color: '#b00', marginLeft: 8}}>
                        (Missing: {comp.missing.join(', ')})
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div style={{marginTop: '1em', fontWeight: 'bold'}}>
              Global MNMS Score: {getGlobalCompleteness([subjects[0]])}% {' '}
              <span style={{color: getGlobalCompleteness([subjects[0]]) >= 80 ? 'green' : getGlobalCompleteness([subjects[0]]) >= 50 ? 'orange' : 'red'}}>
                ({getGlobalCompleteness([subjects[0]]) >= 80 ? 'Good' : getGlobalCompleteness([subjects[0]]) >= 50 ? 'Average' : 'Bad'})
              </span>
            </div>
          </div>
          <div className="form-wizard">
            {sections.map(sec => {
              const missingKeys = sec.fields.filter(f => isValueMissing(subjects[0] && subjects[0][f.key])).map(f => f.key);
              return (
                <Section
                  key={sec.key}
                  section={sec}
                  data={subjects[0]}
                  onChange={(sectionKey, fieldKey, value) => handleChange(sectionKey, fieldKey, value, 0)}
                  missingKeys={missingKeys}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Section({ section, data, onChange, missingKeys = [] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="section">
      <h2 onClick={() => setOpen(o => !o)}>
        {section.title} {open ? "▼" : "▶"}
      </h2>
      {open && (
        <div className="fields">
          {section.fields.map(f => (
            <div className="field" key={f.key}>
              <label htmlFor={f.key}>{f.label}</label>
              <input
                id={f.key}
                type="text"
                value={data[f.key] || ""}
                onChange={e => onChange(section.key, f.key, e.target.value)}
                style={missingKeys.includes(f.key) ? { border: '2px solid #b00', background: '#ffeaea' } : {}}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
