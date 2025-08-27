import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

// ✅ connect once globally (avoid multiple sockets)
const socket = io("http://localhost:3006", { autoConnect: false });

export const Chat = () => {
  const { userId } = useParams(); // person you're chatting with
  const myId = localStorage.getItem("userId"); // logged-in user
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🔹 fetch receiver info
  useEffect(() => {
    if (!userId) return;
    
    axios
      .get(`http://localhost:3006/api/v1/user/${userId}`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      })
      .then((res) => {
        setReceiver(res.data.user);
      })
      .catch((err) => {
        console.error("❌ Error fetching user info:", err);
      });
  }, [userId]);

  // 🔹 fetch old messages from backend
  useEffect(() => {
    if (!myId || !userId) return;

    setLoading(true);
    axios
      .get(`http://localhost:3006/api/v1/chat/history/${myId}/${userId}`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      })
      .then((res) => {
        console.log("Fetched messages:", res.data);
        if (res.data.success) {
          setMessages(res.data.messages || []);
        } else {
          console.error("Failed to fetch messages:", res.data.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching history:", err);
        setLoading(false);
      });
  }, [myId, userId]);

  // 🔹 handle socket connection
  useEffect(() => {
    if (!myId) return;

    console.log("Connecting socket for user:", myId);
    
    if (!socket.connected) {
      socket.connect();
    }
    
    socket.emit("join", myId);

    const handleReceiveMessage = (msg) => {
      console.log("Received message via socket:", msg);
      // only add if it's for this chat
      if (
        (msg.sender._id === userId && msg.receiver._id === myId) ||
        (msg.sender._id === myId && msg.receiver._id === userId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [myId, userId]);

  // 🔹 send message
  const sendMessage = () => {
    if (!input.trim()) return;

    const msgData = {
      senderId: myId,
      receiverId: userId,
      content: input,
    };

    console.log("Sending message:", msgData);
    socket.emit("sendMessage", msgData);
    setInput("");
  };

  // Format display name
  const getDisplayName = (user) => {
    if (!user) return "Unknown";
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.username;
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg flex flex-col h-[80vh] items-center justify-center">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg flex flex-col h-[80vh]">
      <div className="p-4 border-b font-bold">
        Chat with {receiver ? getDisplayName(receiver) : userId}
      </div>

      {/* messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id || Math.random()}
              className={`p-3 rounded-lg max-w-[80%] break-words ${
                msg.sender._id === myId
                  ? "bg-blue-500 text-white ml-auto"
                  : "bg-gray-200 text-black"
              }`}
            >
              <div className="font-semibold text-sm">
                {msg.sender._id === myId ? "You" : getDisplayName(msg.sender)}
              </div>
              <div>{msg.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* input box */}
      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};