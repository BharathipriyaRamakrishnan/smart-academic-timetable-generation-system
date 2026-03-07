import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Settings() {
    const [settings, setSettings] = useState({
        workingDays: 6,
        startTime: "08:45",
        endTime: "16:25",
        periodDuration: 50,
        morningBreak: { startTime: "10:25", endTime: "10:40" },
        lunchBreak:   { startTime: "12:20", endTime: "13:30" },
        eveningBreak: { startTime: "15:10", endTime: "15:25" },
        breaks: [],
        maxClassesPerWeek: 18,
        maxClassesPerDayFaculty: 4,
        maxClassesPerDayBatch: 6,
        maxSubjectRepeatPerDay: 2,
        maxContinuousClasses: 3,
        labMinDuration: 2,
        sharedFaculty: false
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            if (data) setSettings(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setSettings({
                ...settings,
                [parent]: { ...settings[parent], [child]: value }
            });
        } else {
            setSettings({
                ...settings,
                [name]: type === "checkbox" ? checked : value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setMessage("Settings updated successfully!");
                setTimeout(() => setMessage(""), 3000);
            } else {
                setMessage("Failed to update settings.");
            }
        } catch (error) {
            console.error("Error updating settings:", error);
            setMessage("Error updating settings.");
        }
    };

    const sectionStyle = {
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        paddingBottom: "1.5rem",
        marginBottom: "0.25rem"
    };

    const sectionLabel = {
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#818cf8",
        marginBottom: "1rem"
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Global Settings</h1>
                </header>

                <div className="glass-panel" style={{ padding: "2rem", maxWidth: "860px", margin: "0 auto" }}>
                    {loading ? <p>Loading…</p> : (
                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.75rem" }}>

                            {/* ── Section: College Hours ── */}
                            <div style={sectionStyle}>
                                <p style={sectionLabel}>🏫 College Hours</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                                    <div>
                                        <label className="label">Working Days / Week</label>
                                        <input className="input-field" type="number" name="workingDays"
                                            value={settings.workingDays} onChange={handleChange}
                                            min="1" max="7" required />
                                        <small style={{ color: "var(--text-muted)" }}>6 = Mon–Sat</small>
                                    </div>
                                    <div>
                                        <label className="label">Start Time</label>
                                        <input className="input-field" type="time" name="startTime"
                                            value={settings.startTime} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">End Time</label>
                                        <input className="input-field" type="time" name="endTime"
                                            value={settings.endTime} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div style={{ marginTop: "1.25rem" }}>
                                    <label className="label">Period Duration (minutes)</label>
                                    <input className="input-field" type="number" name="periodDuration"
                                        value={settings.periodDuration} onChange={handleChange}
                                        style={{ maxWidth: "200px" }} required />
                                </div>
                            </div>

                            {/* ── Section: Break Times ── */}
                            <div style={sectionStyle}>
                                <p style={sectionLabel}>☕ Break & Lunch Times</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                                    {[
                                        { label: "Morning Break", prefix: "morningBreak" },
                                        { label: "Lunch Break",   prefix: "lunchBreak" },
                                        { label: "Evening Break", prefix: "eveningBreak" },
                                    ].map(({ label, prefix }) => (
                                        <fieldset key={prefix} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1rem", borderRadius: "8px" }}>
                                            <legend style={{ padding: "0 0.5rem", fontSize: "0.85rem" }}>{label}</legend>
                                            <div style={{ display: "grid", gap: "0.75rem" }}>
                                                <div>
                                                    <label className="label">Start</label>
                                                    <input className="input-field" type="time"
                                                        name={`${prefix}.startTime`}
                                                        value={settings[prefix]?.startTime || ""}
                                                        onChange={handleChange} />
                                                </div>
                                                <div>
                                                    <label className="label">End</label>
                                                    <input className="input-field" type="time"
                                                        name={`${prefix}.endTime`}
                                                        value={settings[prefix]?.endTime || ""}
                                                        onChange={handleChange} />
                                                </div>
                                            </div>
                                        </fieldset>
                                    ))}
                                </div>
                            </div>

                            {/* ── Section: Faculty Constraints ── */}
                            <div style={sectionStyle}>
                                <p style={sectionLabel}>👤 Faculty Constraints</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                                    <div>
                                        <label className="label">Max Classes / Week</label>
                                        <input className="input-field" type="number" name="maxClassesPerWeek"
                                            value={settings.maxClassesPerWeek} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">Max Classes / Day</label>
                                        <input className="input-field" type="number" name="maxClassesPerDayFaculty"
                                            value={settings.maxClassesPerDayFaculty} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">Max Continuous Classes</label>
                                        <input className="input-field" type="number" name="maxContinuousClasses"
                                            value={settings.maxContinuousClasses} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            {/* ── Section: Batch / Subject Constraints ── */}
                            <div style={sectionStyle}>
                                <p style={sectionLabel}>🎓 Batch & Subject Constraints</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                                    <div>
                                        <label className="label">Max Classes / Batch / Day</label>
                                        <input className="input-field" type="number" name="maxClassesPerDayBatch"
                                            value={settings.maxClassesPerDayBatch} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">Max Same Subject / Day</label>
                                        <input className="input-field" type="number" name="maxSubjectRepeatPerDay"
                                            value={settings.maxSubjectRepeatPerDay} onChange={handleChange} required />
                                        <small style={{ color: "var(--text-muted)" }}>Per batch per day</small>
                                    </div>
                                </div>
                            </div>

                            {/* ── Section: Lab & Extra ── */}
                            <div style={sectionStyle}>
                                <p style={sectionLabel}>🔬 Lab & Other</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                                    <div>
                                        <label className="label">Lab Session Length (periods)</label>
                                        <input className="input-field" type="number" name="labMinDuration"
                                            value={settings.labMinDuration} onChange={handleChange} min="1" required />
                                        <small style={{ color: "var(--text-muted)" }}>Consecutive periods for a lab</small>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", paddingTop: "1.5rem" }}>
                                        <label className="label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                            <input type="checkbox" name="sharedFaculty"
                                                checked={settings.sharedFaculty} onChange={handleChange}
                                                style={{ width: "20px", height: "20px" }} />
                                            Shared Faculty Across Departments
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <div style={{
                                    padding: "1rem",
                                    background: message.includes("success") ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                                    borderRadius: "4px",
                                    color: message.includes("success") ? "#6ee7b7" : "#fca5a5"
                                }}>
                                    {message}
                                </div>
                            )}

                            <button type="submit" className="btn-primary" style={{ padding: "1rem" }}>
                                Save Settings
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
