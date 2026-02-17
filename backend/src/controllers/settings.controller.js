import Settings from "../models/Settings.js";

export const getSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            // Create default settings if not exists
            const defaultSettings = new Settings();
            await defaultSettings.save();
            return res.json(defaultSettings);
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
