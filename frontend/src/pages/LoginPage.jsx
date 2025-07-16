import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/src/assets/images/logo.svg";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setIsLoggedIn, setUserId, setUserName, setChatsFromBackend } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id:
          "149835755959-h1cms67vm400bf7aictuvgs2vm4lk16b.apps.googleusercontent.com",
        callback: handleGoogleCallback,
        auto_select: false,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "pill",
          text: "sign_in_with",
        }
      );
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    const email = payload.email;

    if (!email.endsWith("@iiti.ac.in")) {
      alert("Only IIT Indore users are allowed.");
      return;
    }

    const name = payload.name || email.split("@")[0];
    const userId = email;

    // Save to local storage and AuthContext
    localStorage.setItem("userEmail", email);
    setIsLoggedIn(true);
    setUserId(userId);
    setUserName(name);

    // Sync local chats with backend
    const localChats = JSON.parse(localStorage.getItem("chatList")) || [];
    const localMessages = JSON.parse(localStorage.getItem("chatMessages")) || {};
    try {
      await fetch("http://localhost:5000/chat-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, chats: localChats, chatMessages: localMessages }),
      });
    } catch (err) {
      console.error("Error syncing chats:", err);
    }

    // Fetch history from backend
    try {
      const res = await fetch(`http://localhost:5000/chat-history?userId=${userId}`);
      const data = await res.json();
      setChatsFromBackend(data.chats || [], data.chatMessages || {});
    } catch (err) {
      console.error("Error fetching chats:", err);
    }

    navigate("/chatbot");
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0e001d] via-[#1a0733] to-[#3d2171] text-white">
      <div className="flex flex-wrap justify-center items-start gap-10 px-10 py-24">
        <div className="w-full max-w-md bg-[#3a0066] p-10 rounded-xl border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6">Login</h2>
          <form className="flex flex-col gap-4" autoComplete="on">
            <input
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              required
              className="p-3 rounded bg-white text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              className="p-3 rounded bg-white text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <div className="flex justify-end text-sm text-gray-300 -mt-2 mb-2">
              <Link to="/forgot_password" className="hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="bg-[#cc33ff] hover:bg-[#aa00cc] text-white font-semibold py-3 rounded"
            >
              Login
            </button>

            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 border-t border-gray-400"></div>
              <span className="text-sm text-gray-300">OR</span>
              <div className="flex-1 border-t border-gray-400"></div>
            </div>

            <div id="googleSignInDiv" className="flex justify-center" />

            <p className="text-center text-sm mt-4">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-purple-300 underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>

        <div className="w-full max-w-md bg-[#400080] p-10 rounded-xl border border-white/20 shadow-2xl text-gray-200">
          <h3 className="text-xl font-bold mb-4">Welcome to IITI Bot</h3>
          <p>
            Join the AI-powered journey of IIT Indore. From students to
            researchers, everyone can leverage this platform to access
            personalized insights and services across the academic ecosystem.
          </p>
        </div>
      </div>
    </div>
  );
}
