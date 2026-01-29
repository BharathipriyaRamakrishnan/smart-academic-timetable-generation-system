import './App.css';
import Login from './pages/Login.jsx';
import AdminDashboard from './Pages/AdminDashboard.jsx';
import {Route, Routes} from "react-router-dom";
import Departments from "./Pages/Departments";
import Faculty from "./Pages/Faculty";
import Classrooms from "./Pages/Classrooms";
import Timetable from "./Pages/Timetable";


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
        </Routes>
    </>
  )
}

export default App
