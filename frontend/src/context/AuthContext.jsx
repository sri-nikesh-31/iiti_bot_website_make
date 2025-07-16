// ✅ AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState({});

  // Load user on initial mount
  useEffect(() => {
    const savedUser = localStorage.getItem("userEmail");
    if (savedUser) {
      setIsLoggedIn(true);
      setUserId(savedUser);
      fetchChatHistory(savedUser); // Load from backend
    } else {
      // Guest cleanup: clear old chat leftovers
      Object.keys(localStorage)
        .filter((key) => key.startsWith("chats_") || key === "chatMessages")
        .forEach((key) => localStorage.removeItem(key));
    }
  }, []);

  // 🔁 Fetch chat history from backend
  const fetchChatHistory = async (email) => {
    try {
      const res = await axios.post("http://localhost:5000/chat-history", { email });
      const chats = res.data.chats || {};
      setChatMessages(chats);

      // Save to localStorage
      localStorage.setItem("chatMessages", JSON.stringify(chats));
      const chatList = Object.keys(chats).map((id) => ({
        id,
        title: chats[id][0]?.text?.slice(0, 20) || "New chat",
      }));
      localStorage.setItem("chatList", JSON.stringify(chatList));
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  };

  // 💾 Sync chat history to backend on update
  useEffect(() => {
    if (isLoggedIn && userId) {
      axios
        .put("http://localhost:5000/chat-history", {
          email: userId,
          chats: chatMessages,
        })
        .catch((err) => console.error("Failed to save chat history:", err));
    }
  }, [chatMessages, isLoggedIn, userId]);

  // 🔐 Logout function
  const logout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("chatList");
    Object.keys(localStorage)
      .filter((key) => key.startsWith("chats_") || key.startsWith("chat_"))
      .forEach((key) => localStorage.removeItem(key));
    setIsLoggedIn(false);
    setUserId(null);
    setChatMessages({});
  };

  // ✅ Handle Google login success
  const handleLoginSuccess = async (response) => {
    const userEmail = response.email;
    const userName = response.name;

    setIsLoggedIn(true);
    setUserId(userEmail);
    localStorage.setItem("userEmail", userEmail);

    // Send existing guest chats to backend if any
    const localChats = localStorage.getItem("chatMessages");
    if (localChats) {
      try {
        await axios.put("http://localhost:5000/chat-history", {
          email: userEmail,
          chats: JSON.parse(localChats),
        });
      } catch (error) {
        console.error("Error syncing chats to backend:", error);
      }
    }

    // Fetch latest history
    fetchChatHistory(userEmail);

    // Cleanup guest
    Object.keys(localStorage)
      .filter((key) => key.startsWith("chats_") || key === "chatMessages")
      .forEach((key) => localStorage.removeItem(key));
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userId,
        setIsLoggedIn,
        setUserId,
        chatMessages,
        setChatMessages,
        logout,
        handleLoginSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);