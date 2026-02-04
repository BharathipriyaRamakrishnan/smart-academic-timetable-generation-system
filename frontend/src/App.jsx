import './App.css';
import Login from './Pages/Login.jsx';
import AdminDashboard from './Pages/AdminDashboard.jsx';
import FacultyDashboard from './Pages/FacultyDashboard.jsx';
import { Route, Routes } from "react-router-dom";
import Departments from "./Pages/Departments.jsx";
import Faculty from "./Pages/Faculty.jsx";
import Classrooms from "./Pages/Classrooms.jsx";
import Subjects from "./Pages/Subjects.jsx";
import Batches from "./Pages/Batches.jsx";
import Timetable from "./Pages/Timetable.jsx";
import CoordinatorDashboard from "./Pages/CoordinatorDashboard.jsx";
import ProtectedRoute from './Components/ProtectedRoute.jsx';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/departments" element={<Departments />} />
        </Route>

        {/* Coordinator Routes */}
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
