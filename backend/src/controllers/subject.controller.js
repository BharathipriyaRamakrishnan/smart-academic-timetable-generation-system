import Subject from "../models/Subject.js";

export const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createSubject = async (req, res) => {
    try {
        const newSubject = new Subject(req.body);
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateSubject = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedSubject = await Subject.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedSubject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteSubject = async (req, res) => {
    const { id } = req.params;
    try {
        await Subject.findByIdAndDelete(id);
        res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
