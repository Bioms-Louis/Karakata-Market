import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShoppingBag, Shield, Truck, RefreshCw, 
  ChevronLeft, ChevronRight, Tv, Headphones, Laptop, Baby, 
  WashingMachine, Smartphone, Shirt, Sofa, Gamepad2, Apple, 
  Building2, HeartPlus, Grid3X3 } from 'lucide-react';
import { getProducts } from '../../api/products.api';
import api from '../../api/axios';
import { getCategories } from '../../api/categories.api';
import ProductCard from '../../components/products/ProductCard';

// Slide images
import slide1 from '../../assets/slides/Fashion.png';
import slide2 from '../../assets/slides/Gadgets.png';
import slide3 from '../../assets/slides/Beauty.png';
import slide4 from '../../assets/slides/Automobile.png';

// CAROUSEL
const FALLBACK_SLIDES = [
  {
    id: 1,
    image: slide1,
    headline: "New Season Fashion",
    description: "Discover the latest styles from top vendors.",
    badge: null,
    buttonText: 'Shop Fashion',
    link: '/products?category=fashion',
    position: 'left',
  },
  {
    id: 2,
    image: slide2,
    headline: 'Flash Sale up to 10% off',
    description: null,
    badge: null,
    buttonText: 'Shop Now',
    link: '/products?category=electronics',
    position: 'left',
  },
  {
    id: 3,
    image: slide3,
    headline: 'Glow Up with Karakata',
    description: 'Your Beauty, Our Priority',
    badge: 'Flash Sale up to 30% OFF',
    buttonText: 'Shop Now',
    link: '/products?category=health-beauty',
    position: 'left',
  },
  {
    id: 4,
    image: slide4,
    headline: 'Find The Car That Fits You',
    description: null,
    badge: null,
    buttonText: 'Shop Now',
    link: '/products?category=automobile',
    position: 'left',
  },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch carousel from API, fall back to hardcoded if unavailable
  const { data: apiSlides } = useQuery({
    queryKey: ['carousel'],
    queryFn: () => api.get('/carousel'),
    select: (res) => res.data.data.slides.map(s => ({
      id: s.id,
      image: s.image_url,
      headline: s.headline,
      description: s.description,
      badge: s.badge,
      buttonText: s.button_text,
      link: s.link,
      position: s.position,
    })),
    staleTime: 5 * 60 * 1000,
  });

  const slides = (apiSlides && apiSlides.length > 0) ? apiSlides : FALLBACK_SLIDES;

  // Auto slide every seconds
  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const goToSlide = (index) => {
    if (isAnimating || index === current) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  useEffect(() => {
    const timer = setInterval(goToNext, 1000);
    return () => clearInterval(timer);
  }, [goToNext]);

  const slide = slides[current];

  // Text alignment classes based on position
  const positionClasses = {
    left: 'items-start text-left left-8 lg:left-16',
    right: 'items-end text-right right-8 lg:right-16',
    center: 'items-center text-center left-1/2 -translate-x-1/2',
  };

  return (
    <section className="relative w-full overflow-hidden bg-gray-900"
             style={{ height: '520px' }}>

      {/* Slides */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700
                      ${index === current
                        ? 'opacity-100 z-10'
                        : 'opacity-0 z-0'}`}
        >
          {/* Background Image */}
          <img
            src={s.image}
            alt={s.headline || `Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ))}

      {/* Text Overlay */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 z-20 flex flex-col
                    gap-4 max-w-md px-2
                    ${positionClasses[slide.position]}`}
      >
        {/* Badge */}
        {slide.badge && (
          <span
            className="inline-block self-start text-xs font-bold px-4 py-1.5
                       rounded-full uppercase tracking-wider animate-bounce"
            style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
          >
            {slide.badge}
          </span>
        )}

        {/* Headline */}
        {slide.headline && (
          <h1
            className="text-3xl lg:text-5xl font-extrabold text-white
                       leading-tight drop-shadow-lg"
          >
            {slide.headline}
          </h1>
        )}

        {/* Description */}
        {slide.description && (
          <p className="text-white/90 text-base lg:text-lg drop-shadow-md">
            {slide.description}
          </p>
        )}

        {/* CTA Button */}
        <Link
          to={slide.link}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl
                     font-bold text-sm transition-all duration-200
                     hover:scale-105 hover:opacity-90 self-start shadow-lg"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          {slide.buttonText}
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Left Arrow */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30
                   w-11 h-11 rounded-full flex items-center justify-center
                   transition-all duration-200 hover:scale-110
                   bg-black/30 hover:bg-black/50 backdrop-blur-sm"
      >
        <ChevronLeft size={10} className="text-white" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30
                   w-11 h-11 rounded-full flex items-center justify-center
                   transition-all duration-200 hover:scale-110
                   bg-black/30 hover:bg-black/50 backdrop-blur-sm"
      >
        <ChevronRight size={10} className="text-white" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30
                      flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300
                        ${index === current
                          ? 'w-8 h-3'
                          : 'w-3 h-3 bg-white/50 hover:bg-white/80'}`}
            style={index === current
              ? { backgroundColor: '#ffc70e' }
              : {}}
          />
        ))}
      </div>
    </section>
  );
};

// TRUST BADGES
const TrustBadges = () => {
  const badges = [
    {
      icon: <Shield size={24} />,
      title: 'Secure Payments',
      desc: 'All transactions protected'
    },
    {
      icon: <Truck size={24} />,
      title: 'Fast Delivery',
      desc: 'Nationwide delivery'
    },
    {
      icon: <RefreshCw size={24} />,
      title: 'Easy Returns',
      desc: 'Hassle-free 7-day return policy'
    },
    {
      icon: <ShoppingBag size={24} />,
      title: 'Verified Vendors',
      desc: 'Every vendor is vetted and approved'
    },
  ];

  return (
    <section className="py-10 bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge) => (
            <div key={badge.title}
                 className="flex items-center gap-3 p-4 bg-white
                            rounded-2xl shadow-sm border border-gray-100">
              <div className="p-2 rounded-xl shrink-0"
                   style={{ backgroundColor: '#f5f0fa', color: '#3c1a5b' }}>
                {badge.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {badge.title}
                </p>
                <p className="text-xs text-gray-500">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CATEGORY SECTION
const CATEGORY_ORDER = [
  "appliances",
  "phones-tablets",
  "electronics",
  "fashion",
  "computing",
  "health-beauty",
  "home-office",
  "electronic-accessories",
  "supermarket",
  "baby-products",
  "gaming",
  "real-estate",
  "other-categories-"
];

const CategorySection = ({ categories, isLoading }) => {
  // Category icons mapping
  const categoryStyles = {
    fashion: { emoji: <Shirt size={40} />, bg: '#fdf2f8' },
    electronics: { emoji: <Tv size={40} />, bg: '#eff6ff' },
    appliances: { emoji: <WashingMachine size={40} />, bg: '#f0fdf4' },
    'health-beauty': { emoji: <HeartPlus size={40} />, bg: '#fff7ed' },
    'home-office': { emoji: <Sofa size={40} />, bg: '#f5f0fa' },
    computing: { emoji: <Laptop size={40} />, bg: '#f0f4ff' },
    'baby-products': { emoji: <Baby size={40} />, bg: '#fef2ff' },
    'electronic-accessories': { emoji: <Headphones size={40} />, bg: '#f0f9ff' },
    gaming: { emoji: <Gamepad2 size={40} />, bg: '#f0f4ff' },
    'phones-tablets': { emoji: <Smartphone size={40} />, bg: '#f0f9ff' },
    'real-estate': { emoji: <Building2 size={40} />, bg: '#fef2ff' },
    supermarket: { emoji: <Apple size={40} />, bg: '#fff7ed' },
    default: { emoji: <Grid3X3 size={40} />, bg: '#f9fafb' }
  };

  const sortedCategories = [...(categories || [])].sort(
  (a, b) =>
    CATEGORY_ORDER.indexOf(a.slug) - CATEGORY_ORDER.indexOf(b.slug)
);

  if (isLoading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse" />
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}
                   className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Find exactly what you're looking for
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-1 text-sm font-medium
                       hover:underline"
            style={{ color: '#3c1a5b' }}
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {sortedCategories.map((category) => {
            const style = categoryStyles[category.slug] || categoryStyles.default;

            return (
              <Link
                key={category.id}
                to={`/products/${category.slug}`}
                className="shrink-0 w-28 flex flex-col items-center gap-2 p-4
                          rounded-2xl transition-all hover:scale-105 hover:shadow-md
                          cursor-pointer group"
                style={{ backgroundColor: style.bg }}
              >
                <span className="text-3xl">{style.emoji}</span>

                <span className="text-xs font-semibold text-gray-700
                                text-center group-hover:text-purple-700
                                transition-colors">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// PRODUCTS SECTION
const ProductSection = ({ title, subtitle, products, isLoading, viewAllLink }) => {
  if (isLoading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
            )}
          </div>
          <Link
            to={viewAllLink || '/products'}
            className="hidden sm:flex items-center gap-1 text-sm font-medium
                       hover:underline"
            style={{ color: '#3c1a5b' }}
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.slice(0, 10).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

// BANNER SECTION
const PromoBanner = () => {
  return (
    <section className="py-8 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div
          className="rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row
                     items-center justify-between gap-6 relative overflow-hidden"
          style={{ backgroundColor: '#ffc70e' }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full
                          opacity-20"
               style={{ backgroundColor: '#3c1a5b' }} />
          <div className="absolute -right-4 -bottom-10 w-56 h-56 rounded-full
                          opacity-10"
               style={{ backgroundColor: '#3c1a5b' }} />

          <div className="relative z-10 text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2"
               style={{ color: '#3c1a5b' }}>
              Limited Time Offer
            </p>
            <h3 className="text-3xl lg:text-4xl font-extrabold mb-2"
                style={{ color: '#3c1a5b' }}>
              Become a Vendor Today
            </h3>
            <p className="text-purple-900 text-sm max-w-md">
              Start selling to thousands of customers across Nigeria.
              Free registration, no hidden fees.
            </p>
          </div>

          <Link
            to="/become-vendor"
            className="relative z-10 shrink-0 px-8 py-4 rounded-xl
                       font-bold text-sm transition-all hover:opacity-90
                       hover:scale-105"
            style={{ backgroundColor: '#3c1a5b', color: '#ffc70e' }}
          >
            Start Selling Free →
          </Link>
        </div>
      </div>
    </section>
  );
};

// MAIN HOME PAGE
const HomePage = () => {
  // Fetch featured products
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => getProducts({ featured: 'true', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch newest products
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => getProducts({ sortBy: 'created_at', sortOrder: 'DESC', limit: 10 }),
    select: (res) => res.data.data.products
  });
  
  // Fetch electronics products
  const { data: electronicsData, isLoading: electronicsLoading } = useQuery({
    queryKey: ['products', 'electronics'],
    queryFn: () => getProducts({ category: 'electronics', limit: 10 }),
    select: (res) => res.data.data.products
  });

   // Fetch phones
  const { data: phonesData, isLoading: phonesLoading } = useQuery({
    queryKey: ['products', 'smartphones'],
    queryFn: () => getProducts({ category: 'smartphones', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch iPads & tablets
  const { data: tabletsData, isLoading: tabletsLoading } = useQuery({
    queryKey: ['products', 'ipad-tablets'],
    queryFn: () => getProducts({ category: 'ipad-tablets', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Mobile Accessories
  const { data: mobileData, isLoading: mobileLoading } = useQuery({
    queryKey: ['products', 'mobile-accessories'],
    queryFn: () => getProducts({ category: 'mobile-accessories', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Laptops
  const { data: laptopData, isLoading: laptopLoading } = useQuery({
    queryKey: ['products', 'laptop'],
    queryFn: () => getProducts({ category: 'laptop', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch men's fashion products
  const { data: mensFashionData, isLoading: mensFashionLoading } = useQuery({
    queryKey: ['products', 'mens-fashion'],
    queryFn: () => getProducts({ category: 'mens-fashion', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch women's fashion products
  const { data: womensFashionData, isLoading: womensFashionLoading } = useQuery({
    queryKey: ['products', 'womens-fashion'],
    queryFn: () => getProducts({ category: 'womens-fashion', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Food
  const { data: foodData, isLoading: foodLoading } = useQuery({
    queryKey: ['products', 'food'],
    queryFn: () => getProducts({ category: 'food', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch beverages
  const { data: beveragesData, isLoading: beveragesLoading } = useQuery({
    queryKey: ['products', 'beverages'],
    queryFn: () => getProducts({ category: 'beverages', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch health & beauty
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['products', 'health-beauty'],
    queryFn: () => getProducts({ category: 'health-beauty', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch appliances
  const { data: appliancesData, isLoading: appliancesLoading } = useQuery({
    queryKey: ['products', 'appliances'],
    queryFn: () => getProducts({ category: 'appliances', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch TVs
  const { data: tvData, isLoading: tvLoading } = useQuery({
    queryKey: ['products', 'television'],
    queryFn: () => getProducts({ category: 'television', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Electronic Accessories
  const { data: accessoriesData, isLoading: accessoriesLoading } = useQuery({
    queryKey: ['products', 'electronic-accessories'],
    queryFn: () => getProducts({ category: 'electronic-accessories', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Home Office
  const { data: homeOfficeData, isLoading: homeOfficeisLoading } = useQuery({
    queryKey: ['products', 'home-office'],
    queryFn: () => getProducts({ category: 'home-office', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Baby Products
  const { data: babyData, isLoading: babyisLoading } = useQuery({
    queryKey: ['products', 'baby-products'],
    queryFn: () => getProducts({ category: 'baby-products', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Sleep and Wellness
  const { data: sleepData, isLoading: sleepisLoading } = useQuery({
    queryKey: ['products', 'sleep-wellness'],
    queryFn: () => getProducts({ category: 'sleep-wellness', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Console and Gaming
  const { data: gamingData, isLoading: gamingisLoading } = useQuery({
    queryKey: ['products', 'gaming'],
    queryFn: () => getProducts({ category: 'gaming', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Toys and Games
  const { data: toyGamesData, isLoading: toyGamesisLoading } = useQuery({
    queryKey: ['products', 'toys-games'],
    queryFn: () => getProducts({ category: 'toys-games', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch Automobiles
  const { data: autoData, isLoading: autoisLoading } = useQuery({
    queryKey: ['products', 'automobile'],
    queryFn: () => getProducts({ category: 'automobile', limit: 10 }),
    select: (res) => res.data.data.products
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    select: (res) => res.data.data.categories
  });

  return (
    <div>
      <HeroSection />
      <TrustBadges />
      <CategorySection
        categories={categoriesData}
        isLoading={categoriesLoading}
      />
      <ProductSection
        title="Featured Products"
        subtitle="Handpicked deals just for you"
        products={featuredData}
        isLoading={featuredLoading}
        viewAllLink="/products?featured=true"
      />
      <PromoBanner />
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh products added this week"
        products={newArrivalsData}
        isLoading={newArrivalsLoading}
        viewAllLink="/products?sortBy=created_at"
      />
      <ProductSection
        title="Shop Electronics"
        subtitle="Find the best Electronics deal"
        products={electronicsData}
        isLoading={electronicsLoading}
        viewAllLink="/products?category=electronics"
      />
      <ProductSection
          title="Shop Appliances"
          subtitle="From small appliances to large appliances"
          products={appliancesData}
          isLoading={appliancesLoading}
          viewAllLink="/products?category=appliances"
      />
      <ProductSection
        title="Get Deals on Latest Gadgets"
        subtitle="Shop for your Smartphones"
        products={phonesData}
        isLoading={phonesLoading}
        viewAllLink="/products?category=smartphones"
      />
      <ProductSection
          title="Get Deals on iPads & Tablets"
          subtitle="Shop for your iPads & Tablets"
          products={tabletsData}
          isLoading={tabletsLoading}
          viewAllLink="/products?category=ipad-tablets"
      />
      <ProductSection
        title="Shop Mobile Accessories"
        subtitle="Get your mobile accessories from power bank, charger, screen guard...."
        products={mobileData}
        isLoading={mobileLoading}
        viewAllLink="/products?category=mobile-accessories"
      />
      <ProductSection
          title="Power Meets Price"
          subtitle="Unbeatable laptop deals for work, gaming, and everything in between"
          products={laptopData}
          isLoading={laptopLoading}
          viewAllLink="/products?category=laptop"
      />
      <ProductSection
          title="Television Deals"
          subtitle="Smart TVs, OLED, QLED, get great deals"
          products={tvData}
          isLoading={tvLoading}
          viewAllLink="/products?category=televison"
      />
      <ProductSection
          title="Electronic Accessories"
          subtitle="Speakers, headphones, smart watches, and more"
          products={accessoriesData}
          isLoading={accessoriesLoading}
          viewAllLink="/products?category=electronic-accessories"
      />
      <ProductSection
        title="Men's Fashion"
        subtitle="Trending styles for men — clothing, shoes, accessories & more"
        products={mensFashionData}
        isLoading={mensFashionLoading}
        viewAllLink="/products?category=mens-fashion"
      />
      <ProductSection
        title="Women's Fashion"
        subtitle="Dresses, shoes, handbags, jewelry & everything in between"
        products={womensFashionData}
        isLoading={womensFashionLoading}
        viewAllLink="/products?category=womens-fashion"
      />
      <ProductSection
          title="Glow Starts Here"
          subtitle="Discover skincare, beauty, and wellness essentials made for you"
          products={healthData}
          isLoading={healthLoading}
          viewAllLink="/products?category=health-beauty"
      />
      <ProductSection
          title="Cook Better, Spend Less"
          subtitle="Get the best deals on everyday cooking essentials without compromise"
          products={foodData}
          isLoading={foodLoading}
          viewAllLink="/products?category=food"
      />
      <ProductSection
          title="Sip Into Refreshment"
          subtitle="Juices, sodas, energy drinks, and more refreshment for every mood"
          products={beveragesData}
          isLoading={beveragesLoading}
          viewAllLink="/products?category=beverages"
      />
      <ProductSection
          title="Home and Office"
          subtitle="Get the best deals on home and office essentials"
          products={homeOfficeData}
          isLoading={homeOfficeisLoading}
          viewAllLink="/products?category=home-office"
      />
      <ProductSection
          title="Baby Products"
          subtitle="Get all baby products and essentials"
          products={babyData}
          isLoading={babyisLoading}
          viewAllLink="/products?category=baby-products"
      />
      <ProductSection
          title="Sleep and Wellness"
          subtitle=""
          products={sleepData}
          isLoading={sleepisLoading}
          viewAllLink="/products?category=sleep-wellness"
      />
      <ProductSection
          title="Toys and Games"
          subtitle="Toys, games and more"
          products={toyGamesData}
          isLoading={toyGamesisLoading}
          viewAllLink="/products?category=toy-games"
      />
      <ProductSection
          title="Gaming Consoles"
          subtitle="Gaming consoles for all your gaming needs"
          products={gamingData}
          isLoading={gamingisLoading}
          viewAllLink="/products?category=gaming"
      />
      <ProductSection
          title="Automobiles"
          subtitle="Brand New, Direct Belgium, Local Used"
          products={autoData}
          isLoading={autoisLoading}
          viewAllLink="/products?category=automobile"
      />
    </div>
  );
};

export default HomePage;