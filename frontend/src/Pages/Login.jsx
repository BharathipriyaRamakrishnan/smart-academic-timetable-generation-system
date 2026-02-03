import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import loginBg from '../assets/images/login-bg.jpg'
import { FcGoogle } from "react-icons/fc";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";



function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const email = e.target[0].value;
            const password = e.target[1].value;

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);

                if (data.role === "ADMIN") {
                    navigate("/admindashboard");
                } else {
                    navigate("/facultydashboard");
                }
            } else {
                alert(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login Failed. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            console.log("Google User:", user);

            // TEMP redirect
            navigate("/admindashboard");
        } catch (error) {
            console.error("Google Login Failed:", error);
        }
    };


    return (
        <div className="auth-layout">
            {/* LEFT */}
            <div className="auth-left">
                <div className="auth-content">
                    <div className="logo">Smart Academic Timetable Generator System</div>

                    <h1>Login</h1>
                    <p className="subtitle">
                        We suggest using the email address you use at work.
                    </p>

                    <form onSubmit={handleLogin}>
                        <label>Email address</label>
                        <input type="email" required />

                        <label>Password</label>
                        <div className="password-field">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                            />
                            <span
                                className="eye"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                            </span>
                        </div>


                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>

                        <div className="divider">OR</div>

                        <button
                            type="button"
                            className="oauth google"
                            onClick={handleGoogleLogin}
                        >
                            <FcGoogle className="icon" />
                            Continue with Google
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT */}
            <div className="auth-right">
                <div className="visual-placeholder">
                    <img src={loginBg} alt="Company Logo" />
                </div>
            </div>
        </div>
    );
}

export default Login;
