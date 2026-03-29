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

  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <>
      {!isAuthPage && <Navbar />}

      <div className={!isAuthPage ? "pt-16" : ""}>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchResultsPage /></ProtectedRoute>} />
          <Route path="/folders" element={<ProtectedRoute><FolderPage /></ProtectedRoute>} />
          <Route path="/folders/:folderId" element={<ProtectedRoute><FolderDetailPage /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />

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