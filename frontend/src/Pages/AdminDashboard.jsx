import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (role !== "ADMIN") {
            console.log("Not a admin");
        }
    }, [navigate]);

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand">DevZero Admin</div>

                <nav>
                    <button className="nav-item active">Dashboard</button>
                    <button className="nav-item">Users</button>
                    <button className="nav-item">Roles</button>
                    <button className="nav-item">Settings</button>
                </nav>

                <button className="logout">Logout</button>
            </aside>

            {/* Main content */}
            <main className="main">
                <header className="header">
                    <h1>Admin Dashboard</h1>
                </header>

                <section className="stats">
                    <div className="card">
                        <h3>Total Users</h3>
                        <p>120</p>
                    </div>
                    <div className="card">
                        <h3>Admins</h3>
                        <p>1</p>
                    </div>
                    <div className="card">
                        <h3>HODs</h3>
                        <p>8</p>
                    </div>
                    <div className="card">
                        <h3>Faculty</h3>
                        <p>110</p>
                    </div>
                </section>

                <section className="content">
                    <h2>Quick Actions</h2>
                    <div className="actions">
                        <button>Add User</button>
                        <button>Assign Role</button>
                        <button>Deactivate User</button>
                    </div>
                </section>
            </main>
        </div>
    );
}
