import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react"; 
import { useEffect } from "react"; // 🌟 1. เพิ่ม useEffect
import Navbar from "./components/navbar";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import Auth from "./pages/Auth";
import { useAuthStore } from "./store/authStore"; 
import FolderPage from "./pages/FolderPage";
import { HomePage } from "./pages/HomePage";
import FolderDetailPage from "./pages/FolderDetailPage";
import RecipePage from "./pages/RecipePage";
import BookmarksPage from "./pages/BookmarksPage";


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
          <Route path="/" element={<HomePage />}/>
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/folders" element={<FolderPage />} />
           <Route path="/folders/:folderId" element={<FolderDetailPage />} />
           <Route path="/recipe/:recipeId" element={<RecipePage />} /> 
           <Route path="/bookmarks" element={<BookmarksPage />} />
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