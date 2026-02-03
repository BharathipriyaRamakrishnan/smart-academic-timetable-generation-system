import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found for:", email);
            return res.status(401).json({ message: "Invalid credentials (user not found)" });
        }

        console.log("User found:", user.email, "Role:", user.role);

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log("Password mismatch for:", email);
            return res.status(401).json({ message: "Invalid credentials (password mismatch)" });
        }

        console.log("Login successful for:", email);
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token, role: user.role });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
