import Classroom from "../models/Classroom.js";

export const getClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find();
        res.status(200).json(classrooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createClassroom = async (req, res) => {
    const { name, capacity, type, resources } = req.body;
    try {
        const newClassroom = new Classroom({ name, capacity, type, resources });
        await newClassroom.save();
        res.status(201).json(newClassroom);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateClassroom = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedClassroom = await Classroom.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedClassroom);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteClassroom = async (req, res) => {
    const { id } = req.params;
    try {
        await Classroom.findByIdAndDelete(id);
        res.status(200).json({ message: "Classroom deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
