import "../styles/AdminDashboard.css";
import { useNavigate } from "react-router-dom";

function Departments() {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">Smart Timetable Admin</div>

        <nav>
          <button className="nav-item" onClick={() => navigate("/admindashboard")}>Dashboard</button>
          <button className="nav-item active">Departments</button>
          <button className="nav-item" onClick={() => navigate("/faculty")}>Faculty</button>
          <button className="nav-item" onClick={() => navigate("/classrooms")}>Classrooms</button>
          <button className="nav-item" onClick={() => navigate("/timetable")}>Timetables</button>
        </nav>
      </aside>

      <main className="main">
        <div className="header">
          <h1>Departments</h1>
          <p>Manage department details</p>
        </div>

        <section className="content">
          <p>Department management UI goes here.</p>
        </section>
      </main>
    </div>
  );
}

export default Departments;
