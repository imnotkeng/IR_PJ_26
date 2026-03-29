import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {  Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore"; 
import myLogo from '@/assets/Logo.png';
import { API_URL } from '../config'; // 🌟 Added import

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  
  // UI States
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const setToken = useAuthStore((state) => state.setToken);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // 1. LOGIN FLOW
        const formData = new URLSearchParams();
        formData.append("username", email); 
        formData.append("password", password);

        // 🌟 Changed hardcoded URL to API_URL
        const res = await fetch(`${API_URL}/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Login failed");
        }

        const data = await res.json();
        setToken(data.access_token); 
        await fetchUser();
        navigate("/");

      } else {
        // 2. SIGNUP FLOW
        // 🌟 Changed hardcoded URL to API_URL
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: name,
            email: email,
            password: password,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Signup failed");
        }

        setIsLogin(true);
        setPassword("");
        setError("Account created successfully! Please sign in.");
      }
    } catch (err) {
  setError(err instanceof Error ? err.message : "An unexpected error occurred");
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600/30" />
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width: `${80 + i * 60}px`,
                height: `${80 + i * 60}px`,
                top: `${10 + i * 14}%`,
                left: `${5 + i * 12}%`,
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-12"
        >
          <img 
            src={myLogo} 
            alt="Logo" 
            className="h-28 w-auto mx-auto mb-6 object-contain drop-shadow-lg" 
          />
          <h1 className="text-4xl font-bold text-white mb-4">
            Re-Zip
          </h1>
          <p className="text-white/70 text-lg max-w-sm mx-auto leading-relaxed">
            Your personal recipe collection. Save, organize, and rediscover the dishes you love.
          </p>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img 
              src={myLogo} 
              alt="Logo" 
              className="h-10 w-auto object-contain" 
            />
            <span className="text-2xl font-bold text-gray-900">Re-Zip</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-gray-500 mt-2">
              {isLogin
                ? "Sign in to access your saved recipes"
                : "Start building your recipe collection"}
            </p>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-md flex items-start gap-3 ${error.includes("successfully") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      placeholder="Your username"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      className="w-full pl-10 h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="text"
                  placeholder="you@example.com (or username)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-base font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(""); 
              }}
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}