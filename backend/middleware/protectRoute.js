import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';


export const protectRoute = async (req, res, next) => {
    try {
        const token =  req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });

        }

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });

        }

        req.user = user; // Attach the user object to the request for later use in the route handler
        next(); // Call the next middleware or route handler

    } catch (error) {
        console.error("Error in protectRoute middleware:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
    
}