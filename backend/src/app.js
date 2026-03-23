import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import classroomRoutes from "./routes/classroom.routes.js";
import facultyRoutes from "./routes/faculty.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import batchRoutes from "./routes/batch.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import constraintRoutes from "./routes/constraint.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/constraints", constraintRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);

export default app;
