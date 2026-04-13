import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import NotificationBell from "../Components/NotificationBell";
import { useNavigate } from "react-router-dom";
import { FaCalendarTimes, FaBell, FaExclamationTriangle, FaCheckCircle, FaClipboardList } from "react-icons/fa";

export default function CoordinatorDashboard() {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedConflicts, setApprovedConflicts] = useState([]);
  const [subLogCount, setSubLogCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const department = localStorage.getItem("department") || "CSE";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [leavesRes, conflictsRes, logRes] = await Promise.all([
        fetch(`/api/leaves/department/${department}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/leaves/approved-with-conflicts", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/substitutions/log", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setPendingLeaves(data.filter(l => l.status === "PENDING"));
      }
      if (conflictsRes.ok) {
        setApprovedConflicts(await conflictsRes.json());
      }
      if (logRes.ok) {
        const logs = await logRes.json();
        setSubLogCount(logs.filter(l => l.status === "ACTIVE").length);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Pending Leave Requests",
      value: pendingLeaves.length,
      icon: "⏳",
      color: "#f59e0b",
      action: () => navigate("/leave-management"),
      actionLabel: "Review →"
    },
    {
      label: "Classes Need Coverage",
      value: approvedConflicts.reduce((acc, l) => acc + (l.conflictResolution?.conflictCount || 0), 0),
      icon: "⚠️",
      color: "#ef4444",
      action: () => navigate("/leave-management?tab=conflicts"),
      actionLabel: "Assign Substitutes →"
    },
    {
      label: "Active Substitutions",
      value: subLogCount,
      icon: "🔄",
      color: "#10b981",
      action: () => navigate("/leave-management?tab=log"),
      actionLabel: "View Log →"
    }
  ];

  const quickActions = [
    {
      id: "qa-leave-management",
      icon: <FaCalendarTimes size={22} color="#f59e0b" />,
      title: "Leave Management",
      desc: "Review pending leaves, assign substitutes, and view substitution history.",
      badge: pendingLeaves.length > 0 ? `${pendingLeaves.length} pending` : null,
      badgeColor: "#f59e0b",
      onClick: () => navigate("/leave-management")
    },
    {
      id: "qa-timetable",
      icon: <span style={{ fontSize: "1.4rem" }}>📅</span>,
      title: "Timetable Builder",
      desc: "Generate and manage academic schedules for your department.",
      badge: null,
      onClick: () => navigate("/timetable")
    },
    {
      id: "qa-conflicts",
      icon: <FaExclamationTriangle size={22} color="#ef4444" />,
      title: "Conflict Dashboard",
      desc: "View all approved leaves with unresolved timetable conflicts requiring substitutes.",
      badge: approvedConflicts.length > 0 ? `${approvedConflicts.length} unresolved` : null,
      badgeColor: "#ef4444",
      onClick: () => navigate("/leave-management?tab=conflicts")
    },
    {
      id: "qa-sub-log",
      icon: <FaClipboardList size={22} color="#818cf8" />,
      title: "Substitution Log",
      desc: "Track all substitute assignments made for your department.",
      badge: null,
      onClick: () => navigate("/leave-management?tab=log")
    }
  ];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <header className="page-header" style={{ marginBottom: "2rem" }}>
          <div>
            <h1 className="page-title">Coordinator Dashboard</h1>
            <p style={{ color: "var(--text-muted)", margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
              Welcome back! Here's a real-time overview of your department.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ padding: "0.45rem 1rem", background: "rgba(79,70,229,0.1)", borderRadius: "20px", color: "#818cf8", fontSize: "0.85rem", fontWeight: 600 }}>
              🏛 {department}
            </span>
            <NotificationBell />
            {pendingLeaves.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.4rem 1rem",
                background: "rgba(245,158,11,0.15)", color: "#f59e0b",
                borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600,
                animation: "pulse 2s infinite", cursor: "pointer"
              }} onClick={() => navigate("/leave-management")}>
                <FaBell size={12} />
                {pendingLeaves.length} Pending Leave{pendingLeaves.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </header>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
          {statCards.map(card => (
            <div
              key={card.label}
              className="glass-panel"
              onClick={card.action}
              style={{
                padding: "1.5rem",
                cursor: "pointer",
                transition: "transform 0.18s, box-shadow 0.18s",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${card.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: card.color, lineHeight: 1 }}>
                    {loading ? "—" : card.value}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>{card.label}</div>
                </div>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: `${card.color}20`, border: `1px solid ${card.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", flexShrink: 0
                }}>{card.icon}</div>
              </div>
              <div style={{ fontSize: "0.82rem", color: card.color, fontWeight: 600 }}>{card.actionLabel}</div>
            </div>
          ))}
        </div>

        {/* Urgent Alert: conflicts need action */}
        {!loading && approvedConflicts.length > 0 && (
          <div
            className="glass-panel"
            onClick={() => navigate("/leave-management?tab=conflicts")}
            style={{
              padding: "1.25rem 1.5rem",
              borderLeft: "4px solid #ef4444",
              marginBottom: "2rem",
              cursor: "pointer",
              transition: "transform 0.15s",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "12px",
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", flexShrink: 0, animation: "pulse 2s infinite"
              }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.95rem" }}>
                  Action Required: Timetable Substitutes Needed
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {approvedConflicts.length} approved leave{approvedConflicts.length > 1 ? "s" : ""} with unresolved class conflicts.
                  Assign substitutes to keep classes running.
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>Fix Now →</span>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Quick Actions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {quickActions.map(action => (
              <div
                key={action.id}
                id={action.id}
                className="glass-panel"
                onClick={action.onClick}
                style={{
                  padding: "1.5rem",
                  cursor: "pointer",
                  transition: "transform 0.18s, box-shadow 0.18s",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{
                    width: "46px", height: "46px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--glass-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0
                  }}>{action.icon}</div>
                  {action.badge && (
                    <span style={{
                      padding: "0.25rem 0.7rem",
                      background: `${action.badgeColor}20`,
                      color: action.badgeColor,
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      border: `1px solid ${action.badgeColor}40`,
                      animation: "pulse 2s infinite"
                    }}>{action.badge}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.35rem" }}>{action.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{action.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
