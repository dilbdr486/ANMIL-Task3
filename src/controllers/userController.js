import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { userModel } from "../models/userModel.js";
import transporter from "../config/nodeMailer.js";

const register = async (req, res) => {
  const { name, email, password } = req.body;
  // console.log(req.body);

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existedUser = await userModel.findOne({ email });

    if (existedUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new userModel({ name, email, password: hashedPassword });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_TOKEN, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const mailOptions = {
      from : process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to our platform",
      text: `Hello ${name}, welcome to our platform. We are glad to have you here and email ${email}.`,
    }

    // console.log("Sending email with options:", mailOptions);

    await transporter.sendMail(mailOptions);

    res.json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Error in server", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await userModel.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_TOKEN, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    res.json({ message: "Something went wrong" });
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.json({ message: "Logged out" });
  } catch (error) {
    res.json({ message: "Something went wrong" });
  }
};

const sendVerifyOtp = async (req, res) => {
  try {
    
    const { userId } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    if (user.isAccountVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const mailOptions = {
      from : process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Your OTP to verify your account is ${otp}`,
    }

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent successfully on email" });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
}

const verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user= await userModel.findById(userId);

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    if (user.verifyOtp === '' || user.verifyOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ message: "OTP is expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;

    await user.save();

    res.json({ message: "Account verified successfully" });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
}

const isAuthenticated = async(req,res) =>{
  try {
    return res.json({message:"User is authenticated"});
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
}

const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // console.log("Generated OTP:", otp);
    // console.log("User before saving OTP:", user);

    await user.save();

    // console.log("User after saving OTP:", user);

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Your OTP to reset your password is ${otp}`,
    };

    // console.log("Sending reset OTP email with options:", mailOptions);

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent successfully on email" });
  } catch (error) {
    console.error("Error during sending reset OTP:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    console.log("Received OTP:", otp, "Stored OTP:", user.resetOtp, "OTP Expiry:", user.resetOtpExpireAt);

    if (user.resetOtp === '' || user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ message: "OTP is expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

export { register, login, logout, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp,resetPassword };
