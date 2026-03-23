import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { FaHourglassHalf, FaCheckCircle, FaBan, FaCalendarAlt, FaInfoCircle } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Status badge config (mirrored from AdminDashboard) ─────────
const STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  PENDING_APPROVAL: { label: "Pending Approval", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  APPROVED: { label: "Approved", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  PUBLISHED: { label: "Published", color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span style={{
      padding: "0.25rem 0.75rem",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}40`,
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem"
    }}>
      {status === "PENDING_APPROVAL" && <FaHourglassHalf size={10} />}
      {status === "APPROVED" && <FaCheckCircle size={10} />}
      {status === "REJECTED" && <FaBan size={10} />}
      {cfg.label}
    </span>
  );
};

export default function Timetable() {
  const [timetables, setTimetables] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editedTimetable, setEditedTimetable] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlotData, setEditingSlotData] = useState(null);
  
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const userRole = localStorage.getItem("role");
  const userDepartment = localStorage.getItem("department");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTimetables();
    fetchBatches();
  }, []);

  const fetchTimetables = async () => {
    try {
      const res = await fetch("/api/timetables", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      // Coordinator and Faculty see only their department's timetables
      const filtered = (userRole === "COORDINATOR" || userRole === "FACULTY")
        ? data.filter(t => t.department === userDepartment)
        : data;
      setTimetables(filtered);
      if (filtered.length > 0) setActiveBatch(filtered[0]._id);
    } catch (error) {
      console.error("Error fetching timetables:", error);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/batches", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      // Filter to coordinator's department
      const filtered = data.filter(b => b.department === userDepartment);
      setBatches(filtered);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const generateTimetable = async () => {
    if (!selectedBatch) {
      alert("Please select a batch to generate the timetable.");
      return;
    }
    setLoading(true);
    try {
      const body = {
        batchId: selectedBatch,
        department: userDepartment,
      };

      const res = await fetch("/api/timetables/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        fetchTimetables();
        alert("Timetable generated successfully! It is now pending admin approval.");
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error generating timetable:", error);
      alert("Failed to generate timetable.");
    } finally {
      setLoading(false);
    }
  };

  const deleteTimetable = async (id, name) => {
    if (!window.confirm(`Delete timetable "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/timetables/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // If deleted timetable was active, switch to next available
        if (activeBatch === id) setActiveBatch(null);
        fetchTimetables();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting timetable:", error);
      alert("Failed to delete timetable.");
    }
  };

  const handleEditClick = async () => {
    setIsEditing(true);
    setEditedTimetable(JSON.parse(JSON.stringify(currentTimetable))); // deep clone
    if (faculties.length === 0) fetchFaculties();
    if (subjects.length === 0) fetchSubjects();
    if (classrooms.length === 0) fetchClassrooms();
  };
  
  const fetchFaculties = async () => {
    try {
        const res = await fetch("/api/faculty", { headers: { "Authorization": `Bearer ${token}` }});
        const data = await res.json();
        setFaculties(data.filter(f => f.department === userDepartment || userRole === "ADMIN"));
    } catch(e) {}
  };
  const fetchSubjects = async () => {
    try {
        const res = await fetch("/api/subjects", { headers: { "Authorization": `Bearer ${token}` }});
        const data = await res.json();
        setSubjects(data);
    } catch(e) {}
  };
  const fetchClassrooms = async () => {
    try {
        const res = await fetch("/api/classrooms", { headers: { "Authorization": `Bearer ${token}` }});
        const data = await res.json();
        setClassrooms(data);
    } catch(e) {}
  };

  const saveTimetableChanges = async () => {
    setLoading(true);
    try {
      const scheduleForApi = editedTimetable.schedule.map(d => ({
        day: d.day,
        slots: d.slots.map(s => ({
          time: s.time,
          type: s.type,
          subject: s.subject?._id || s.subject || null,
          faculty: s.faculty?._id || s.faculty || null,
          classroom: s.classroom?._id || s.classroom || null
        }))
      }));

      const res = await fetch(`/api/timetables/${editedTimetable._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ schedule: scheduleForApi })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        setEditedTimetable(null);
        fetchTimetables();
        alert("Timetable updated successfully!");
      } else {
        if (data.conflicts && data.conflicts.length > 0) {
          alert(`⚠️ Scheduling conflicts detected:\n\n${data.conflicts.join("\n")}`);
        } else {
          alert("Error: " + data.message);
        }
      }
    } catch (error) {
      console.error("Error saving timetable:", error);
      alert("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const currentTimetable = timetables.find(t => t._id === activeBatch);
  const displayTimetable = isEditing ? editedTimetable : currentTimetable;
  const selectedBatchObj = batches.find(b => b._id === selectedBatch);

  const exportToExcel = () => {
    if (!currentTimetable) return;

    // Build a unified set of all time slots from all days
    const allTimes = [];
    const seenTimes = new Set();
    currentTimetable.schedule.forEach(daySch => {
      daySch.slots.forEach(slot => {
        if (!seenTimes.has(slot.time)) {
          seenTimes.add(slot.time);
          allTimes.push(slot.time);
        }
      });
    });
    allTimes.sort();

    const days = currentTimetable.schedule.map(d => d.day);

    // Build lookup: day → time → slot
    const slotMap = {};
    currentTimetable.schedule.forEach(daySch => {
      slotMap[daySch.day] = {};
      daySch.slots.forEach(slot => {
        slotMap[daySch.day][slot.time] = slot;
      });
    });

    // Prepare data for Excel
    const headerRow = ["Time", ...days];
    const dataRows = allTimes.map(time => {
      const row = [time];
      days.forEach(day => {
        const slot = slotMap[day]?.[time];
        if (!slot) {
          row.push("-");
        } else if (slot.type === "Break" || slot.type === "Lunch") {
          row.push(slot.type === "Lunch" ? "Lunch Break" : "Break");
        } else if (slot.type === "Free") {
          row.push("-");
        } else if (slot.subject) {
          const subjectName = slot.subject.name || "";
          const subjectCode = slot.subject.codes?.[0] || "";
          const faculty = slot.faculty?.name || "";
          const classroom = slot.classroom?.name || "";
          let cellText = `${subjectName}`;
          if (subjectCode) cellText += `\n(${subjectCode})`;
          if (faculty) cellText += `\n${faculty}`;
          if (classroom) cellText += `\n${classroom}`;
          row.push(cellText);
        } else {
          row.push("-");
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    
    // Set some column widths
    const colWidths = [{ wch: 15 }]; // Time column
    days.forEach(() => colWidths.push({ wch: 25 }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");

    // Generate filename
    const filename = `${currentTimetable.name}_${currentTimetable.department || "Dept"}.xlsx`.replace(/[^a-z0-9_.-]/gi, '_');
    XLSX.writeFile(workbook, filename);
  };

  const exportToPDF = () => {
    if (!currentTimetable) return;

    const doc = new jsPDF("landscape", "pt", "a4");

    // Build a unified set of all time slots from all days
    const allTimes = [];
    const seenTimes = new Set();
    currentTimetable.schedule.forEach(daySch => {
      daySch.slots.forEach(slot => {
        if (!seenTimes.has(slot.time)) {
          seenTimes.add(slot.time);
          allTimes.push(slot.time);
        }
      });
    });
    allTimes.sort();

    const days = currentTimetable.schedule.map(d => d.day);

    // Build lookup: day → time → slot
    const slotMap = {};
    currentTimetable.schedule.forEach(daySch => {
      slotMap[daySch.day] = {};
      daySch.slots.forEach(slot => {
        slotMap[daySch.day][slot.time] = slot;
      });
    });

    const headerRow = ["Time", ...days];
    const dataRows = allTimes.map(time => {
      const row = [time];
      days.forEach(day => {
        const slot = slotMap[day]?.[time];
        if (!slot) {
          row.push("-");
        } else if (slot.type === "Break" || slot.type === "Lunch") {
          row.push(slot.type === "Lunch" ? "Lunch Break" : "Break");
        } else if (slot.type === "Free") {
          row.push("-");
        } else if (slot.subject) {
          const subjectName = slot.subject.name || "";
          const subjectCode = slot.subject.codes?.[0] || "";
          const faculty = slot.faculty?.name || "";
          const classroom = slot.classroom?.name || "";
          let cellText = `${subjectName}`;
          if (subjectCode) cellText += `\n(${subjectCode})`;
          if (faculty) cellText += `\n${faculty}`;
          if (classroom) cellText += `\n${classroom}`;
          row.push(cellText);
        } else {
          row.push("-");
        }
      });
      return row;
    });

    // Generate filename
    const filename = `${currentTimetable.name}_${currentTimetable.department || "Dept"}.pdf`.replace(/[^a-z0-9_.-]/gi, '_');

    doc.setFontSize(16);
    doc.text(`${currentTimetable.name} - ${currentTimetable.department || "Department"}`, 40, 40);
    
    autoTable(doc, {
      head: [headerRow],
      body: dataRows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 6, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', fillColor: [248, 250, 252] }
      }
    });

    doc.save(filename);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Timetables</h1>
        </header>

        {/* Coordinator: Batch + Generate Panel */}
        {userRole === "COORDINATOR" && (
          <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Generate Timetable</h2>

            {userDepartment && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 1rem",
                background: "rgba(79, 70, 229, 0.1)",
                borderRadius: "20px",
                color: "#818cf8",
                marginBottom: "1rem",
                fontSize: "0.9rem"
              }}>
                Department: <strong>{userDepartment}</strong>
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Select Batch
                </label>
                <select
                  className="input-field"
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                  style={{ margin: 0 }}
                >
                  <option value="">-- Select a Batch --</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b.semester ? `• Sem ${b.semester}` : ""} {b.section ? `• Sec ${b.section}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBatchObj && (
                <div style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)"
                }}>
                  <div><strong>Batch:</strong> {selectedBatchObj.name}</div>
                  {selectedBatchObj.semester && <div><strong>Semester:</strong> {selectedBatchObj.semester}</div>}
                  {selectedBatchObj.section && <div><strong>Section:</strong> {selectedBatchObj.section}</div>}
                  <div><strong>Students:</strong> {selectedBatchObj.studentsCount}</div>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={generateTimetable}
                disabled={loading || !selectedBatch}
                style={{ padding: "0.75rem 1.5rem", whiteSpace: "nowrap" }}
              >
                {loading ? "Generating..." : "🗓 Generate Timetable"}
              </button>
            </div>

            {batches.length === 0 && (
              <p style={{ color: "var(--text-muted)", marginTop: "1rem", fontSize: "0.9rem" }}>
                ⚠ No batches found for your department ({userDepartment}). Ask an admin to add batches.
              </p>
            )}
          </div>
        )}



        {/* Timetable Viewer */}
        {timetables.length === 0 ? (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>
              {userRole === "COORDINATOR"
                ? 'No timetables found. Select a batch and click "Generate Timetable".'
                : "No timetables have been generated yet."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Batch Selector Tabs */}
            <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
              {timetables.map(t => (
                <div key={t._id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => setActiveBatch(t._id)}
                    style={{
                      background: activeBatch === t._id ? "var(--primary)" : "var(--glass-border)",
                      color: activeBatch === t._id ? "white" : "var(--text-main)",
                      padding: "0.5rem 1.2rem",
                      borderRadius: "20px",
                      border: activeBatch === t._id ? "none" : "1px solid var(--glass-border)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontSize: "0.875rem",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    {t.name} {t.semester ? `· Sem ${t.semester}` : ""}
                    {(userRole === "COORDINATOR" || userRole === "ADMIN") && (
                      <span style={{ 
                        fontSize: "10px", 
                        opacity: 0.8,
                        background: "rgba(0,0,0,0.2)",
                        padding: "2px 6px",
                        borderRadius: "10px"
                      }}>
                        {t.status === "APPROVED" ? "✓" : t.status === "REJECTED" ? "×" : "..."}
                      </span>
                    )}
                  </button>
                  {/* Delete button — coordinators & admins only */}
                  {(userRole === "COORDINATOR" || userRole === "ADMIN") && (
                    <button
                      onClick={() => deleteTimetable(t._id, t.name)}
                      title="Delete timetable"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        color: "#f87171",
                        borderRadius: "50%",
                        width: "26px",
                        height: "26px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        flexShrink: 0,
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Timetable Grid */}
            {displayTimetable && (() => {
              // Build a unified set of all time slots from all days
              const allTimes = [];
              const seenTimes = new Set();
              displayTimetable.schedule.forEach(daySch => {
                daySch.slots.forEach(slot => {
                  if (!seenTimes.has(slot.time)) {
                    seenTimes.add(slot.time);
                    allTimes.push(slot.time);
                  }
                });
              });
              allTimes.sort();

              const days = displayTimetable.schedule.map(d => d.day);

              // Build lookup: day → time → slot
              const slotMap = {};
              displayTimetable.schedule.forEach(daySch => {
                slotMap[daySch.day] = {};
                daySch.slots.forEach(slot => {
                  slotMap[daySch.day][slot.time] = slot;
                });
              });

              const cellColor = (slot) => {
                if (!slot) return { bg: "transparent", border: "var(--glass-border)" };
                if (slot.type === "Break" || slot.type === "Lunch") return { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.3)" };
                if (slot.type === "Free") return { bg: "transparent", border: "var(--glass-border)" };
                if (slot.type === "Lab") return { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" };
                return { bg: "rgba(79,70,229,0.18)", border: "rgba(79,70,229,0.35)" };
              };

              return (
                <div className="glass-panel" style={{ padding: "1.5rem", overflowX: "auto" }}>
                  {/* Header */}
                  <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <h2 style={{ marginTop: 0, marginBottom: "0.25rem" }}>{currentTimetable.name}</h2>
                      <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
                        {currentTimetable.department} &nbsp;•&nbsp; Semester {currentTimetable.semester}
                        {currentTimetable.section ? ` • Section ${currentTimetable.section}` : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {displayTimetable.status === "APPROVED" && !isEditing && (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={exportToExcel}
                              style={{
                                padding: "0.4rem 0.8rem",
                                borderRadius: "20px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#10b981",
                                background: "rgba(16,185,129,0.12)",
                                border: "1px solid rgba(16,185,129,0.4)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.2)"}
                              onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.12)"}
                              title="Export to Excel"
                            >
                              ⬇ Excel
                            </button>
                            <button
                              onClick={exportToPDF}
                              style={{
                                padding: "0.4rem 0.8rem",
                                borderRadius: "20px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#ef4444",
                                background: "rgba(239,68,68,0.12)",
                                border: "1px solid rgba(239,68,68,0.4)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                              title="Export to PDF"
                            >
                              ⬇ PDF
                            </button>
                          </div>
                        )}
                        {(userRole === "COORDINATOR" || userRole === "ADMIN") && !isEditing && (
                          <button
                            onClick={handleEditClick}
                            style={{
                              padding: "0.4rem 0.8rem",
                              borderRadius: "20px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "var(--primary)",
                              background: "var(--glass-border)",
                              border: "1px solid rgba(79,70,229,0.4)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(79,70,229,0.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = "var(--glass-border)"}
                            title="Edit Timetable"
                          >
                            ✏ Edit
                          </button>
                        )}
                        {isEditing && (
                           <>
                             <button
                               onClick={() => {setIsEditing(false); setEditedTimetable(null);}}
                               className="btn-secondary"
                               style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                             >
                               Cancel
                             </button>
                             <button
                               onClick={saveTimetableChanges}
                               className="btn-primary"
                               style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                               disabled={loading}
                             >
                               {loading ? "Saving..." : "💾 Save Changes"}
                             </button>
                           </>
                        )}
                        {(userRole === "COORDINATOR" || userRole === "ADMIN") && !isEditing && (
                          <StatusBadge status={displayTimetable.status} />
                        )}
                      </div>
                      {(userRole === "COORDINATOR" || userRole === "ADMIN") && displayTimetable.status === "REJECTED" && displayTimetable.rejectionReason && (
                        <div style={{ 
                          marginTop: "0.75rem", 
                          padding: "0.75rem 1rem", 
                          background: "rgba(239, 68, 68, 0.1)", 
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: "8px",
                          color: "#ef4444",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.6rem",
                          maxWidth: "300px"
                        }}>
                          <FaInfoCircle style={{ marginTop: "2px", flexShrink: 0 }} />
                          <div>
                              <strong>Rejection Reason:</strong>
                              <div style={{ opacity: 0.9, marginTop: "2px" }}>{currentTimetable.rejectionReason}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    {[
                      { label: "Lecture",      bg: "rgba(79,70,229,0.18)",    border: "rgba(79,70,229,0.35)" },
                      { label: "Lab",          bg: "rgba(16,185,129,0.15)",   border: "rgba(16,185,129,0.3)" },
                      { label: "Break/Lunch",  bg: "rgba(234,179,8,0.15)",    border: "rgba(234,179,8,0.3)" },

                    ].map(({ label, bg, border }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <div style={{ width: 14, height: 14, background: bg, border: `1px solid ${border}`, borderRadius: 3 }} />
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px", minWidth: `${days.length * 140 + 110}px` }}>
                      <thead>
                        <tr>
                          <th style={{
                            padding: "0.6rem 1rem",
                            textAlign: "left",
                            background: "var(--glass-border)",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                            whiteSpace: "nowrap"
                          }}>
                            Time
                          </th>
                          {days.map(day => (
                            <th key={day} style={{
                              padding: "0.6rem 1rem",
                              textAlign: "center",
                              background: "rgba(79,70,229,0.2)",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "var(--primary)",
                              whiteSpace: "nowrap"
                            }}>
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allTimes.map(time => (
                          <tr key={time}>
                            <td style={{
                              padding: "0.5rem 0.75rem",
                              fontSize: "0.78rem",
                              color: "var(--text-muted)",
                              whiteSpace: "nowrap",
                              background: "var(--glass-border)",
                              borderRadius: "6px",
                              fontWeight: 500
                            }}>
                              {time}
                            </td>
                            {days.map(day => {
                              const slot = slotMap[day]?.[time];
                              const isBreak = slot?.type === "Break" || slot?.type === "Lunch";
                              const isFree  = slot?.type === "Free";
                              const colors = cellColor(slot);
                              return (
                                <td key={day} style={{ padding: "2px" }}>
                                  <div
                                    onClick={() => {
                                      if (isEditing) {
                                        setEditingSlotData({
                                          day,
                                          time,
                                          slot: JSON.parse(JSON.stringify(slot || { type: "Free", time }))
                                        });
                                        setShowSlotModal(true);
                                      }
                                    }}
                                    style={{
                                    background: colors.bg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: "6px",
                                    padding: "0.5rem 0.625rem",
                                    minHeight: "62px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    gap: "2px",
                                    cursor: isEditing ? "pointer" : "default"
                                  }}>
                                    {isBreak ? (
                                      <span style={{ fontSize: "0.75rem", color: "var(--secondary)", fontWeight: 600, textAlign: "center" }}>
                                        {slot.type === "Lunch" ? "🍽" : "☕"} {slot.type === "Lunch" ? "Lunch Break" : "Break"}
                                      </span>
                                    ) : isFree ? (
                                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", opacity: 0.5, textAlign: "center" }}>—</span>
                                    ) : slot?.subject ? (
                                      <>
                                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.2 }}>
                                          {slot.subject?.name || "—"}
                                        </div>
                                        {slot.subject?.codes?.[0] && (
                                          <div style={{ fontSize: "0.68rem", color: "var(--primary)", fontWeight: 500 }}>
                                            {slot.subject.codes[0]}
                                          </div>
                                        )}
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                          👤 {slot.faculty?.name || "—"}
                                        </div>
                                        {slot.classroom?.name && (
                                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", opacity: 0.8 }}>
                                            🏛 {slot.classroom.name}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", opacity: 0.5, textAlign: "center" }}>—</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Edit Slot Modal */}
        {showSlotModal && editingSlotData && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
          }}>
            <div className="glass-panel" style={{ padding: "2.5rem", width: "450px", maxWidth: "90%" }}>
              <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Edit Slot: {editingSlotData.day} {editingSlotData.time}</h3>
              
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>Type</label>
                <select 
                  className="input-field" 
                  value={editingSlotData.slot.type || "Free"}
                  onChange={e => setEditingSlotData({...editingSlotData, slot: {...editingSlotData.slot, type: e.target.value}})}
                  style={{ width: "100%", margin: 0 }}
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Lab">Lab</option>
                  <option value="Break">Break</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Free">Free</option>
                </select>
              </div>

              {(editingSlotData.slot.type === "Lecture" || editingSlotData.slot.type === "Lab") && (
                <>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>Subject</label>
                    <select 
                      className="input-field" 
                      value={editingSlotData.slot.subject?._id || editingSlotData.slot.subject || ""}
                      onChange={e => {
                        const sub = subjects.find(s => s._id === e.target.value);
                        setEditingSlotData({...editingSlotData, slot: {...editingSlotData.slot, subject: sub || null}});
                      }}
                      style={{ width: "100%", margin: 0 }}
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.codes?.[0]})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>Faculty</label>
                    <select 
                      className="input-field" 
                      value={editingSlotData.slot.faculty?._id || editingSlotData.slot.faculty || ""}
                      onChange={e => {
                        const fac = faculties.find(f => f._id === e.target.value);
                        setEditingSlotData({...editingSlotData, slot: {...editingSlotData.slot, faculty: fac || null}});
                      }}
                      style={{ width: "100%", margin: 0 }}
                    >
                      <option value="">-- Select Faculty --</option>
                      {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>Classroom</label>
                    <select 
                      className="input-field" 
                      value={editingSlotData.slot.classroom?._id || editingSlotData.slot.classroom || ""}
                      onChange={e => {
                        const room = classrooms.find(c => c._id === e.target.value);
                        setEditingSlotData({...editingSlotData, slot: {...editingSlotData.slot, classroom: room || null}});
                      }}
                      style={{ width: "100%", margin: 0 }}
                    >
                      <option value="">-- Select Classroom --</option>
                      {classrooms.map(c => <option key={c._id} value={c._id}>{c.name} ({c.capacity})</option>)}
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button className="btn-secondary" onClick={() => setShowSlotModal(false)} style={{ padding: "0.6rem 1.2rem" }}>Cancel</button>
                <button className="btn-primary" onClick={() => {
                  // Save slot back to editedTimetable
                  const updatedData = { ...editedTimetable };
                  const dayObj = updatedData.schedule.find(d => d.day === editingSlotData.day);
                  if (dayObj) {
                    const slotIndex = dayObj.slots.findIndex(s => s.time === editingSlotData.time);
                    if (slotIndex >= 0) {
                      dayObj.slots[slotIndex] = editingSlotData.slot;
                    } else {
                      dayObj.slots.push(editingSlotData.slot);
                    }
                  } else {
                    updatedData.schedule.push({ day: editingSlotData.day, slots: [editingSlotData.slot] });
                  }
                  
                  // Sort slots by time (simple localeCompare covers HH:MM nicely)
                  if (dayObj) {
                    dayObj.slots.sort((a,b) => a.time.localeCompare(b.time));
                  }
                  
                  setEditedTimetable(updatedData);
                  setShowSlotModal(false);
                }} style={{ padding: "0.6rem 1.2rem" }}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
