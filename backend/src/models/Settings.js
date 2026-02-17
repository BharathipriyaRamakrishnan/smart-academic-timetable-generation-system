import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    workingDays: {
        type: Number,
        required: true,
        default: 5, // 5 or 6
        min: 1,
        max: 7
    },
    startTime: {
        type: String,
        required: true,
        default: "09:00" // HH:mm format
    },
    endTime: {
        type: String,
        required: true,
        default: "16:00" // HH:mm format
    },
    periodDuration: {
        type: Number,
        required: true,
        default: 60 // minutes
    },
    morningBreak: {
        startTime: { type: String, default: "11:00" },
        endTime: { type: String, default: "11:15" }
    },
    lunchBreak: {
        startTime: { type: String, default: "13:00" },
        endTime: { type: String, default: "14:00" }
    },
    eveningBreak: {
        startTime: { type: String, default: "15:00" },
        endTime: { type: String, default: "15:15" }
    },
    breaks: [{
        startTime: String,
        endTime: String,
        name: { type: String, default: "Break" }
    }],
    maxClassesPerWeek: {
        type: Number,
        default: 18
    },
    maxContinuousClasses: {
        type: Number,
        default: 2
    },
    labMinDuration: {
        type: Number,
        default: 2 // Number of periods
    },
    sharedFaculty: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Ensure only one document exists
settingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return await this.create({});
};

export default mongoose.model("Settings", settingsSchema);
