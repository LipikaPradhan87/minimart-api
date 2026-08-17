import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ======================================================
// MAIL CONFIGURATION
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});


// ======================================================
// REGISTER
// ======================================================

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists with this email",
      });
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,

      // Important because your login checks this
      is_active: true,
      is_delete: false,

      role: "user",
    });

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {

    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// LOGIN
// ======================================================

export const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // Check active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive",
      });
    }

    // Check deleted
    if (user.is_delete) {
      return res.status(403).json({
        success: false,
        message:
          "User account has been deleted",
      });
    }

    // Check password
    const isPasswordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// FORGOT PASSWORD
// ======================================================

export const forgotPassword = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account found with this email",
      });
    }

    // Generate random token
    const resetToken =
      crypto.randomBytes(32).toString("hex");

    // Save token
    user.resetPasswordToken = resetToken;

    // Token expires after 15 minutes
    user.resetPasswordExpires =
      Date.now() + 15 * 60 * 1000;

    await user.save();

    // React reset password URL
    const resetUrl =
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: `"Mini Mart" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject:
        "Mini Mart - Reset Your Password",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 10px;
          "
        >

          <h2>
            Reset Your Password
          </h2>

          <p>
            Hello ${user.name},
          </p>

          <p>
            We received a request to reset
            your Mini Mart account password.
          </p>

          <p>
            Click the button below to reset
            your password.
          </p>

          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              background: #212529;
              color: white;
              padding: 12px 25px;
              text-decoration: none;
              border-radius: 5px;
            "
          >
            Reset Password
          </a>

          <p style="margin-top: 20px;">
            This link will expire in
            <strong>15 minutes</strong>.
          </p>

          <p>
            If you did not request this
            password reset, please ignore
            this email.
          </p>

          <p>
            Thanks,<br />
            Mini Mart Team
          </p>

        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset link has been sent to your email",
    });

  } catch (error) {

    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to send password reset email",
    });
  }
};


// ======================================================
// RESET PASSWORD
// ======================================================

export const resetPassword = async (
  req,
  res
) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validation
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message:
          "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,

      resetPasswordExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // Clear reset token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully",
    });

  } catch (error) {

    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};