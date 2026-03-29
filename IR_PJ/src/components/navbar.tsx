import { User, ChefHat, LogOut, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation paths

import { useAuthStore } from "../store/authStore"; 

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout(); 
    navigate("/auth");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      // 1. CHANGED: Added bg-black and text-white for the dark theme
      className="fixed top-0 left-0 right-0 z-50 bg-black backdrop-blur-md border-b border-gray-800 text-white"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <ChefHat className="w-7 h-7 text-primary" />
          <span className="font-display text-xl font-bold">
            FlavorVault
          </span>
        </div>

        {/* 2. CHANGED: Added actual Navigation Links here */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-8 font-medium">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/bookmarks" className="hover:text-primary transition-colors">
              Bookmarks
            </Link>
            <Link to="/folders" className="hover:text-primary transition-colors">
              My Folders
            </Link>
            
          </div>
          
        )}

        {/* User Profile Action */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                  {/* Adjusted profile icon background for dark mode */}
                  <div className="p-1.5 rounded-full bg-primary/20 text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <span>{user.username}</span>
                </div>
              )}
              
              <button 
                onClick={handleLogout}
                // Adjusted logout button colors to look better on black
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          )}
        </div>
        
      </div>
    </motion.nav>
  );
}