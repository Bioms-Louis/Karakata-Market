import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import useCartSync from '../hooks/useCart';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';

const MainLayout = () => {
  useCartSync(); 
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 bg-gray-50">
        <Outlet />
        <ScrollToTop />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;