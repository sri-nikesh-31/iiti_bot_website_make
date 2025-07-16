import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "./Sidebar";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [chats, setChats] = useState(() => {
    const stored = localStorage.getItem("chatList");
    return stored ? JSON.parse(stored) : [];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const stored = localStorage.getItem("activeChatId");
    return stored || null;
  });

  const [chatMessages, setChatMessages] = useState(() => {
    const stored = localStorage.getItem("chatMessages");
    return stored ? JSON.parse(stored) : {};
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // LocalStorage sync
  useEffect(() => {
    localStorage.setItem("chatList", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("activeChatId", activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  const generateUniqueTitle = () => {
    let index = 1;
    let title;
    do {
      title = `New chat ${index}`;
      index++;
    } while (chats.some((chat) => chat.title === title));
    return title;
  };

  const handleNewChat = () => {
    const newChat = {
      id: uuidv4(),
      title: generateUniqueTitle(),
    };
    const updatedChats = [newChat, ...chats];
    const updatedMessages = { ...chatMessages, [newChat.id]: [] };

    setChats(updatedChats);
    setActiveChatId(newChat.id);
    setChatMessages(updatedMessages);
    navigate("/chatbot");
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    navigate("/chatbot");
  };

  const handleRenameChat = (id, newTitle) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === id ? { ...chat, title: newTitle } : chat))
    );
  };

  const handleDeleteChat = (id) => {
    const remainingChats = chats.filter((chat) => chat.id !== id);
    const updatedMessages = { ...chatMessages };
    delete updatedMessages[id];

    setChats(remainingChats);
    setChatMessages(updatedMessages);

    if (remainingChats.length > 0) {
      const nextChatId = remainingChats[0].id;
      setActiveChatId(nextChatId);
      navigate("/chatbot");
    } else {
      // No chats left → create a new one
      const newChat = {
        id: uuidv4(),
        title: generateUniqueTitle(),
      };
      const updatedMessages = { ...chatMessages, [newChat.id]: [] };
      setChats([newChat]);
      setActiveChatId(newChat.id);
      setChatMessages(updatedMessages);
      navigate("/chatbot");
    }
  };

  const handleFirstUserMessage = (messageText) => {
    const newChat = { id: uuidv4(), title: generateUniqueTitle() };
    const newMessages = [{ sender: "user", text: messageText }];
    const updatedChats = [newChat, ...chats];

    setChats(updatedChats);
    setActiveChatId(newChat.id);
    setChatMessages((prev) => ({
      ...prev,
      [newChat.id]: newMessages,
    }));
    return newChat.id;
  };

  // ✅ Always create a new chat on homepage "Get Started"
  useEffect(() => {
    if (location.state?.createNewChat) {
      const newChat = {
        id: uuidv4(),
        title: generateUniqueTitle(),
      };
      const updatedChats = [newChat, ...chats];
      const updatedMessages = { ...chatMessages, [newChat.id]: [] };

      setChats(updatedChats);
      setActiveChatId(newChat.id);
      setChatMessages(updatedMessages);

      navigate("/chatbot", { replace: true, state: {} }); // Clear the flag
    }
  }, [location]);

  return (
    <div className="flex min-h-screen">
      {!sidebarCollapsed && (
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          onToggleCollapse={() => setSidebarCollapsed(true)}
        />
      )}

      {sidebarCollapsed && (
        <div className="w-10 bg-[#1b0d3a] text-white flex items-center justify-center">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="text-white hover:text-purple-400"
            title="Expand Sidebar"
          >
            &gt;&gt;
          </button>
        </div>
      )}

      <div className="flex-grow">
        <Outlet
          context={{
            activeChatId,
            chats,
            chatMessages,
            setChatMessages,
            setActiveChatId,
            handleFirstUserMessage,
            handleNewChat,
          }}
        />
      </div>
    </div>
  );
}
