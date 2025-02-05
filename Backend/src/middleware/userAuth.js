import jwt from 'jsonwebtoken';


const userAuth = async (req, res, next) => {
    try {

        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN);

        if (decoded.id) {
            req.body.userId = decoded.id;
        } else{
            return res.status(401).json({ message: "Unauthorized" });
        }
        next();
        
    } catch (error) {
        // console.error("Error in userAuth middleware:", error);
        res.status(401).json({ message: "Unauthorized" });
        
    }
};

export default userAuth;