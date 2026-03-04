import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    // ... existing login code ...
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found for:", email);
            return res.status(401).json({ message: "Invalid credentials (user not found)" });
        }

        // console.log("User found:", user.email, "Role:", user.role);

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log("Password mismatch for:", email);
            return res.status(401).json({ message: "Invalid credentials (password mismatch)" });
        }

        console.log("Login successful for:", email);
        const department = user.coordinatorOf || user.department || null;

        const token = jwt.sign(
            { id: user._id, role: user.role, department },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            role: user.role,
            department  // coordinators use coordinatorOf, faculty use department
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

/* Create Coordinator (Admin only) */
router.post("/register-coordinator", protect, adminOnly, async (req, res) => {
    try {
        const { name, email, password, department } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = new User({
            name,
            email,
            password,
            role: "COORDINATOR",
            coordinatorOf: department
        });

        await user.save();
        res.status(201).json({ message: "Coordinator created successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* Get all coordinators (Admin only) */
router.get("/coordinators", protect, adminOnly, async (req, res) => {
    try {
        const coordinators = await User.find({ role: "COORDINATOR" }).select("-password");
        res.status(200).json(coordinators);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* Delete user (Admin only) */
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
