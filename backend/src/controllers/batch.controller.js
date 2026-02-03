import Batch from "../models/Batch.js";

export const getBatches = async (req, res) => {
    try {
        const batches = await Batch.find().populate("subjects");
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBatch = async (req, res) => {
    try {
        const newBatch = new Batch(req.body);
        await newBatch.save();
        res.status(201).json(newBatch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateBatch = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedBatch = await Batch.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedBatch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteBatch = async (req, res) => {
    const { id } = req.params;
    try {
        await Batch.findByIdAndDelete(id);
        res.status(200).json({ message: "Batch deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
