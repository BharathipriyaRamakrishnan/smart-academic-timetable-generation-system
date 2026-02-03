import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  type: { type: String, enum: ["Lecture Hall", "Laboratory"], required: true },
  resources: [{ type: String }], // e.g., "Projector", "Computers"
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Classroom", classroomSchema);
