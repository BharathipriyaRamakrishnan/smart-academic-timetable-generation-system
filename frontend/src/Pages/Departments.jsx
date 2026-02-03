import Sidebar from "../Components/Sidebar";

export default function Departments() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">Departments</h1>
        </header>

        <div className="glass-panel" style={{ padding: "2rem" }}>
          <p>Department management is currently handled within Faculty and Subject settings.</p>
        </div>
      </main>
    </div>
  );
}
