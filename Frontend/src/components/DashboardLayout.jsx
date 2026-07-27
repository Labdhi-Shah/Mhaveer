import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pt-24 px-4 pb-4 md:pt-28 md:px-6 md:pb-6 ml-0 md:ml-64 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
