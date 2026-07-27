import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <Header />
      <Sidebar />
      <main className="pt-20 ml-64 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
