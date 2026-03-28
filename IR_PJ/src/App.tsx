import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react"; 
import { useEffect } from "react"; // 🌟 1. เพิ่ม useEffect
import Navbar from "./components/navbar";
import { Searchpage } from "./pages/Searchpage";
import Auth from "./pages/Auth";
import { useAuthStore } from "./store/authStore"; // 🌟 2. Import Store ของเราเข้ามา


const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("access_token");
  
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>; 
};


const MainLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  // 🌟 3. ดึงฟังก์ชัน fetchUser มาจาก Store
  const fetchUser = useAuthStore((state) => state.fetchUser);

  // 🌟 4. สั่งให้ดึงข้อมูล User 1 ครั้งตอนเปิดเว็บขึ้นมา (ถ้ามี Token)
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <>
      {!isAuthPage && <Navbar />}

      <div className={!isAuthPage ? "pt-16" : ""}>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Searchpage />
              </ProtectedRoute>
            } 
          />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}