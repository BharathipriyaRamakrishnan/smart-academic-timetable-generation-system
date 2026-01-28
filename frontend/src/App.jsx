import './App.css';
import Login from './pages/Login.jsx';
import AdminDashboard from './Pages/AdminDashboard.jsx';
import {Route, Routes} from "react-router-dom";


function App() {
  return (
    <>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/admindashboard" element={<AdminDashboard/>} />
        </Routes>
    </>
  )
}

export default App
