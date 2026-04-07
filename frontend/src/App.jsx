import './App.css';
import Login from './Pages/Login.jsx';
import AdminDashboard from './Pages/AdminDashboard.jsx';
import FacultyDashboard from './Pages/FacultyDashboard.jsx';
import FacultyLeaves from './Pages/FacultyLeaves.jsx';
import { Route, Routes } from "react-router-dom";
import Departments from "./Pages/Departments.jsx";
import Faculty from "./Pages/Faculty.jsx";
import Classrooms from "./Pages/Classrooms.jsx";
import Subjects from "./Pages/Subjects.jsx";
import Batches from "./Pages/Batches.jsx";
import Timetable from "./Pages/Timetable.jsx";
import Settings from "./Pages/Settings.jsx";
import CoordinatorDashboard from "./Pages/CoordinatorDashboard.jsx";
import Coordinators from "./Pages/Coordinators.jsx";
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import { useTheme } from "./context/ThemeContext.jsx";
import { FaSun, FaMoon } from "react-icons/fa";

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.5rem',
        zIndex: 9999,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-main)',
        padding: '0.5rem 0.85rem',
        borderRadius: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.85rem',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.2s ease'
      }}
      title="Toggle Theme"
    >
      {theme === 'dark' ? <><FaSun size={14} color="#fcd34d" /> Light Mode</> : <><FaMoon size={14} color="#818cf8" /> Dark Mode</>}
    </button>
  );
}

function App() {
  return (
    <>
      <ThemeToggleButton />
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/coordinators" element={<Coordinators />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Coordinator & Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["COORDINATOR", "ADMIN"]} />}>
          <Route path="/coordinator" element={<CoordinatorDashboard />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/classrooms" element={<Classrooms />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/batches" element={<Batches />} />
        </Route>

        {/* Faculty Routes */}
        <Route element={<ProtectedRoute allowedRoles={["FACULTY"]} />}>
          <Route path="/facultydashboard" element={<FacultyDashboard />} />
          <Route path="/leaves" element={<FacultyLeaves />} />
        </Route>

        {/* Shared Routes */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "COORDINATOR", "FACULTY"]} />}>
          <Route path="/timetable" element={<Timetable />} />
        </Route>

      </Routes>
    </>
  )
}

export default App
