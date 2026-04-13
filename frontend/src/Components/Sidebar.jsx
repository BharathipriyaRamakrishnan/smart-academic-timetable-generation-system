import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    FaHome, FaUsers, FaUserTie, FaChalkboardTeacher, FaSchool,
    FaClock, FaBook, FaSignOutAlt, FaCogs, FaCalendarTimes, FaClipboardList
} from "react-icons/fa";

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const userRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    const [pendingCount, setPendingCount] = useState(0);
    const [conflictCount, setConflictCount] = useState(0);

    // For coordinator: poll pending + conflict counts for badges
    useEffect(() => {
        if (userRole !== "COORDINATOR") return;

        const fetchBadges = async () => {
            try {
                const department = localStorage.getItem("department") || "";
                const [leavesRes, conflictsRes] = await Promise.all([
                    fetch(`/api/leaves/department/${department}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch("/api/leaves/approved-with-conflicts", {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                if (leavesRes.ok) {
                    const data = await leavesRes.json();
                    setPendingCount(data.filter(l => l.status === "PENDING").length);
                }
                if (conflictsRes.ok) {
                    const data = await conflictsRes.json();
                    setConflictCount(data.length);
                }
            } catch (err) {
                // silent
            }
        };

        fetchBadges();
        const interval = setInterval(fetchBadges, 15000);
        return () => clearInterval(interval);
    }, [userRole]);

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "?");

    const navBtnStyle = (path) => ({
        background: isActive(path) ? "linear-gradient(90deg, rgba(79,70,229,0.18), transparent)" : "transparent",
        color: isActive(path) ? "#818cf8" : "var(--text-muted)",
        padding: "0.875rem 1rem",
        borderRadius: isActive(path) ? "0 var(--radius) var(--radius) 0" : "var(--radius)",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        fontSize: "1rem",
        fontWeight: isActive(path) ? 700 : 500,
        transition: "all 0.2s ease-in-out",
        border: isActive(path) ? "1px solid rgba(79,70,229,0.2)" : "1px solid transparent",
        borderLeft: isActive(path) ? "3px solid #818cf8" : "3px solid transparent",
        width: "100%",
        cursor: "pointer",
        fontFamily: "inherit",
        position: "relative"
    });

    const Badge = ({ count, color = "#f59e0b" }) => count > 0 ? (
        <span style={{
            marginLeft: "auto",
            background: `${color}25`,
            color: color,
            borderRadius: "20px",
            padding: "1px 7px",
            fontSize: "0.65rem",
            fontWeight: 800,
            border: `1px solid ${color}50`,
            minWidth: "18px",
            textAlign: "center"
        }}>{count > 9 ? "9+" : count}</span>
    ) : null;

    return (
        <aside className="sidebar">
            <div className="logo">SMART TT</div>

            <nav>
                {/* ADMIN nav */}
                {userRole === "ADMIN" && (
                    <>
                        <button style={navBtnStyle("/admindashboard")} onClick={() => navigate("/admindashboard")}>
                            <FaHome /> Dashboard
                        </button>
                        <button style={navBtnStyle("/departments")} onClick={() => navigate("/departments")}>
                            <FaUsers /> Departments
                        </button>
                        <button style={navBtnStyle("/coordinators")} onClick={() => navigate("/coordinators")}>
                            <FaUserTie /> Coordinators
                        </button>
                        <button style={navBtnStyle("/faculty")} onClick={() => navigate("/faculty")}>
                            <FaChalkboardTeacher /> Faculty
                        </button>
                        <button style={navBtnStyle("/classrooms")} onClick={() => navigate("/classrooms")}>
                            <FaSchool /> Classrooms
                        </button>
                        <button style={navBtnStyle("/subjects")} onClick={() => navigate("/subjects")}>
                            <FaBook /> Subjects
                        </button>
                        <button style={navBtnStyle("/batches")} onClick={() => navigate("/batches")}>
                            <FaUsers /> Batches
                        </button>
                        <button style={navBtnStyle("/settings")} onClick={() => navigate("/settings")}>
                            <FaCogs /> Settings
                        </button>
                    </>
                )}

                {/* FACULTY nav */}
                {userRole === "FACULTY" && (
                    <>
                        <button style={navBtnStyle("/facultydashboard")} onClick={() => navigate("/facultydashboard")}>
                            <FaHome /> Dashboard
                        </button>
                        <button style={navBtnStyle("/leaves")} onClick={() => navigate("/leaves")}>
                            <FaBook /> Leave Requests
                        </button>
                    </>
                )}

                {/* COORDINATOR nav */}
                {userRole === "COORDINATOR" && (
                    <>
                        <button style={navBtnStyle("/coordinator")} onClick={() => navigate("/coordinator")}>
                            <FaHome /> Dashboard
                        </button>
                        <button
                            id="sidebar-leave-management"
                            style={navBtnStyle("/leave-management")}
                            onClick={() => navigate("/leave-management")}
                        >
                            <FaCalendarTimes /> Leave Management
                            {(pendingCount + conflictCount) > 0 && (
                                <Badge count={pendingCount + conflictCount} color="#f59e0b" />
                            )}
                        </button>
                        <button style={navBtnStyle("/subjects")} onClick={() => navigate("/subjects")}>
                            <FaBook /> Subjects
                        </button>
                    </>
                )}

                {/* Shared nav (all roles) */}
                <button style={navBtnStyle("/timetable")} onClick={() => navigate("/timetable")}>
                    <FaClock /> Timetables
                </button>

                <button
                    onClick={() => {
                        localStorage.clear();
                        navigate("/");
                    }}
                    style={{
                        ...navBtnStyle("/logout"),
                        background: "var(--logout-bg)",
                        color: "#fca5a5",
                        marginTop: "1rem",
                        borderColor: "transparent"
                    }}
                >
                    <FaSignOutAlt /> Logout
                </button>
            </nav>
        </aside>
    );
}
