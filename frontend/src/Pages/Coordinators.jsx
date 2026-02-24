import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import { FaUserTie, FaPlus, FaTrash, FaEnvelope, FaBuilding } from "react-icons/fa";

export default function Coordinators() {
    const [coordinators, setCoordinators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]); // Master list of departments
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "", // Default password could be set, or manual input
        department: "" // Selected department
    });
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchCoordinators();
        fetchDepartments();
    }, []);

    const fetchCoordinators = async () => {
        try {
            const res = await fetch("/api/auth/coordinators", {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            setCoordinators(data);
        } catch (error) {
            console.error("Error fetching coordinators:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = () => {
        // Fetch from localStorage for now, since Departments.jsx uses localStorage
        // Ideally should fetch from backend if Departments model existed
        const saved = localStorage.getItem("departments");
        if (saved) {
            setDepartments(JSON.parse(saved));
        } else {
            // Fallback default departments
            const defaults = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"];
            setDepartments(defaults);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/auth/register-coordinator", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok) {
                alert("Coordinator added successfully!");
                setFormData({ name: "", email: "", password: "", department: "" });
                fetchCoordinators();
            } else {
                alert(data.message || "Failed to add coordinator");
            }
        } catch (error) {
            console.error("Error creating coordinator:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure? This will delete the coordinator account.")) return;
        try {
            const res = await fetch(`/api/auth/users/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                fetchCoordinators();
            } else {
                alert("Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Coordinators</h1>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>

                    {/* Add Form */}
                    <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
                        <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FaPlus /> Add Coordinator
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                className="input-field"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <input
                                className="input-field"
                                name="email"
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <input
                                className="input-field"
                                name="password"
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <select
                                className="input-field"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>

                            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                                Create Account
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="glass-panel" style={{ padding: "1.5rem" }}>
                        <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FaUserTie /> Coordinators List
                        </h2>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search coordinators by name, email, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ marginBottom: "1rem" }}
                        />

                        {loading ? <p>Loading...</p> : (
                            <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "0.5rem" }}>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    {coordinators.length === 0 ? (
                                        <p style={{ color: "var(--text-muted)" }}>No coordinators found.</p>
                                    ) : (
                                        coordinators
                                            .filter(user =>
                                                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                (user.coordinatorOf && user.coordinatorOf.toLowerCase().includes(searchQuery.toLowerCase()))
                                            )
                                            .map((user) => (
                                                <div key={user._id} style={{
                                                    background: "rgba(255,255,255,0.05)",
                                                    padding: "1rem",
                                                    borderRadius: "8px",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    border: "1px solid var(--glass-border)"
                                                }}>
                                                    <div>
                                                        <h3 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            {user.name}
                                                            {user.coordinatorOf && (
                                                                <span style={{
                                                                    fontSize: "0.8rem",
                                                                    background: "rgba(16, 185, 129, 0.2)",
                                                                    color: "#34d399",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "12px"
                                                                }}>
                                                                    {user.coordinatorOf}
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <p style={{ margin: 0, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            <FaEnvelope /> {user.email}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        style={{ color: "#ef4444", background: "none", fontSize: "1.2rem" }}
                                                        title="Delete Coordinator"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
