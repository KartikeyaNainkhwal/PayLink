const express = require("express");
const { User, Message } = require("../db");

const router = express.Router();

/**
 * @route   POST /api/v1/chat/send
 * @desc    Send a message (saved to DB, no socket here)
 */
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "Sender or receiver not found" });
    }

    const newMessage = new Message({ sender: senderId, receiver: receiverId, content });
    await newMessage.save();

    // Populate sender info before sending response
    await newMessage.populate("sender", "username firstName lastName");
    await newMessage.populate("receiver", "username firstName lastName");

    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/v1/chat/history/:user1Id/:user2Id
 * @desc    Get chat history between two users
 */
router.get("/history/:user1Id/:user2Id", async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: user1Id, receiver: user2Id },
        { sender: user2Id, receiver: user1Id },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender", "username firstName lastName")
      .populate("receiver", "username firstName lastName");

    res.json({ success: true, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/v1/chat/inbox/:userId
 * @desc    Get inbox messages for a user
 */
router.get("/inbox/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const inbox = await Message.find({ receiver: userId })
      .sort({ timestamp: -1 })
      .populate("sender", "username firstName lastName");

    res.json({ success: true, inbox });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;