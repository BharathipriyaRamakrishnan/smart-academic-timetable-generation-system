import Faculty from "../models/Faculty.js";

export const getFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find();
        res.status(200).json(faculty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createFaculty = async (req, res) => {
    try {
        const newFaculty = new Faculty(req.body);
        await newFaculty.save();
        res.status(201).json(newFaculty);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateFaculty = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedFaculty = await Faculty.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedFaculty);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteFaculty = async (req, res) => {
    const { id } = req.params;
    try {
        await Faculty.findByIdAndDelete(id);
        res.status(200).json({ message: "Faculty deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
