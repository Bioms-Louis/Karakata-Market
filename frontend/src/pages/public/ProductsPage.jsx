import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SlidersHorizontal, X, ChevronDown,
  ChevronUp, Search, LayoutGrid, List
} from 'lucide-react';
import { getProducts, getBrands } from '../../api/products.api';
import { getCategories } from '../../api/categories.api';
import ProductCard from '../../components/products/ProductCard';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';

// PRICE RANGE SLIDER
const PriceRange = ({ min, max, onChange }) => {
  const [localMin, setLocalMin] = useState(min || '');
  const [localMax, setLocalMax] = useState(max || '');

  const handleApply = () => {
    onChange({ min: localMin, max: localMax });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Min (₦)</label>
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 text-sm border border-gray-200
                       rounded-lg outline-none focus:ring-2
                       focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Max (₦)</label>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 text-sm border border-gray-200
                       rounded-lg outline-none focus:ring-2
                       focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>
      <button
        onClick={handleApply}
        className="w-full py-2 text-sm font-semibold rounded-lg
                   transition-colors"
        style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
      >
        Apply Price Filter
      </button>
    </div>
  );
};

// FILTER SECTION (collapsible)
const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 pb-5 mb-5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {isOpen
          ? <ChevronUp size={16} className="text-gray-400" />
          : <ChevronDown size={16} className="text-gray-400" />
        }
      </button>
      {isOpen && children}
    </div>
  );
};

// FILTERS SIDEBAR
const FiltersSidebar = ({ filters, onFilterChange, categories, onClearAll, brands }) => {
  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className="bg-white rounded-2xl border border-gray-100
                    shadow-sm p-5 sticky top-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal size={18} style={{ color: '#3c1a5b' }} />
          Filters
        </h3>
        {Object.keys(filters).some(k => filters[k]) && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-500 hover:text-red-700
                       font-medium flex items-center gap-1"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection title="Category">
        <div className="space-y-2">
          <button
            onClick={() => onFilterChange({ category: '' })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm
                        transition-colors ${!filters.category
                          ? 'font-semibold text-white'
                          : 'text-gray-600 hover:bg-gray-50'}`}
            style={!filters.category
              ? { backgroundColor: '#3c1a5b' }
              : {}}
          >
            All Categories
          </button>
          {categories?.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => onFilterChange({ category: cat.slug })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm
                            transition-colors ${filters.category === cat.slug
                              ? 'font-semibold text-white'
                              : 'text-gray-600 hover:bg-gray-50'}`}
                style={filters.category === cat.slug
                  ? { backgroundColor: '#3c1a5b' }
                  : {}}
              >
                {cat.name}
              </button>

              {/* Subcategories (L2) */}
              {cat.children?.length > 0 && (
                <div className="ml-3 mt-1 space-y-1">
                  {cat.children.map((sub) => (
                    <div key={sub.id}>
                      <button
                        onClick={() => onFilterChange({ category: sub.slug })}
                        className={`w-full text-left px-3 py-1.5 rounded-lg
                                    text-xs transition-colors
                                    ${filters.category === sub.slug
                                      ? 'font-semibold text-white'
                                      : 'text-gray-500 hover:bg-gray-50'}`}
                        style={filters.category === sub.slug
                          ? { backgroundColor: '#3c1a5b' }
                          : {}}
                      >
                        └ {sub.name}
                      </button>

                      {/* Sub-subcategories (L3) */}
                      {sub.children?.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {sub.children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => onFilterChange({ category: child.slug })}
                              className={`w-full text-left px-3 py-1.5 rounded-lg
                                          text-xs transition-colors
                                          ${filters.category === child.slug
                                            ? 'font-semibold text-white'
                                            : 'text-gray-400 hover:bg-gray-50'}`}
                              style={filters.category === child.slug
                                ? { backgroundColor: '#3c1a5b' }
                                : {}}
                            >
                              └ {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection title="Price Range">
        <PriceRange
          min={filters.minPrice}
          max={filters.maxPrice}
          onChange={({ min, max }) =>
            onFilterChange({ minPrice: min, maxPrice: max })
          }
        />
      </FilterSection>

      {/* Brand Filter */}
      <FilterSection title="Brand" defaultOpen={false}>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {(brands || []).length === 0 && (
            <p className="text-xs text-gray-400 italic px-2">No brands available</p>
          )}
          {(brands || []).map((b) => (
            <label key={b} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={filters.brand === b}
                onChange={() => onFilterChange({ brand: filters.brand === b ? '' : b })}
                className="w-4 h-4 rounded accent-purple-700"
              />
              <span className="text-sm text-gray-700">{b}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection title="Minimum Rating">
        <div className="space-y-2">
          {ratings.map((rating) => (
            <button
              key={rating}
              onClick={() => onFilterChange({
                rating: filters.rating === String(rating) ? '' : String(rating)
              })}
              className={`w-full flex items-center gap-2 px-3 py-2
                          rounded-lg text-sm transition-colors
                          ${filters.rating === String(rating)
                            ? 'font-semibold text-white'
                            : 'text-gray-600 hover:bg-gray-50'}`}
              style={filters.rating === String(rating)
                ? { backgroundColor: '#3c1a5b' }
                : {}}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${i < rating
                      ? 'text-yellow-400'
                      : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span>& up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Featured Filter */}
      <FilterSection title="Product Type" defaultOpen={false}>
        <button
          onClick={() => onFilterChange({
            featured: filters.featured === 'true' ? '' : 'true'
          })}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm
                      transition-colors ${filters.featured === 'true'
                        ? 'font-semibold text-white'
                        : 'text-gray-600 hover:bg-gray-50'}`}
          style={filters.featured === 'true'
            ? { backgroundColor: '#3c1a5b' }
            : {}}
        >
          ⭐ Featured Only
        </button>
      </FilterSection>
    </div>
  );
};

// ACTIVE FILTER TAGS
const ActiveFilters = ({ filters, onRemove, categories }) => {
  const activeFilters = [];

  if (filters.category) {
    // Search all 3 levels for a matching slug to get the display name
    let catName = filters.category;
    categories?.forEach(c => {
      if (c.slug === filters.category) catName = c.name;
      c.children?.forEach(s => {
        if (s.slug === filters.category) catName = s.name;
        s.children?.forEach(g => {
          if (g.slug === filters.category) catName = g.name;
        });
      });
    });
    activeFilters.push({
      key: 'category',
      label: `Category: ${catName}`
    });
  }
  if (filters.brand) {
    activeFilters.push({
      key: 'brand',
      label: `Brand: ${filters.brand}`
    });
  }
  if (filters.minPrice) {
    activeFilters.push({
      key: 'minPrice',
      label: `Min: ${formatCurrency(filters.minPrice)}`
    });
  }
  if (filters.maxPrice) {
    activeFilters.push({
      key: 'maxPrice',
      label: `Max: ${formatCurrency(filters.maxPrice)}`
    });
  }
  if (filters.rating) {
    activeFilters.push({
      key: 'rating',
      label: `${filters.rating}★ & up`
    });
  }
  if (filters.featured === 'true') {
    activeFilters.push({ key: 'featured', label: 'Featured' });
  }
  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `Search: "${filters.search}"`
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {activeFilters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5
                     text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: '#3c1a5b' }}
        >
          {filter.label}
          <button
            onClick={() => onRemove(filter.key)}
            className="hover:opacity-70 transition-opacity"
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
};

// PAGINATION
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages } = pagination;

  // Build page numbers array
  // Always show: first, last, current, and 1 page either side of current
  const getPageNumbers = () => {
    const pages = new Set([1, totalPages, page]);
    if (page > 1) pages.add(page - 1);
    if (page < totalPages) pages.add(page + 1);
    return [...pages].sort((a, b) => a - b);
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 text-sm font-medium rounded-xl border
                   transition-colors disabled:opacity-40
                   disabled:cursor-not-allowed hover:bg-gray-100"
      >
        ← Prev
      </button>

      {/* Page numbers */}
      {pages.map((pageNum, idx) => {
        // Add ellipsis if there's a gap
        const prevPage = pages[idx - 1];
        const showEllipsis = prevPage && pageNum - prevPage > 1;

        return (
          <div key={pageNum} className="flex items-center gap-2">
            {showEllipsis && (
              <span className="text-gray-400 text-sm px-1">...</span>
            )}
            <button
              onClick={() => onPageChange(pageNum)}
              className={`w-10 h-10 text-sm font-semibold rounded-xl
                          transition-colors
                          ${pageNum === page
                            ? 'text-white'
                            : 'hover:bg-gray-100 text-gray-700'}`}
              style={pageNum === page
                ? { backgroundColor: '#3c1a5b' }
                : {}}
            >
              {pageNum}
            </button>
          </div>
        );
      })}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-2 text-sm font-medium rounded-xl border
                   transition-colors disabled:opacity-40
                   disabled:cursor-not-allowed hover:bg-gray-100"
      >
        Next →
      </button>
    </div>
  );
};

// MAIN PRODUCTS PAGE
const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    featured: searchParams.get('featured') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'DESC',
    page: searchParams.get('page') || '1',
    limit: '40',
    brand: searchParams.get('brand') || '',
  };

  // Update URL params when filters change
  const handleFilterChange = (newFilters) => {
    const updated = { ...filters, ...newFilters, page: '1' };

    // Remove empty values from URL
    const cleaned = Object.fromEntries(
      Object.entries(updated).filter(([, v]) => v !== '')
    );
    setSearchParams(cleaned);
  };

  const handleRemoveFilter = (key) => {
    handleFilterChange({ [key]: '' });
  };

  const handleClearAll = () => {
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: String(newPage) });
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch products with all current filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    select: (res) => res.data.data,
    keepPreviousData: true  // Don't flash loading on page change
  });

  // Fetch categories for filter sidebar
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    select: (res) => res.data.data.categories
  });

  // Fetch available brands for filter
  const { data: brandsData = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    select: (res) => res.data.data.brands,
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const sortOptions = [
    { value: 'created_at-DESC', label: 'Newest First' },
    { value: 'created_at-ASC', label: 'Oldest First' },
    { value: 'base_price-ASC', label: 'Price: Low to High' },
    { value: 'base_price-DESC', label: 'Price: High to Low' },
    { value: 'average_rating-DESC', label: 'Top Rated' },
    { value: 'total_sold-DESC', label: 'Best Selling' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* ── Page Header ──────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {filters.search
              ? `Results for "${filters.search}"`
              : filters.category
              ? `${filters.category.charAt(0).toUpperCase() +
                  filters.category.slice(1).replace(/-/g, ' ')}`
              : 'All Products'}
          </h1>
          {pagination && (
            <p className="text-gray-500 text-sm mt-1">
              {pagination.total.toLocaleString()} products found
            </p>
          )}
        </div>

        <div className="flex gap-6">

          {/* ── Filters Sidebar (Desktop) ──── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FiltersSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              categories={categoriesData}
              onClearAll={handleClearAll}
              brands={brandsData}
            />
          </aside>

          {/* ── Main Content ─────────────── */}
          <div className="flex-1 min-w-0">

            {/* Sort Bar */}
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm px-4 py-3 mb-4 flex items-center
                            justify-between gap-4 flex-wrap">

              {/* Mobile filter toggle */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 text-sm
                           font-medium px-3 py-1.5 rounded-lg border"
                style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>

              {/* Active filter tags */}
              <ActiveFilters
                filters={filters}
                onRemove={handleRemoveFilter}
                categories={categoriesData}
              />

              {/* Sort dropdown */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  Sort by:
                </span>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange({ sortBy, sortOrder });
                  }}
                  className="text-sm border border-gray-200 rounded-xl
                             px-3 py-2 outline-none cursor-pointer
                             focus:ring-2 focus:ring-yellow-400"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i}
                       className="bg-gray-200 rounded-2xl h-72 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center
                              py-20 text-center">
                <p className="text-4xl mb-4">😕</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-500 text-sm">
                  Failed to load products. Please try again.
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center
                              py-20 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Try adjusting your filters or search term.
                </p>
                <button
                  onClick={handleClearAll}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold
                             text-white transition-colors"
                  style={{ backgroundColor: '#3c1a5b' }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3
                                lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <Pagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filters Drawer ─────────── */}
      {isMobileFiltersOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileFiltersOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white
                          z-50 lg:hidden overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4
                            border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FiltersSidebar
                filters={filters}
                onFilterChange={(f) => {
                  handleFilterChange(f);
                  setIsMobileFiltersOpen(false);
                }}
                categories={categoriesData}
                onClearAll={() => {
                  handleClearAll();
                  setIsMobileFiltersOpen(false);
                }}
                brands={brandsData}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsPage;