import "../styles/AdminDashboard.css";
import { useNavigate } from "react-router-dom";

export default function Classrooms() {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">Smart Timetable Admin</div>

        <nav>
          <button className="nav-item" onClick={() => navigate("/admindashboard")}>Dashboard</button>
          <button className="nav-item" onClick={() => navigate("/departments")}>Departments</button>
          <button className="nav-item" onClick={() => navigate("/faculty")}>Faculty</button>
          <button className="nav-item active">Classrooms</button>
          <button className="nav-item" onClick={() => navigate("/timetable")}>Timetables</button>
        </nav>
      </aside>

      <main className="main">
        <div className="header">
          <h1>Classrooms</h1>
          <p>Manage classroom information</p>
        </div>

        <section className="content">
          <p>Classroom management UI goes here.</p>
        </section>
      </main>
    </div>
  );
}
