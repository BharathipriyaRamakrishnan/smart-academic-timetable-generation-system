import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/timetable_system";

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Reset conflictResolution on all approved leaves so they can be re-processed cleanly
    const result = await mongoose.connection.db.collection("leaverequests").updateMany(
        { status: "APPROVED" },
        {
            $set: {
                conflictResolution: {
                    hasConflicts: false,
                    conflictCount: 0,
                    conflicts: [],
                    resolutions: []
                }
            }
        }
    );

    console.log(`Reset conflictResolution on ${result.modifiedCount} approved leave(s)`);

    // Also reset PENDING leaves back so they can be re-approved with the new code
    const pendingResult = await mongoose.connection.db.collection("leaverequests").updateMany(
        { status: "APPROVED" },
        { $set: { status: "PENDING", processedBy: null, processedAt: null } }
    );

    console.log(`Reset ${pendingResult.modifiedCount} approved leave(s) back to PENDING for re-approval`);

    await mongoose.disconnect();
    console.log("Done!");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
