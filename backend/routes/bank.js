// backend/routes/account.js
const express = require("express");
const { authMiddleware } = require("../middleware");
const { Account, Transaction } = require("../db");

const router = express.Router();

// Deposit money (from bank to your account)
router.post("/deposit", authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Find account of logged-in user
    const account = await Account.findOne({ userId: req.userId });
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Update balance
    account.balance += amount;
    await account.save();

    // Record transaction
    const transaction = new Transaction({
      userId: req.userId,
      type: "credit",
      amount,
      description: description || "Deposit to wallet",
    });
    await transaction.save();

    res.json({
      success: true,
      message: "Deposit successful",
      newBalance: account.balance,
    });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
