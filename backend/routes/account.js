// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account, Transaction } = require('../db');
const { default: mongoose } = require('mongoose');

const router = express.Router();

// Get balance
router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({ userId: req.userId });
    res.json({ balance: account.balance });
});

// Transfer money
router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, to, description } = req.body;

        // Fetch sender and receiver accounts
        const senderAccount = await Account.findOne({ userId: req.userId }).session(session);
        const receiverAccount = await Account.findOne({ userId: to }).session(session);

        if (!senderAccount || senderAccount.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Insufficient balance" });
        }
        if (!receiverAccount) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid account" });
        }

        // Perform the balance update
        senderAccount.balance -= amount;
        receiverAccount.balance += amount;
        await senderAccount.save({ session });
        await receiverAccount.save({ session });

        // Record transactions
        const senderTx = new Transaction({
            userId: req.userId,
            type: "debit",
            amount,
            description: description || `Sent to ${to}`,
        });
        const receiverTx = new Transaction({
            userId: to,
            type: "credit",
            amount,
            description: description || `Received from ${req.userId}`,
        });
        await senderTx.save({ session });
        await receiverTx.save({ session });

        // Commit
        await session.commitTransaction();
        res.json({ message: "Transfer successful" });

    } catch (err) {
        await session.abortTransaction();
        console.error(err);
        res.status(500).json({ message: "Server error" });
    } finally {
        session.endSession();
    }
});

module.exports = router;
