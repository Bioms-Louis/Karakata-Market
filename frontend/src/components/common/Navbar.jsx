import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, User, Bell, Search, Menu, X,
  ChevronDown, ChevronRight, LogOut, LayoutDashboard,
  Package, PhoneCall, Mail, Heart, Grid3X3,
  Smartphone, Tv, Shirt, Monitor, HeartPlus,
  Sofa, Headphones, ShoppingBag, Baby, Gamepad2,
  Building2, Tag, Layers, Store, WashingMachine, Apple
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';
import api from '../../api/axios';

const CATEGORY_ICONS = {
  'appliances':              <WashingMachine size={16} />,
  'phones & tablets':        <Smartphone size={16} />,
  'phones and tablets':      <Smartphone size={16} />,
  'electronics':             <Tv size={16} />,
  'fashion':                 <Shirt size={16} />,
  'computing':               <Monitor size={16} />,
  'health & beauty':         <HeartPlus size={16} />,
  'health and beauty':       <HeartPlus size={16} />,
  'home & office':           <Sofa size={16} />,
  'home and office':         <Sofa size={16} />,
  'electronic accessories':  <Headphones size={16} />,
  'electronics accessories': <Headphones size={16} />,
  'supermarket':             <Apple size={16} />,
  'baby products':           <Baby size={16} />,
  'gaming':                  <Gamepad2 size={16} />,
  'real estate':             <Building2 size={16} />,
  'other categories':        <Grid3X3 size={16} />,
};
const getCategoryIcon = (name) => CATEGORY_ICONS[name?.toLowerCase()] ?? <Tag size={16} />;

const Badge = ({ count }) => {
  if (!count || count < 1) return null;
  return (
    <span
      className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-0.5
                 rounded-full text-[10px] font-extrabold flex items-center
                 justify-center leading-none shadow-sm z-10"
      style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const FALLBACK_CATEGORIES = [
  { id: 'f1', 
    name: 'Appliances',
    slug: 'appliances',           
    parent_id: null, 
    children: [
    { id: 'f1a', name: 'Small Applainces', slug: 'small-appliances', parent_id: 'f1' },
    { id: 'f1b',  name: 'Large Appliances', slug: 'large-appliances', parent_id: 'f1' },
    { id: 'f1c',  name: 'Home Appliances', slug: 'home-appliances', parent_id: 'f1' },
  ]},
  { id: 'f2',  
    name: 'Phones & Tablets',
    slug: 'phones-tablets', 
    parent_id: null, 
    children: [
    { id: 'f2a',  name: 'Smartphones', slug: 'smartphones', parent_id: 'f2' },
    { id: 'f2b',  name: 'iPads & Tablets', slug: 'ipad-tablets', parent_id: 'f2' },
    { id: 'f2c',  name: 'Mobile Accessories', slug: 'mobile++-accessories', parent_id: 'f2' },
  ]},
  { id: 'f3', 
    name: 'Electronics', 
    slug: 'electronics', 
    parent_id: null, 
    children: [
    { id: 'f3a',  name: 'Television', slug: 'television', parent_id: 'f3' },
    { id: 'f3b',  name: 'Home Entertainment', slug: 'home-entertainment', parent_id: 'f3' },
    { id: 'f3c',  name: 'camera', slug: 'camera', parent_id: 'f3' },
    { id: 'f3d',  name: 'Generators', slug: 'generators', parent_id: 'f3' },
  ]},
  {
  id: 'f4',
  name: 'Fashion',
  slug: 'fashion',
  parent_id: null,
  children: [

    {
      id: 'f4a',
      name: "Men's Fashion",
      slug: 'mens-fashion',
      parent_id: 'f4',
      children: [
        { id: 'f4a1', name: 'Clothing', slug: 'mens-clothing', parent_id: 'f4a' },
        { id: 'f4a2', name: 'Shoes', slug: 'mens-shoes', parent_id: 'f4a' },
        { id: 'f4a3', name: 'Accessories', slug: 'mens-accessories', parent_id: 'f4a' },
        { id: 'f4a4', name: 'Underwear & Sleepwear', slug: 'mens-underwear-sleepwear', parent_id: 'f4a' },
        { id: 'f4a5', name: 'Traditional Wear', slug: 'mens-traditional-wear', parent_id: 'f4a' },
        { id: 'f4a6', name: 'T-shirts', slug: 't-shirts', parent_id: 'f4a' },
        { id: 'f4a7', name: 'Polo Shirt', slug: 'polo-shirts', parent_id: 'f4a' },
        { id: 'f4a8', name: 'Trousers & Chinos', slug: 'trousers-chinos', parent_id: 'f4a' },
        { id: 'f4a9', name: 'Sneakers', slug: 'sneakers', parent_id: 'f4a' },
        { id: 'f4a10', name: 'Jewelry', slug: 'mens-jewelry', parent_id: 'f4a' },
        { id: 'f4a11', name: 'Jerseys', slug: 'jerseys', parent_id: 'f4a' }
      ]
    },

    {
      id: 'f4b',
      name: "Women's Fashion",
      slug: 'womens-fashion',
      parent_id: 'f4',
      children: [
        { id: 'f4b1', name: 'Clothing', slug: 'womens-clothing', parent_id: 'f4b' },
        { id: 'f4b2', name: 'Shoes', slug: 'womens-shoes', parent_id: 'f4b' },
        { id: 'f4b3', name: 'Accessories', slug: 'womens-accessories', parent_id: 'f4b' },
        { id: 'f4b4', name: 'Jewelry', slug: 'womens-jewelry', parent_id: 'f4b' },
        { id: 'f4b5', name: 'Handbags & Wallets', slug: 'womens-handbags-wallet', parent_id: 'f4b' },
        { id: 'f4b6', name: 'Underwear & Sleepwear', slug: 'womens-underwear-sleepwear', parent_id: 'f4b' },
        { id: 'f4b7', name: 'Maternity', slug: 'womens-maternity-wears', parent_id: 'f4b' },
        { id: 'f4b8', name: 'Dresses', slug: 'womens-dresses', parent_id: 'f4b' },
        { id: 'f4b9', name: 'Traditional Wear', slug: 'womens-traditional-wear', parent_id: 'f4b' },
        { id: 'f4b10', name: 'Beach & Swimwear', slug: 'womens-beach-swimwear', parent_id: 'f4b' },
        { id: 'f4b11', name: 'Flats', slug: 'womens-flats', parent_id: 'f4b' }
      ]
    },

    {
      id: 'f4c',
      name: 'Kids fashion',
      slug: 'kids-fashion',
      parent_id: 'f4',
      children: [
        { id: 'f4c1', name: 'Boys Fashion', slug: 'boys-fashion', parent_id: 'f4c' },
        { id: 'f4c2', name: 'Girls Fashion', slug: 'girls-fashion', parent_id: 'f4c' }
      ]
    },

    {
      id: 'f4d',
      name: 'Watches',
      slug: "watches",
      parent_id: 'f4',
      children: [
        { id: 'f4d1', name: "Men's Watches", slug: "mens-watches", parent_id: 'f4d' },
        { id: 'f4d2', name: "Women's Fashion", slug: "womens-watches", parent_id: 'f4d' },
        { id: 'f4d3', name: 'All Watches', slug: "all-watches", parent_id: 'f4d' }
      ]
    },

    {
      id: 'f4e',
      name: 'Sunglasses',
      slug: "sunglasses",
      parent_id: 'f4',
      children: [
        { id: 'f4e1', name: "Men's Sunglasses", slug: "mens-sunglasses", parent_id: 'f4e' },
        { id: 'f4e2', name: "Women's Sunglasses", slug: "womens-sunglasses", parent_id: 'f4e' },
        { id: 'f4e3', name: 'All Sunglasses', slug: "all-sunglasses", parent_id: 'f4e' }
      ]
    },
    {
      id: 'f4f',
      name: 'All Fashion',
      slug: "all-fashion",
      parent_id: 'f4',
      children: [
        { id: 'f4f1', name: 'Fabrics', slug: "fabrics", parent_id: 'f4f' },
        { id: 'f4f2', name: 'Luggage, Travel & Gear', slug: "luggage-travel-gear", parent_id: 'f4f' },
        { id: 'f4f3', name: 'Multi-pack', slug: "multi-pack", parent_id: 'f4f' },
        { id: 'f4f4', name: 'Traditional & Cultural Wear', slug: "traditional-cultural-wear", parent_id: 'f4f' },
        { id: 'f4f5', name: 'Uniforms, Work & Safety', slug: "uniforms-work-safety", parent_id: 'f4f' }
      ]
    }
  ]
},
  { id: 'f5',  
    name: 'Computing',
    slug: 'computing', 
    parent_id: null, 
    children: [
    { id: 'f5a', name: 'Laptops',  slug: 'laptop', parent_id: 'f5' },
    { id: 'f5b', name: 'Computer Accessories', slug: 'computer-accessories', parent_id: 'f5' },
    { id: 'f5c', name: 'Computer Components', slug: 'computer-components', parent_id: 'f5' },
    { id: 'f5d', name: 'Printer & Scanners', slug: 'printers', parent_id: 'f5' },
    { id: 'f5e', name: 'Computer Network', slug: 'computer-network', parent_id: 'f5' },
    { id: 'f5f', name: 'Storage Devices', slug: 'storage', parent_id: 'f5' },
    { id: 'f5g', name: 'Software', slug: 'software', parent_id: 'f5' },
  ]},
  { id: 'f6',  
    name: 'Health & Beauty',
    slug: 'health-beauty',
    parent_id: null, 
    children: [
    { id: 'f6a', name: 'Bath & Body', slug: 'bath-body', parent_id: 'f6' },
    { id: 'f6b', name: 'Beauty Tools', slug: 'beauty-tools', parent_id: 'f6' },
    { id: 'f6c', name: 'Fragrances', slug: 'fragrances', parent_id: 'f6' },
    { id: 'f6d', name: 'Food Supplements', slug: 'food-supplements', parent_id: 'f6' },
    { id: 'f6e', name: 'Skincare', slug: 'skin-care', parent_id: 'f6' },
    { id: 'f6f', name: 'Medical Supplies', slug: 'medical-supplies', parent_id: 'f6' },
    { id: 'f6g', name: 'Personal Cares', slug: 'personal-cares', parent_id: 'f6' },
    { id: 'f6h', name: 'Wigs & Hair Care', slug: 'wigs-hair-care', parent_id: 'f6'},
  ]},
  { id: 'f7',  
    name: 'Home & Office',
    slug: 'home-office', 
    parent_id: null, 
    children: [
    { id: 'f7a', name: 'Home Furniture', slug: 'home-furniture', parent_id: 'f7' },
    { id: 'f7b', name: 'Home Decoration', slug: 'home-decoration', parent_id: 'f7' },
    { id: 'f7c', name: 'Kitchen & Dining', slug: 'kitchen', parent_id: 'f7' },
    { id: 'f7d', name: 'Office Furniture', slug: 'office-furniture', parent_id: 'f7' },
  ]},
  { id: 'f8',  
    name: 'Electronic Accessories',
    slug: 'electronic-accessories',
    parent_id: null, 
    children: [
    { id: 'f8a', name: 'Audio', slug: 'audio', parent_id: 'f8' },
    { id: 'f8b', name: 'Wearable', slug: 'wearable', parent_id: 'f8' },
    { id: 'f8c', name: 'Security Cameras', slug: 'security-cameras', parent_id: 'f8' },
  ]},
  { id: 'f9',  
    name: 'Supermarket',
    slug: 'supermarket', 
    parent_id: null, 
    children: [
    { id: 'f9a', name: 'Food', slug: 'food', parent_id: 'f9' },
    { id: 'f9b', name: 'Beverages', slug: 'beverages', parent_id: 'f9' },
    { id: 'f9c', name: 'House Cleaning', slug: 'house-cleaning', parent_id: 'f9' },
    { id: 'f9d', name: 'Wine, Beer & Spirit', slug: 'wine-beer-spirit', parent_id: 'f9' },
  ]},
  { id: 'f10', 
    name: 'Baby Products',
    slug: 'baby-products', 
    parent_id: null, 
    children: [
    { id: 'f10a', name: 'Feeding', slug: 'feeding', parent_id: 'f10' },
    { id: 'f10b', name: 'Baby Gear', slug: 'baby-gear', parent_id: 'f10' },
    { id: 'f10c', name: 'Diapering & Potty', slug: 'diapering-potty', parent_id: 'f10' },
  ]},
  { id: 'f11',
    name: 'Gaming', 
    slug: 'gaming', 
    parent_id: null, 
    children: [
    { id: 'f11a', name: 'Consoles', slug: 'consoles', parent_id: 'f11' },
    { id: 'f11b', name: 'Console Accessories', slug: 'console-accessories', parent_id: 'f11' },
  ]},
  { id: 'f12', 
    name: 'Real Estate',
    slug: 'real-estate', 
    parent_id: null, 
    children: [
    { id: 'f12a', name: 'Houses for Sale', slug: 'houses-for-sale', parent_id: 'f12' },
    { id: 'f12b', name: 'Houses for Rent', slug: 'houses-for-rent', parent_id: 'f12' },
    { id: 'f12c', name: 'Land & Plots', slug: 'land-plots', parent_id: 'f12' },
    { id: 'f12d', name: 'Commercial Property', slug: 'commercial-property', parent_id: 'f12' },
  ]},
  { id: 'f13', 
    name: 'Other Categories',
    slug: 'other-categories-', 
    parent_id: null, 
    children: [
    { id: 'f13a', name: 'Automobile', slug: 'automobile', parent_id: 'f13' },
    { id: 'f13b', name: 'Sports & Outdoor', slug: 'sports-outdoor', parent_id: 'f13' },
    { id: 'f13c', name: 'Sleep & Wellness', slug: 'sleep-wellness', parent_id: 'f13' },
    { id: 'f13d', name: 'Toys & Games', slug: 'toys-games', parent_id: 'f13' },
  ]},
];

const AllCategoriesPanel = ({ categories, onClose }) => {
  const merged = categories;
  const firstWithChildren = merged.find(c => c.children?.length > 0);
  const [activeParent, setActiveParent] = useState(firstWithChildren ?? merged[0] ?? null);
  const subcategories = activeParent?.children ?? [];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute left-0 top-full z-50 overflow-hidden"
        style={{
          width: '780px', maxWidth: '96vw',
          borderRadius: '0 0 20px 20px',
          backgroundColor: '#ffffff',
          boxShadow: '0 24px 60px rgba(60,26,91,0.22)',
          border: '1px solid #e8e0f7',
          borderTop: '3px solid #ffc70e',
          animation: 'megaPanelIn .18s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="flex" style={{ minHeight: '70vh' }}>

          
          <div
              className="shrink-0 overflow-y-auto hide-scrollbar"
              style={{
                width: '240px',
                maxHeight: '70vh',
                backgroundColor: '#f9f6fd',
                borderRight: '1px solid #ede6f9'
              }}
            >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: '#a78bc4' }}>
                All Categories
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#ede6f9', color: '#7c5fa8' }}>
                {categories.length}
              </span>
            </div>

            {categories.map((cat) => {
              const isActive = activeParent?.id === cat.id;
              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => setActiveParent(cat)}
                  className="mx-2 mb-0.5"
                >
                  <div
                    className="flex items-center rounded-xl transition-all duration-100 cursor-pointer"
                    style={{ backgroundColor: isActive ? '#3c1a5b' : 'transparent' }}
                  >
                    <Link
                      to={`/products?category=${encodeURIComponent(cat.slug)}`}
                      onClick={onClose}
                      className="flex items-center gap-3 flex-1 px-3 py-2.5 text-sm font-semibold"
                      style={{ color: isActive ? '#ffffff' : '#3c1a5b' }}
                    >
                      <span
                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(60,26,91,0.08)' }}
                      >
                        <span style={{ color: isActive ? '#ffc70e' : '#3c1a5b' }}>
                          {getCategoryIcon(cat.name)}
                        </span>
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </Link>
                    {cat.children?.length > 0 && (
                      <ChevronRight
                        size={13} className="mr-3 shrink-0"
                        style={{ color: isActive ? '#ffc70e' : '#c4aee0' }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <div className="h-4" />
          </div>

          
          <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            {activeParent && (
              <>
                
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#f0eafb' }}
                    >
                      <span style={{ color: '#3c1a5b' }}>{getCategoryIcon(activeParent.name)}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-black leading-tight" style={{ color: '#3c1a5b' }}>
                        {activeParent.name}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: '#a78bc4' }}>
                        {subcategories.length > 0
                          ? `${subcategories.length} subcategories`
                          : 'Browse all products in this category'}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/products?category=${encodeURIComponent(activeParent.slug)}`}
                    onClick={onClose}
                    className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl shrink-0 transition-all hover:scale-105"
                    style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
                  >
                    View All <ChevronRight size={11} />
                  </Link>
                </div>

               
                {subcategories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {subcategories.map((sub) => (
                      <div key={sub.id} className="mb-4">

                        <Link
                          to={`/products?category=${encodeURIComponent(sub.slug)}`}
                          onClick={onClose}
                          className="flex items-center gap-2 font-medium text-lg mb-4"
                          style={{ color: '#3c1a5b' }}
                        >
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: 'rgba(60,26,91,0.1)' }}>
                            <Layers size={12} />
                          </span>
                          <span className="truncate">{sub.name}</span>
                        </Link>

                        {sub.children && (
                          <div className="grid grid-cols-2 gap-2 pl-2">
                            {sub.children.map((child) => (
                              <Link
                                key={child.id}
                                to={`/products?category=${encodeURIComponent(child.slug)}`}
                                onClick={onClose}
                                className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition"
                                style={{ backgroundColor: '#f9f6fd', color: '#3c1a5b' }}
                              >
                                <span className="w-1 h-5 rounded-full bg-secondary"></span>
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center h-40 rounded-2xl text-center"
                    style={{ backgroundColor: '#f9f6fd' }}
                  >
                    <ShoppingBag size={30} className="mb-3" style={{ color: '#c4aee0' }} />
                    <p className="text-sm font-semibold mb-3" style={{ color: '#a78bc4' }}>
                      Browse all {activeParent.name} products
                    </p>
                    <Link
                      to={`/products?category=${encodeURIComponent(activeParent.slug)}`}
                      onClick={onClose}
                      className="text-xs font-bold px-5 py-2 rounded-xl transition-all hover:opacity-80"
                      style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
                    >
                      Shop Now →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const CategoryNavItem = ({ category, isActive }) => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const hasChildren = (category.children?.length ?? 0) > 0;
  const show = () => { clearTimeout(timerRef.current); setOpen(true); };
  const hide = () => { timerRef.current = setTimeout(() => setOpen(false), 140); };
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return (
    <div className="relative shrink-0"
         onMouseEnter={hasChildren ? show : undefined}
         onMouseLeave={hasChildren ? hide : undefined}>
      <Link
        to={`/products?category=${encodeURIComponent(category.slug)}`}
        className="flex items-center gap-1 py-2 text-sm font-semibold whitespace-nowrap relative group transition-colors"
        style={{ color: isActive ? '#ffc70e' : 'rgba(215,200,240,0.9)' }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(215,200,240,0.9)'; }}
      >
        {category.name}
        {hasChildren && (
          <ChevronDown size={12} className="shrink-0 transition-transform duration-200"
                       style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        )}
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300"
          style={{ backgroundColor: '#ffc70e', transform: isActive ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left' }}
        />
      </Link>
      {hasChildren && open && (
        <div className="absolute left-0 top-full z-50 pt-1"
             onMouseEnter={show} onMouseLeave={hide}>
          <div className="overflow-hidden py-2"
               style={{
                 minWidth: '220px', backgroundColor: '#fff',
                 borderRadius: '14px',
                 boxShadow: '0 16px 48px rgba(60,26,91,0.18)',
                 border: '1px solid #ede6f9',
                 animation: 'flyoutIn .14s cubic-bezier(.4,0,.2,1)',
               }}>
            <div className="flex items-center gap-2 px-4 py-2.5 mb-1"
                 style={{ borderBottom: '1px solid #f2ecfb' }}>
              <span style={{ color: '#3c1a5b', opacity: 0.6 }}>{getCategoryIcon(category.name)}</span>
              <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#a78bc4' }}>
                {category.name}
              </p>
            </div>
            {category.children.map((sub) => (
              <Link
                key={sub.id}
                to={`/products?category=${encodeURIComponent(sub.slug)}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-100"
                style={{ color: '#3c1a5b' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9f6fd'; e.currentTarget.style.paddingLeft = '20px'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.paddingLeft = '16px'; }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#c4aee0' }} />
                {sub.name}
              </Link>
            ))}
            <div className="px-4 pt-2.5 pb-1 mt-1" style={{ borderTop: '1px solid #f2ecfb' }}>
              <Link
                to={`/products?category=${encodeURIComponent(category.slug)}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-60"
                style={{ color: '#3c1a5b' }}
              >
                <Store size={11} /> View all {category.name} <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen]             = useState(false);
  const [isProfileOpen, setIsProfileOpen]       = useState(false);
  const [isCatPanelOpen, setIsCatPanelOpen]     = useState(false);
  const [searchQuery, setSearchQuery]           = useState('');
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);
  const [mobileExpandedSubCat, setMobileExpandedSubCat] = useState(null);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { cartItemCount }  = useCartStore();
  const { wishlistCount }  = useWishlistStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCatPanelOpen(false);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname, location.search]);

  const categoryTree = FALLBACK_CATEGORIES;

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return (res.data?.data?.notifications ?? []).filter(n => !n.is_read).length;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
    setIsProfileOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin')  return '/admin/dashboard';
    if (user?.role === 'vendor') return '/vendor/dashboard';
    return '/orders';
  };

  const activeCat = new URLSearchParams(location.search).get('category');

  return (
    <>
      <style>{`
        @keyframes megaPanelIn {
          from { opacity:0; transform:translateY(-10px) scaleY(0.97); }
          to   { opacity:1; transform:translateY(0) scaleY(1); }
        }
        @keyframes flyoutIn {
          from { opacity:0; transform:translateY(-6px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes profileIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .hide-scrollbar { scrollbar-width:none; -ms-overflow-style:none; }
        .hide-scrollbar::-webkit-scrollbar { display:none; }
      `}</style>

      <header className="sticky top-0 z-50"
              style={{ backgroundColor: '#3c1a5b', boxShadow: '0 4px 24px rgba(60,26,91,0.25)' }}>

        <div className="text-center py-1.5 text-xs font-semibold"
             style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}>
          <PhoneCall className="inline mr-1.5" size={15} />
          <a href="tel:+2348026888555" className="hover:text-secondary">+234 802 688 8555</a>
          <span className="mx-4 opacity-40">|</span>
          <Mail className="inline mr-1.5" size={15} />
          <a href="mailto:contact@karakata.market" className="hover:text-secondary">contact@karakata.market</a>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="flex items-center gap-4 h-18">

            <button onClick={() => setIsMenuOpen(v => !v)}
                    className="md:hidden p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-all">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/" className="flex items-center shrink-0">
              <img src={logo} alt="Karakata Market" className="w-36 h-auto" />
            </Link>

            <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands, categories..."
                  className="w-full pl-4 pr-12 py-2.5 rounded-xl text-sm outline-none border-2 border-transparent text-gray-800 focus:border-yellow-400 transition-all bg-white"
                />
                <button type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ backgroundColor: '#ffc70e' }}>
                  <Search size={15} style={{ color: '#3c1a5b' }} />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-0.5 ml-auto">

              {isAuthenticated && (
                <Link to="/wishlist"
                      className="relative p-2.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-all"
                      title="Wishlist">
                  <Heart size={20} />
                  <Badge count={wishlistCount} />
                </Link>
              )}

              <Link to="/cart"
                    className="relative p-2.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-all"
                    title="Cart">
                <ShoppingCart size={20} />
                <Badge count={cartItemCount} />
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to="/notifications"
                        className="relative p-2.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-all"
                        title="Notifications">
                    <Bell size={20} />
                    <Badge count={unreadCount} />
                  </Link>

                  <div className="relative ml-1">
                    <button
                      onClick={() => setIsProfileOpen(v => !v)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-all text-sm"
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                           style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}>
                        {user?.first_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="hidden md:block font-semibold max-w-20 truncate">
                        {user?.first_name}
                      </span>
                      <ChevronDown size={13} className="hidden md:block transition-transform duration-200"
                                   style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>

                    {isProfileOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl py-2 z-20 overflow-hidden"
                             style={{ boxShadow: '0 20px 60px rgba(60,26,91,0.2)', border: '1px solid #ede6f9', animation: 'profileIn .15s ease-out' }}>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900">{user?.first_name} {user?.last_name}</p>
                            <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role} account</p>
                          </div>
                          <div className="py-1">
                            {(user?.role === 'admin' || user?.role === 'vendor') && (
                              <Link to={getDashboardLink()} onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <LayoutDashboard size={15} className="text-gray-400" />
                                {user?.role === 'admin' ? 'Admin Panel' : 'Vendor Dashboard'}
                              </Link>
                            )}
                            <Link to="/orders" onClick={() => setIsProfileOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <Package size={15} className="text-gray-400" />My Orders
                            </Link>
                            <Link to="/wishlist" onClick={() => setIsProfileOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <Heart size={15} className="text-gray-400" />My Wishlist
                            </Link>
                            <Link to="/profile" onClick={() => setIsProfileOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <User size={15} className="text-gray-400" />Profile Settings
                            </Link>
                          </div>
                          <div className="border-t border-gray-100 pt-1">
                            <button onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                              <LogOut size={15} />Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-purple-200 hover:text-white transition-colors">
                    Sign in
                  </Link>
                  <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                        style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}>
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center pb-3 gap-0">

            <div className="relative shrink-0 mr-3">
              <button
                onClick={() => setIsCatPanelOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 select-none"
                style={{
                  backgroundColor: isCatPanelOpen ? '#ffc70e' : 'rgba(255,199,14,0.12)',
                  color: isCatPanelOpen ? '#3c1a5b' : '#ffc70e',
                  border: `1.5px solid ${isCatPanelOpen ? '#ffc70e' : 'rgba(255,199,14,0.35)'}`,
                }}
              >
                <Grid3X3 size={15} />
                All Categories
                <ChevronDown size={13} style={{ transform: isCatPanelOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s ease' }} />
              </button>

              {isCatPanelOpen && (
                <AllCategoriesPanel
                  categories={categoryTree}
                  onClose={() => setIsCatPanelOpen(false)}
                />
              )}
            </div>

            <div className="w-px h-5 mr-4 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

            <div className="flex items-center gap-5 overflow-x-auto flex-1 hide-scrollbar">
              {categoryTree.map((cat) => (
                <CategoryNavItem key={cat.id} category={cat} isActive={activeCat === cat.name} />
              ))}
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10" style={{ backgroundColor: 'rgba(24,8,48,0.98)' }}>
            <div className="p-4 pb-2">
              <form onSubmit={handleSearch} className="relative">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                       placeholder="Search products..."
                       className="w-full pl-4 pr-12 py-2.5 rounded-xl text-sm outline-none text-gray-800 bg-white" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg"
                        style={{ backgroundColor: '#ffc70e' }}>
                  <Search size={15} style={{ color: '#3c1a5b' }} />
                </button>
              </form>
            </div>

            <div className="px-3 pb-5 max-h-[65vh] overflow-y-auto hide-scrollbar">
              <p className="px-3 pt-3 pb-2 text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: '#7055a0' }}>
                Categories
              </p>
              {categoryTree.map((cat) => {
                const isExpanded = mobileExpandedCat === cat.id;
                return (
                  <div key={cat.id} className="mb-0.5">
                    <div className="flex items-center rounded-xl overflow-hidden transition-colors"
                         style={{ backgroundColor: isExpanded ? 'rgba(255,199,14,0.08)' : 'transparent' }}>
                      <Link
                        to={`/products?category=${encodeURIComponent(cat.slug)}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 flex-1 px-3 py-3 text-sm font-semibold transition-colors"
                        style={{ color: isExpanded ? '#ffc70e' : 'rgba(215,200,240,0.9)' }}
                      >
                        <span style={{ opacity: 0.75 }}>{getCategoryIcon(cat.name)}</span>
                        {cat.name}
                      </Link>
                      {cat.children?.length > 0 && (
                        <button
                          onClick={() => setMobileExpandedCat(isExpanded ? null : cat.id)}
                          className="px-3 py-3 transition-colors"
                          style={{ color: isExpanded ? '#ffc70e' : '#7055a0' }}
                        >
                          <ChevronDown size={15}
                                       style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }} />
                        </button>
                      )}
                    </div>
                    {isExpanded && cat.children?.length > 0 && (
                      <div className="ml-10 mb-2 mt-0.5 space-y-0.5">
                          {cat.children.map((sub) => {
                            const isSubExpanded = mobileExpandedSubCat === sub.id;

                            return (
                              <div key={sub.id}>

                                <div className="flex items-center justify-between px-3 py-2 rounded-lg">
                                  <Link
                                    to={`/products?category=${encodeURIComponent(sub.slug)}`}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2.5 text-xs font-medium"
                                    style={{ color: '#9a7dc0' }}
                                  >
                                    <span className="w-1 h-1 rounded-full shrink-0"
                                          style={{ backgroundColor: '#6b4d96' }} />
                                    {sub.name}
                                  </Link>

                                  {sub.children?.length > 0 && (
                                    <button
                                      onClick={() =>
                                        setMobileExpandedSubCat(isSubExpanded ? null : sub.id)
                                      }
                                      style={{ color: '#7055a0' }}
                                    >
                                      <ChevronDown
                                        size={13}
                                        style={{
                                          transform: isSubExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                          transition: 'transform .2s'
                                        }}
                                      />
                                    </button>
                                  )}
                                </div>

                                {isSubExpanded && sub.children?.length > 0 && (
                                  <div className="ml-6 space-y-1 mb-2">
                                    {sub.children.map((child) => (
                                      <Link
                                        key={child.id}
                                        to={`/products?category=${encodeURIComponent(child.slug)}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block px-3 py-1.5 text-xs rounded-md"
                                        style={{ color: '#c3a6ff' }}
                                      >
                                        • {child.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}

                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;