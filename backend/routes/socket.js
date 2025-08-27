const { Message, User } = require("../db");

/**
 * Handles all socket.io events
 * @param {import("socket.io").Server} io
 */
function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("🟢 New user connected:", socket.id);

    /**
     * @event join
     * @desc User joins their own private room (based on userId)
     */
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    /**
     * @event sendMessage
     * @desc Send a message from one user to another (real-time + save in DB)
     */
    socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
      try {
        if (!senderId || !receiverId || !content) {
          console.log("Missing fields in sendMessage");
          return;
        }

        console.log(`Saving message: ${senderId} → ${receiverId}: ${content}`);
        
        const newMessage = new Message({ 
          sender: senderId, 
          receiver: receiverId, 
          content 
        });
        
        await newMessage.save();
        
        // Populate sender and receiver info
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "username firstName lastName")
          .populate("receiver", "username firstName lastName");

        // Format the message for the frontend
        const formattedMessage = {
          _id: populatedMessage._id,
          content: populatedMessage.content,
          timestamp: populatedMessage.timestamp,
          sender: {
            _id: populatedMessage.sender._id,
            username: populatedMessage.sender.username,
            firstName: populatedMessage.sender.firstName,
            lastName: populatedMessage.sender.lastName
          },
          receiver: {
            _id: populatedMessage.receiver._id,
            username: populatedMessage.receiver.username,
            firstName: populatedMessage.receiver.firstName,
            lastName: populatedMessage.receiver.lastName
          }
        };

        console.log("Formatted message:", formattedMessage);

        // Send to receiver instantly
        io.to(receiverId).emit("receiveMessage", formattedMessage);

        // Also send to sender (for immediate feedback)
        io.to(senderId).emit("receiveMessage", formattedMessage);

        console.log(`📩 Message sent successfully: ${senderId} → ${receiverId}: ${content}`);
      } catch (err) {
        console.error("❌ Error saving message:", err);
      }
    });

    /**
     * @event disconnect
     * @desc Triggered when user disconnects
     */
    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
}

module.exports = socketHandler;