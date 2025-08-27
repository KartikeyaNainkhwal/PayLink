// backend/routes/transactions.js
const express = require("express");
const router = express.Router();
const { Transaction } = require("../db");
const { authMiddleware } = require("../middleware");
// Get transaction history for a specific user
router.get("/:userId",authMiddleware, async (req, res) => {
  const { userId } = req.params;
  
  try {
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json({ success: true, transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
