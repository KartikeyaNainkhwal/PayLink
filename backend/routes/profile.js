const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../db");
const { authMiddleware } = require("../middleware");

const router = express.Router();

/**
 * @route   GET /api/v1/user/details
 * @desc    Get user details (protected)
 */
router.get("/details", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password"); // exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route   PUT /api/v1/user/update
 * @desc    Update user details (firstName, lastName, password)
 */
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, password } = req.body;

    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;

    // If password is provided, hash it before updating
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
