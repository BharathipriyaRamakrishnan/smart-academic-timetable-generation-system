import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { FaChalkboardTeacher, FaSchool, FaBook, FaUsers, FaClock } from "react-icons/fa";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        classrooms: 0,
        faculty: 0,
        subjects: 0,
        batches: 0,
        timetables: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Parallel fetch for stats (or create a stats endpoint in backend, but individual is fine for MVP)
            const [cr, fc, sb, bt, tt] = await Promise.all([
                fetch("/api/classrooms").then(r => r.json()),
                fetch("/api/faculty").then(r => r.json()),
                fetch("/api/subjects").then(r => r.json()),
                fetch("/api/batches").then(r => r.json()),
                fetch("/api/timetables").then(r => r.json())
            ]);

            setStats({
                classrooms: Array.isArray(cr) ? cr.length : 0,
                faculty: Array.isArray(fc) ? fc.length : 0,
                subjects: Array.isArray(sb) ? sb.length : 0,
                batches: Array.isArray(bt) ? bt.length : 0,
                timetables: Array.isArray(tt) ? tt.length : 0
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const StatCard = ({ title, count, icon, color }) => (
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
                background: `rgba(${color}, 0.2)`,
                color: `rgb(${color})`,
                padding: "1rem",
                borderRadius: "12px",
                fontSize: "1.5rem",
                display: "flex"
            }}>
                {icon}
            </div>
            <div>
                <h3 style={{ margin: 0, fontSize: "2rem" }}>{count}</h3>
                <p style={{ margin: 0, color: "var(--text-muted)" }}>{title}</p>
            </div>
        </div>
    );

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Dashboard</h1>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                    <StatCard title="Classrooms" count={stats.classrooms} icon={<FaSchool />} color="236, 72, 153" />
                    <StatCard title="Faculty" count={stats.faculty} icon={<FaChalkboardTeacher />} color="139, 92, 246" />
                    <StatCard title="Subjects" count={stats.subjects} icon={<FaBook />} color="59, 130, 246" />
                    <StatCard title="Batches" count={stats.batches} icon={<FaUsers />} color="16, 185, 129" />
                    <StatCard title="Timetables" count={stats.timetables} icon={<FaClock />} color="245, 158, 11" />
                </div>

                <div className="glass-panel" style={{ padding: "2rem" }}>
                    <h2>Welcome to Smart Timetable System</h2>
                    <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
                        This system helps you generate optimized academic timetables automatically.
                        Begin by adding your resources (Classrooms, Faculty, Subjects) and then defining your Batches.
                        Once data is entered, navigate to the Timetables section to generate a conflict-free schedule.
                    </p>
                </div>
            </main>
        </div>
    );
}
