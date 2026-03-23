import { useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaUserTie, FaChalkboardTeacher, FaSchool, FaClock, FaBook, FaSignOutAlt, FaCogs, FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Sidebar() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role");
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="logo">SMART TT</div>

      <nav>
        {userRole === "ADMIN" && (
          <>
            <button onClick={() => navigate("/admindashboard")}><FaHome /> Dashboard</button>
            <button onClick={() => navigate("/departments")}><FaUsers /> Departments</button>
            <button onClick={() => navigate("/coordinators")}><FaUserTie /> Coordinators</button>
            <button onClick={() => navigate("/faculty")}><FaChalkboardTeacher /> Faculty</button>
            <button onClick={() => navigate("/classrooms")}><FaSchool /> Classrooms</button>
            <button onClick={() => navigate("/subjects")}><FaBook /> Subjects</button>
            <button onClick={() => navigate("/batches")}><FaUsers /> Batches</button>
            <button onClick={() => navigate("/settings")}><FaCogs /> Settings</button>
          </>
        )}
        {userRole === "FACULTY" && (
          <button onClick={() => navigate("/facultydashboard")}><FaHome /> Dashboard</button>
        )}
        {userRole === "COORDINATOR" && (
          <>
            <button onClick={() => navigate("/coordinator")}><FaHome /> Dashboard</button>
            <button onClick={() => navigate("/subjects")}><FaBook /> Subjects</button>
          </>
        )}
        <button onClick={() => navigate("/timetable")}><FaClock /> Timetables</button>
        <button onClick={toggleTheme} style={{ marginTop: "auto" }}>
          {theme === 'dark' ? <><FaSun /> Light Mode</> : <><FaMoon /> Dark Mode</>}
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          style={{ background: "var(--logout-bg)", color: "#fca5a5", marginTop: "1rem" }}
        >
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </aside>
  );
}
