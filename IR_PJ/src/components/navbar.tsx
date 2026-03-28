import { User, ChefHat, LogOut, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore"; // Import Store ของเรามาใช้

export default function Navbar() {
  const navigate = useNavigate();
  
  // ดึงค่าต่างๆ มาจาก Store ได้เลยตรงๆ
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout(); // เรียกใช้ฟังก์ชันจาก Store
    navigate("/auth");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-accent/95 backdrop-blur-md border-b border-accent"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <ChefHat className="w-7 h-7 text-primary" />
          <span className="font-display text-xl font-bold text-accent-foreground">
            FlavorVault
          </span>
        </div>

        {/* Navigation Links */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-8">
            {/* ... NavLinks ของคุณเหมือนเดิม ... */}
          </div>
        )}

        {/* User Profile Action */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* ดึงชื่อ user.username จาก Store มาแสดงได้เลย */}
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent-foreground">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <span>{user.username}</span>
                </div>
              )}
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
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