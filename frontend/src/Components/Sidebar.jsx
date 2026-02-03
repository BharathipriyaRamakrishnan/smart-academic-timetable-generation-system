import { useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaChalkboardTeacher, FaSchool, FaClock } from "react-icons/fa";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="logo">SMART TT</div>

      <nav>
        <button onClick={() => navigate("/admindashboard")}><FaHome /> Dashboard</button>
        <button onClick={() => navigate("/departments")}><FaUsers /> Departments</button>
        <button onClick={() => navigate("/faculty")}><FaChalkboardTeacher /> Faculty</button>
        <button onClick={() => navigate("/classrooms")}><FaSchool /> Classrooms</button>
        <button onClick={() => navigate("/subjects")}><FaSchool /> Subjects</button>
        <button onClick={() => navigate("/batches")}><FaUsers /> Batches</button>
        <button onClick={() => navigate("/timetable")}><FaClock /> Timetables</button>
      </nav>
    </aside>
  );
}
