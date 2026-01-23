import './App.css';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import {Route, Routes} from "react-router-dom";


function App() {
  return (
    <>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
        </Routes>
    </>
  )
}

export default App
