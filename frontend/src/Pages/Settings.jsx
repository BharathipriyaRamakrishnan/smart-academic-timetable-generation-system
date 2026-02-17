import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";

export default function Settings() {
    const [settings, setSettings] = useState({
        workingDays: 5,
        startTime: "09:00",
        endTime: "16:00",
        periodDuration: 60,
        periodDuration: 60,
        morningBreak: { startTime: "11:00", endTime: "11:15" },
        lunchBreak: { startTime: "13:00", endTime: "14:00" },
        eveningBreak: { startTime: "15:00", endTime: "15:15" },
        breaks: [],
        maxClassesPerWeek: 18,
        maxContinuousClasses: 2,
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

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Global Settings</h1>
                </header>

                <div className="glass-panel" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
                    {loading ? <p>Loading...</p> : (
                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label className="label">Working Days (per week)</label>
                                    <input
                                        className="input-field"
                                        type="number"
                                        name="workingDays"
                                        value={settings.workingDays}
                                        onChange={handleChange}
                                        min="1" max="7" required
                                    />
                                </div>
                                <div>
                                    <label className="label">Period Duration (minutes)</label>
                                    <input
                                        className="input-field"
                                        type="number"
                                        name="periodDuration"
                                        value={settings.periodDuration}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label className="label">Start Time</label>
                                    <input
                                        className="input-field"
                                        type="time"
                                        name="startTime"
                                        value={settings.startTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">End Time</label>
                                    <input
                                        className="input-field"
                                        type="time"
                                        name="endTime"
                                        value={settings.endTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                                <fieldset style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1rem", borderRadius: "8px" }}>
                                    <legend style={{ padding: "0 0.5rem" }}>Morning Break</legend>
                                    <div style={{ display: "grid", gap: "1rem" }}>
                                        <div>
                                            <label className="label">Start</label>
                                            <input
                                                className="input-field"
                                                type="time"
                                                name="morningBreak.startTime"
                                                value={settings.morningBreak?.startTime || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">End</label>
                                            <input
                                                className="input-field"
                                                type="time"
                                                name="morningBreak.endTime"
                                                value={settings.morningBreak?.endTime || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1rem", borderRadius: "8px" }}>
                                    <legend style={{ padding: "0 0.5rem" }}>Lunch Break</legend>
                                    <div style={{ display: "grid", gap: "1rem" }}>
                                        <div>
                                            <label className="label">Start</label>
                                            <input
                                                className="input-field"
                                                type="time"
                                                name="lunchBreak.startTime"
                                                value={settings.lunchBreak?.startTime || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">End</label>
                                            <input
                                                className="input-field"
                                                type="time"
                                                name="lunchBreak.endTime"
                                                value={settings.lunchBreak?.endTime || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1rem", borderRadius: "8px" }}>
                                    <legend style={{ padding: "0 0.5rem" }}>Evening Break</legend>
                                    <div style={{ display: "grid", gap: "1rem" }}>
                                        <div>
                                            <label className="label">Start</label>
                                            <input
                                                className="input-field"
                                                type="time"
                                                name="eveningBreak.startTime"
                                                value={settings.eveningBreak?.startTime || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">End</label>
                                            <input
                                                className="input-field"
                                                type="time"
                                                name="eveningBreak.endTime"
                                                value={settings.eveningBreak?.endTime || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label className="label">Max Classes Per Faculty (Week)</label>
                                    <input
                                        className="input-field"
                                        type="number"
                                        name="maxClassesPerWeek"
                                        value={settings.maxClassesPerWeek}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Max Continuous Classes</label>
                                    <input
                                        className="input-field"
                                        type="number"
                                        name="maxContinuousClasses"
                                        value={settings.maxContinuousClasses}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label className="label">Lab Minimum Duration (Periods)</label>
                                    <input
                                        className="input-field"
                                        type="number"
                                        name="labMinDuration"
                                        value={settings.labMinDuration}
                                        onChange={handleChange}
                                        min="1" required
                                    />
                                </div>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <label className="label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            name="sharedFaculty"
                                            checked={settings.sharedFaculty}
                                            onChange={handleChange}
                                            style={{ width: "20px", height: "20px" }}
                                        />
                                        Shared Faculty Across Departments
                                    </label>
                                </div>
                            </div>

                            {message && (
                                <div style={{
                                    padding: "1rem",
                                    background: message.includes("success") ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
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
