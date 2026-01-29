import './App.css';
import Login from './pages/Login.jsx';
import AdminDashboard from './Pages/AdminDashboard.jsx';
import {Route, Routes} from "react-router-dom";
import Departments from "./Pages/Departments.jsx";
import Faculty from "./Pages/Faculty.jsx";
import Classrooms from "./Pages/Classrooms.jsx";
import Timetable from "./Pages/Timetable.jsx";
import CoordinatorDashboard from "./Pages/CoordinatorDashboard.jsx";


function App() {
  return (
    <>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/admindashboard" element={<AdminDashboard/>} />
          <Route path="/departments" element={<Departments/>} />
          <Route path="/faculty" element={<Faculty/>} />
          <Route path="/classrooms" element={<Classrooms/>} />
          <Route path="/timetable" element={<Timetable/>} />
          <Route path="/coordinator" element={<CoordinatorDashboard />} />

        </Routes>
    </>
  )
}

export default App
