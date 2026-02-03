import { useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaChalkboardTeacher, FaSchool, FaClock, FaBook, FaSignOutAlt } from "react-icons/fa";

export default function Sidebar() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role");

  return (
    <aside className="sidebar">
      <div className="logo">SMART TT</div>

      <nav>
        {userRole === "ADMIN" && (
          <>
            <button onClick={() => navigate("/admindashboard")}><FaHome /> Dashboard</button>
            <button onClick={() => navigate("/departments")}><FaUsers /> Departments</button>
            <button onClick={() => navigate("/faculty")}><FaChalkboardTeacher /> Faculty</button>
            <button onClick={() => navigate("/classrooms")}><FaSchool /> Classrooms</button>
            <button onClick={() => navigate("/subjects")}><FaBook /> Subjects</button>
            <button onClick={() => navigate("/batches")}><FaUsers /> Batches</button>
          </>
        )}
        {userRole === "FACULTY" && (
          <button onClick={() => navigate("/facultydashboard")}><FaHome /> Dashboard</button>
        )}
        <button onClick={() => navigate("/timetable")}><FaClock /> Timetables</button>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          style={{ marginTop: "auto", background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5" }}
        >
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </aside>
  );
}
