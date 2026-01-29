import { useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaChalkboardTeacher, FaSchool, FaClock } from "react-icons/fa";
import "../styles/AdminDashboard.css";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="logo">SMART TT</div>

      <nav>
        <button onClick={()=>navigate("/admin")}><FaHome /> Dashboard</button>
        <button onClick={()=>navigate("/departments")}><FaUsers /> Departments</button>
        <button onClick={()=>navigate("/faculty")}><FaChalkboardTeacher /> Faculty</button>
        <button onClick={()=>navigate("/classrooms")}><FaSchool /> Classrooms</button>
        <button onClick={()=>navigate("/timetable")}><FaClock /> Timetables</button>
      </nav>
    </aside>
  );
}
