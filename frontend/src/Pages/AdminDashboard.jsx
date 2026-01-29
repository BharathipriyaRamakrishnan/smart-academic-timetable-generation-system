// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/AdminDashboard.css";

// export default function AdminDashboard() {
//     const navigate = useNavigate();

//     useEffect(() => {
//         const token = localStorage.getItem("token");
//         const role = localStorage.getItem("role");

//         if (role !== "ADMIN") {
//             console.log("Not a admin");
//         }
//     }, [navigate]);

//     return (
//         <div className="admin-layout">
//             {/* Sidebar */}
//             <aside className="sidebar">
//                 <div className="brand">DevZero Admin</div>

//                 <nav>
//                     <button className="nav-item active">Dashboard</button>
//                     <button className="nav-item">Users</button>
//                     <button className="nav-item">Roles</button>
//                     <button className="nav-item">Settings</button>
//                 </nav>

//                 <button className="logout">Logout</button>
//             </aside>

//             {/* Main content */}
//             <main className="main">
//                 <header className="header">
//                     <h1>Admin Dashboard</h1>
//                 </header>

//                 <section className="stats">
//                     <div className="card">
//                         <h3>Total Users</h3>
//                         <p>120</p>
//                     </div>
//                     <div className="card">
//                         <h3>Admins</h3>
//                         <p>1</p>
//                     </div>
//                     <div className="card">
//                         <h3>HODs</h3>
//                         <p>8</p>
//                     </div>
//                     <div className="card">
//                         <h3>Faculty</h3>
//                         <p>110</p>
//                     </div>
//                 </section>

//                 <section className="content">
//                     <h2>Quick Actions</h2>
//                     <div className="actions">
//                         <button>Add User</button>
//                         <button>Assign Role</button>
//                         <button>Deactivate User</button>
//                     </div>
//                 </section>
//             </main>
//         </div>
//     );
// }




// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/AdminDashboard.css";

// export default function AdminDashboard() {
//     const navigate = useNavigate();

//     useEffect(() => {
//         const role = localStorage.getItem("role");

//         if (role !== "ADMIN") {
//             console.warn("Not an admin (frontend-only mode)");
//         }
//     }, []);

//     const handleLogout = () => {
//         localStorage.clear();
//         navigate("/");
//     };

//     return (
//         <div className="admin-layout">
//             {/* Sidebar */}
//             <aside className="sidebar">
//                 <div className="brand">Smart Timetable Admin</div>

//                 <nav>
//                     <button className="nav-item active">Dashboard</button>
//                     <button className="nav-item">Departments</button>
//                     <button className="nav-item">Faculty</button>
//                     <button className="nav-item">Classrooms</button>
//                     <button className="nav-item">Timetables</button>
//                 </nav>

//                 <button className="logout" onClick={handleLogout}>
//                     Logout
//                 </button>
//             </aside>

//             {/* Main */}
//             <main className="main">
//                 <header className="header">
//                     <h1>Admin Dashboard</h1>
//                     <p style={{ color: "#64748b" }}>
//                         Smart Classroom & Timetable Scheduler
//                     </p>
//                 </header>

//                 {/* Stats */}
//                 <section className="stats">
//                     <div className="card">
//                         <h3>Total Users</h3>
//                         <p>120</p>
//                     </div>
//                     <div className="card">
//                         <h3>Departments</h3>
//                         <p>8</p>
//                     </div>
//                     <div className="card">
//                         <h3>Faculty Members</h3>
//                         <p>110</p>
//                     </div>
//                     <div className="card">
//                         <h3>Classrooms</h3>
//                         <p>35</p>
//                     </div>
//                 </section>

//                 {/* Quick actions */}
//                 <section className="content">
//                     <h2>Quick Actions</h2>
//                     <div className="actions">
//                         <button>Add Department</button>
//                         <button>Add Faculty</button>
//                         <button>Generate Timetable</button>
//                     </div>
//                 </section>
//             </main>
//         </div>
//     );
// }
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/");
    };

    return (
        <div className="admin-layout">

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand">Smart Timetable Admin</div>

                <nav>
                    <button className="nav-item active">
                        Dashboard
                    </button>
                    <button 
                        className="nav-item"
                        onClick={() => navigate("/departments")}
                    >
                        Departments
                    </button>
                    <button 
                        className="nav-item"
                        onClick={() => navigate("/faculty")}
                    >
                        Faculty
                    </button>
                    <button 
                        className="nav-item"
                        onClick={() => navigate("/classrooms")}
                    >
                        Classrooms
                    </button>
                    <button 
                        className="nav-item"
                        onClick={() => navigate("/timetable")}
                    >
                        Timetables
                    </button>
                </nav>

                <button className="logout" onClick={handleLogout}>
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="main">

                {/* Header */}
                <header className="header">
                    <h1>Admin Dashboard</h1>
                    <p style={{ color: "#64748b" }}>
                        Smart Classroom & Timetable Scheduler
                    </p>
                </header>

                {/* Stats Section */}
                <section className="stats">
                    <div className="card">
                        <h3>Departments</h3>
                        <p>8</p>
                    </div>
                    <div className="card">
                        <h3>Faculty Members</h3>
                        <p>110</p>
                    </div>
                    <div className="card">
                        <h3>Classrooms</h3>
                        <p>35</p>
                    </div>
                    <div className="card">
                        <h3>Active Timetables</h3>
                        <p>6</p>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="content">
                    <h2>Quick Actions</h2>
                    <div className="actions">
                        <button onClick={() => navigate("/departments")}>
                            Add Department
                        </button>
                        <button onClick={() => navigate("/faculty")}>
                            Add Faculty
                        </button>
                        <button onClick={() => navigate("/classrooms")}>
                            Add Classroom
                        </button>
                        <button onClick={() => navigate("/timetable")}>
                            Generate Timetable
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
}
