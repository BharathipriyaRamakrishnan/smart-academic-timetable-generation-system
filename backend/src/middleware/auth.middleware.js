import jwt from "jsonwebtoken";

/* Verify JWT */
export const protect = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

/* Admin only */
export const adminOnly = (req, res, next) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admins only" });
    }
    next();
};

/* HOD only (future) */
export const hodOnly = (req, res, next) => {
    if (req.user.role !== "HOD") {
        return res.status(403).json({ message: "HODs only" });
    }
    next();
};

/* Faculty only (future) */
export const facultyOnly = (req, res, next) => {
    if (req.user.role !== "FACULTY") {
        return res.status(403).json({ message: "Faculty only" });
    }
    next();
};
