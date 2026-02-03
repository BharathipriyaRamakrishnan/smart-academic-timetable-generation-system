import Faculty from "../models/Faculty.js";
import User from "../models/User.js";

export const createFaculty = async (req, res) => {
    try {
        const faculty = new Faculty(req.body);
        await faculty.save();

        // Auto-create User account for faculty login
        const existingUser = await User.findOne({ email: req.body.email });
        if (!existingUser) {
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                password: "password123", // Default password
                role: "FACULTY"
            });
            await user.save();
            console.log("Created User account for faculty:", req.body.email);
        }

        res.status(201).json(faculty);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find();
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFacultyById = async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) return res.status(404).json({ message: "Faculty not found" });
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!faculty) return res.status(404).json({ message: "Faculty not found" });
        res.json(faculty);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.findByIdAndDelete(req.params.id);
        if (!faculty) return res.status(404).json({ message: "Faculty not found" });

        // Also delete the associated User account
        await User.findOneAndDelete({ email: faculty.email });
        console.log("Deleted User account for faculty:", faculty.email);

        res.json({ message: "Faculty deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
