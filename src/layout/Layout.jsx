import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { logout } from "../store/slices/authSlice";
import { useSelector, useDispatch } from "react-redux";
import AiChatWidget from "../components/chat/AiChatWidget";
import ChatwootWidget from "../components/chat/ChatwootWidget";

const Layout = ({ children }) => {
  const [bIsSidebarOpen, setIsSidebarOpen] = useState(true);
  const [bIsCollapsed, setIsCollapsed] = useState(false);
  const [bIsMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };
  const toggleSidebar = () => {
    setIsCollapsed(!bIsCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Overlay - behind sidebar */}
      {bIsMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - above overlay */}
      <div
        className={`  
          fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out
          ${bIsMobileSidebarOpen ? 'w-56' : 'w-0'} lg:${bIsSidebarOpen ? (bIsCollapsed? 'w-16' : 'w-56') : 'w-0'}
        `}
      >
        <Sidebar 
          onClose={() => setIsSidebarOpen(false)} 
          isCollapsed={bIsCollapsed} 
          onToggle={toggleSidebar} 
          isMobileOpen={bIsMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>
      
      <div 
        className={`
          flex flex-col min-h-screen transition-all duration-300
          ${bIsMobileSidebarOpen ? 'pl-56' : 'pl-0'}
          ${bIsSidebarOpen && bIsCollapsed ? 'lg:pl-16' : ''}
          ${bIsSidebarOpen && !bIsCollapsed ? 'lg:pl-56' : ''}
          ${!bIsSidebarOpen ? 'lg:pl-0' : ''}
        `}
      >
        <Header onMenuClick={() => setIsMobileSidebarOpen(!bIsMobileSidebarOpen)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Floating AI Chat Board Widget */}
      <AiChatWidget />

      {/* Chatwoot Live AI Chat Widget */}
      <ChatwootWidget />
    </div>
  );
};

export default Layout;
