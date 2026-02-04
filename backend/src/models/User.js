import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["ADMIN", "COORDINATOR", "FACULTY"],
            default: "FACULTY"
        },

        // For COORDINATOR role - which department they coordinate
        coordinatorOf: {
            type: String,
            default: null
        },

        // For FACULTY role - availability and workload preferences
        facultyDetails: {
            maxHoursPerWeek: {
                type: Number,
                default: 40
            },
            availability: [{
                day: String,
                slots: [String]
            }]
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

/* Hash password before saving */
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/* Compare password method */
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
