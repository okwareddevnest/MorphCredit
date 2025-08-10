import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Home,
  Search,
  Filter,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Palette,
  Save,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Percent,
  Target,
  Activity
} from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { OrderConfirmation } from './components/OrderConfirmation';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  inStock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [activePage, setActivePage] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Generate dynamic analytics data
  const generateAnalyticsData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate dynamic metrics based on current date
    const dayOfYear = Math.floor((now.getTime() - new Date(currentYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const baseValue = dayOfYear * 347; // Base multiplier for realistic variation
    
    return {
      totalSales: (baseValue * 1.2 + Math.random() * 50000).toFixed(0),
      totalOrders: Math.floor(baseValue * 0.1 + Math.random() * 200),
      totalCustomers: Math.floor(baseValue * 0.05 + Math.random() * 100),
      conversionRate: (2.3 + Math.random() * 1.5).toFixed(1),
      avgOrderValue: (150 + Math.random() * 100).toFixed(2),
      salesGrowth: (Math.random() * 20 - 5).toFixed(1), // -5% to +15%
      monthlyRevenue: Array.from({length: 12}, (_, i) => ({
        month: new Date(currentYear, i).toLocaleDateString('en', {month: 'short'}),
        revenue: Math.floor(50000 + Math.random() * 80000),
        isCurrentMonth: i === currentMonth
      }))
    };
  };

  // Generate dynamic customer data
  const generateCustomersData = () => {
    const customers = [];
    const names = ['Sarah Chen', 'Marcus Johnson', 'Emily Rodriguez', 'David Kim', 'Lisa Thompson', 'Ahmed Hassan', 'Jessica Wong', 'Michael Brown', 'Anna Kowalski', 'Carlos Mendoza'];
    const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA'];
    
    for (let i = 0; i < 15; i++) {
      const orderCount = Math.floor(Math.random() * 50) + 1;
      const totalSpent = orderCount * (Math.random() * 200 + 50);
      const lastOrderDays = Math.floor(Math.random() * 180);
      
      customers.push({
        id: i + 1,
        name: names[Math.floor(Math.random() * names.length)],
        email: names[Math.floor(Math.random() * names.length)].toLowerCase().replace(' ', '.') + '@example.com',
        location: locations[Math.floor(Math.random() * locations.length)],
        totalOrders: orderCount,
        totalSpent: totalSpent,
        lastOrderDate: new Date(Date.now() - lastOrderDays * 24 * 60 * 60 * 1000),
        status: lastOrderDays < 30 ? 'Active' : lastOrderDays < 90 ? 'Regular' : 'Inactive',
        joinDate: new Date(Date.now() - (Math.random() * 365 * 2 + 30) * 24 * 60 * 60 * 1000)
      });
    }
    return customers.sort((a, b) => b.totalSpent - a.totalSpent);
  };

  const [analyticsData] = useState(generateAnalyticsData());
  const [customersData] = useState(generateCustomersData());

  const products: Product[] = [
    {
      id: 1,
      name: "MacBook Pro 16\"",
      description: "Latest Apple MacBook Pro with M3 Pro chip, 16GB RAM, 512GB SSD",
      price: 2499,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
      rating: 4.8,
      reviews: 1247,
      category: "laptops",
      inStock: true
    },
    {
      id: 2,
      name: "iPhone 15 Pro",
      description: "Apple iPhone 15 Pro with A17 Pro chip, 128GB storage",
      price: 999,
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
      rating: 4.7,
      reviews: 892,
      category: "phones",
      inStock: true
    },
    {
      id: 3,
      name: "Sony WH-1000XM5",
      description: "Wireless noise-canceling headphones with 30-hour battery life",
      price: 399,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
      rating: 4.9,
      reviews: 567,
      category: "audio",
      inStock: true
    },
    {
      id: 4,
      name: "iPad Air",
      description: "Apple iPad Air with M2 chip, 10.9-inch display, 256GB storage",
      price: 699,
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
      rating: 4.6,
      reviews: 423,
      category: "tablets",
      inStock: true
    },
    {
      id: 5,
      name: "Samsung Galaxy S24",
      description: "Samsung Galaxy S24 with Snapdragon 8 Gen 3, 256GB storage",
      price: 899,
      image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop",
      rating: 4.5,
      reviews: 234,
      category: "phones",
      inStock: true
    },
    {
      id: 6,
      name: "Dell XPS 13",
      description: "Dell XPS 13 laptop with Intel Core i7, 16GB RAM, 512GB SSD",
      price: 1299,
      image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop",
      rating: 4.4,
      reviews: 189,
      category: "laptops",
      inStock: true
    }
  ];

  const categories = [
    { id: 'all', name: 'All Products', icon: Package },
    { id: 'laptops', name: 'Laptops', icon: Package },
    { id: 'phones', name: 'Phones', icon: Package },
    { id: 'tablets', name: 'Tablets', icon: Package },
    { id: 'audio', name: 'Audio', icon: Package }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = (orderData: any) => {
    setOrderDetails(orderData);
    setShowCart(false);
    setShowOrderConfirmation(true);
    setCart([]);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen w-full bg-dark-950 text-white relative">
      {/* Removed Animated Background */}
      
      {/* Header */}
      <header className="relative z-40 bg-dark-900/80 backdrop-blur-md border-b border-dark-700/50 sticky top-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src="/morpho_credit-logo.png"
                  alt="MorphCredit"
                  className="h-8 w-auto animate-float"
                />
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse-slow"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  MorphCredit
                </h1>
                <p className="text-xs text-dark-400">Merchant Demo</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`
          relative z-10 w-64 bg-dark-900/80 backdrop-blur-md border-r border-dark-700/50 
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-16
          fixed lg:relative top-0 left-0 h-full lg:h-auto lg:min-h-screen
        `}>
          <nav className="p-4 pt-20 lg:pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors mb-2 ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-dark-300 hover:text-white hover:bg-dark-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 relative z-0">
          <div className="p-4 lg:p-6 w-full">
            {activePage === 'home' && (
              <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl p-4 md:p-8 border border-primary-500/20">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Welcome to TechStore Pro
                  </h1>
                  <p className="text-dark-300 text-base md:text-lg mb-6">
                    Discover the latest in technology with flexible payment options powered by MorphCredit.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="text-center p-4 bg-dark-800/50 rounded-lg">
                      <Package className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                      <h3 className="font-semibold text-white">Premium Products</h3>
                      <p className="text-sm text-dark-400">Latest tech from top brands</p>
                    </div>
                    <div className="text-center p-4 bg-dark-800/50 rounded-lg">
                      <ShoppingCart className="w-8 h-8 text-accent-400 mx-auto mb-2" />
                      <h3 className="font-semibold text-white">Flexible Payments</h3>
                      <p className="text-sm text-dark-400">Buy now, pay later options</p>
                    </div>
                    <div className="text-center p-4 bg-dark-800/50 rounded-lg">
                      <Users className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                      <h3 className="font-semibold text-white">Customer Support</h3>
                      <p className="text-sm text-dark-400">24/7 assistance available</p>
                    </div>
                  </div>
                </div>

                {/* Featured Products */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Featured Products</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {products.slice(0, 3).map((product, index) => (
                      <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                        <ProductCard product={product} onAddToCart={addToCart} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePage === 'products' && (
              <div className="space-y-6">
                {/* Category Filter */}
                <div className="flex items-center space-x-4 mb-6">
                  <Filter className="w-5 h-5 text-dark-400" />
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-800/50 text-dark-300 hover:text-white hover:bg-dark-700/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map((product, index) => (
                    <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <ProductCard product={product} onAddToCart={addToCart} />
                    </div>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Products Found</h3>
                    <p className="text-dark-400">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            )}

            {activePage === 'analytics' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>
                    <p className="text-dark-400 mt-1">Real-time insights into your store performance</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-dark-800/50 hover:bg-dark-700/50 rounded-lg border border-dark-600 text-white transition-colors">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Last 30 days</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white transition-colors">
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-primary-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-primary-400" />
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        parseFloat(analyticsData.salesGrowth) >= 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {parseFloat(analyticsData.salesGrowth) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {analyticsData.salesGrowth}%
                      </div>
                    </div>
                    <p className="text-dark-400 text-sm">Total Sales</p>
                    <p className="text-2xl font-bold text-white">${parseInt(analyticsData.totalSales).toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-accent-500/20 rounded-lg">
                        <ShoppingCart className="w-5 h-5 text-accent-400" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                        <TrendingUp className="w-3 h-3" />
                        12.3%
                      </div>
                    </div>
                    <p className="text-dark-400 text-sm">Total Orders</p>
                    <p className="text-2xl font-bold text-white">{analyticsData.totalOrders.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-secondary-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-secondary-400" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        8.1%
                      </div>
                    </div>
                    <p className="text-dark-400 text-sm">Customers</p>
                    <p className="text-2xl font-bold text-white">{analyticsData.totalCustomers.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Target className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        2.4%
                      </div>
                    </div>
                    <p className="text-dark-400 text-sm">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white">{analyticsData.conversionRate}%</p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Activity className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        5.7%
                      </div>
                    </div>
                    <p className="text-dark-400 text-sm">Avg Order Value</p>
                    <p className="text-2xl font-bold text-white">${analyticsData.avgOrderValue}</p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <RefreshCw className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                        <Clock className="w-3 h-3" />
                        Live
                      </div>
                    </div>
                    <p className="text-dark-400 text-sm">Return Rate</p>
                    <p className="text-2xl font-bold text-white">4.2%</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">Monthly Revenue</h3>
                      <div className="flex items-center gap-2 text-sm text-dark-400">
                        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                        2024
                      </div>
                    </div>
                    <div className="space-y-4">
                      {analyticsData.monthlyRevenue.map((data, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${data.isCurrentMonth ? 'text-primary-400' : 'text-dark-300'}`}>
                              {data.month}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-1 mx-4">
                            <div className="flex-1 bg-dark-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  data.isCurrentMonth ? 'bg-primary-500' : 'bg-dark-600'
                                }`}
                                style={{ width: `${(data.revenue / 130000) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${data.isCurrentMonth ? 'text-white' : 'text-dark-400'}`}>
                            ${(data.revenue / 1000).toFixed(0)}k
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BNPL Performance */}
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">BNPL Performance</h3>
                      <span className="text-sm text-primary-400 font-medium">MorphCredit</span>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-dark-400">BNPL Orders</p>
                          <p className="text-xl font-bold text-white">342</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-dark-400">% of Total</p>
                          <p className="text-xl font-bold text-primary-400">27.7%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-dark-400">BNPL Revenue</p>
                          <p className="text-xl font-bold text-white">${(parseInt(analyticsData.totalSales) * 0.277).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-dark-400">Avg BNPL Order</p>
                          <p className="text-xl font-bold text-accent-400">${((parseInt(analyticsData.totalSales) * 0.277) / 342).toFixed(0)}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-dark-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-dark-400">Default Rate</span>
                          <span className="text-sm font-medium text-green-400">2.1%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-dark-400">Avg Credit Score</span>
                          <span className="text-sm font-medium text-primary-400">742</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                  <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {[
                      { action: 'New order placed', customer: 'Sarah Chen', amount: '$1,299', time: '2 min ago', type: 'order' },
                      { action: 'BNPL payment received', customer: 'Marcus Johnson', amount: '$267', time: '8 min ago', type: 'payment' },
                      { action: 'Customer registered', customer: 'Emily Rodriguez', amount: null, time: '15 min ago', type: 'signup' },
                      { action: 'Product review posted', customer: 'David Kim', amount: '5 stars', time: '23 min ago', type: 'review' },
                      { action: 'Return processed', customer: 'Lisa Thompson', amount: '$899', time: '1 hour ago', type: 'return' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-dark-700/30 transition-colors">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'order' ? 'bg-green-500/20 text-green-400' :
                          activity.type === 'payment' ? 'bg-primary-500/20 text-primary-400' :
                          activity.type === 'signup' ? 'bg-blue-500/20 text-blue-400' :
                          activity.type === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {activity.type === 'order' && <ShoppingCart className="w-4 h-4" />}
                          {activity.type === 'payment' && <DollarSign className="w-4 h-4" />}
                          {activity.type === 'signup' && <Users className="w-4 h-4" />}
                          {activity.type === 'review' && <Eye className="w-4 h-4" />}
                          {activity.type === 'return' && <RefreshCw className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{activity.action}</p>
                          <p className="text-dark-400 text-sm">{activity.customer}</p>
                        </div>
                        <div className="text-right">
                          {activity.amount && (
                            <p className="text-white font-medium">{activity.amount}</p>
                          )}
                          <p className="text-dark-400 text-sm">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePage === 'customers' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white">Customer Management</h2>
                    <p className="text-dark-400 mt-1">Manage your customer base and track engagement</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-dark-800/50 hover:bg-dark-700/50 rounded-lg border border-dark-600 text-white transition-colors">
                      <Search className="w-4 h-4" />
                      <span className="hidden sm:inline">Search Customers</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white transition-colors">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Customer</span>
                    </button>
                  </div>
                </div>

                {/* Customer Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-sm text-green-400 font-medium">Active</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{customersData.filter(c => c.status === 'Active').length}</p>
                    <p className="text-dark-400 text-sm">Customers</p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-sm text-blue-400 font-medium">Regular</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{customersData.filter(c => c.status === 'Regular').length}</p>
                    <p className="text-dark-400 text-sm">Customers</p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-yellow-400" />
                      </div>
                      <span className="text-sm text-yellow-400 font-medium">Inactive</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{customersData.filter(c => c.status === 'Inactive').length}</p>
                    <p className="text-dark-400 text-sm">Customers</p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-primary-400" />
                      </div>
                      <span className="text-sm text-primary-400 font-medium">Avg LTV</span>
                    </div>
                    <p className="text-2xl font-bold text-white">${(customersData.reduce((sum, c) => sum + c.totalSpent, 0) / customersData.length).toFixed(0)}</p>
                    <p className="text-dark-400 text-sm">Per Customer</p>
                  </div>
                </div>

                {/* Customer Table */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
                  <div className="p-6 border-b border-dark-700/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Customer Directory</h3>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-dark-400 hover:text-white" />
                        </button>
                        <button className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors">
                          <RefreshCw className="w-4 h-4 text-dark-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-900/50">
                        <tr>
                          <th className="text-left p-4 text-dark-400 font-medium">Customer</th>
                          <th className="text-left p-4 text-dark-400 font-medium hidden lg:table-cell">Location</th>
                          <th className="text-left p-4 text-dark-400 font-medium">Orders</th>
                          <th className="text-left p-4 text-dark-400 font-medium">Total Spent</th>
                          <th className="text-left p-4 text-dark-400 font-medium hidden md:table-cell">Last Order</th>
                          <th className="text-left p-4 text-dark-400 font-medium">Status</th>
                          <th className="text-left p-4 text-dark-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersData.slice(0, 10).map((customer) => (
                          <tr key={customer.id} className="border-t border-dark-700/30 hover:bg-dark-700/20 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {customer.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{customer.name}</p>
                                  <p className="text-dark-400 text-sm">{customer.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-dark-300 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-dark-400" />
                                {customer.location}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-white font-medium">{customer.totalOrders}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-white font-medium">${customer.totalSpent.toFixed(0)}</span>
                            </td>
                            <td className="p-4 text-dark-300 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-dark-400" />
                                {customer.lastOrderDate.toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                customer.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                                customer.status === 'Regular' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {customer.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors group">
                                  <Eye className="w-4 h-4 text-dark-400 group-hover:text-primary-400" />
                                </button>
                                <button className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors group">
                                  <Mail className="w-4 h-4 text-dark-400 group-hover:text-blue-400" />
                                </button>
                                <button className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors group">
                                  <Edit className="w-4 h-4 text-dark-400 group-hover:text-yellow-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 border-t border-dark-700/50 flex items-center justify-between">
                    <p className="text-dark-400 text-sm">Showing 10 of {customersData.length} customers</p>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 bg-dark-700 hover:bg-dark-600 rounded-lg text-white text-sm transition-colors">
                        Previous
                      </button>
                      <button className="px-3 py-1 bg-primary-500 hover:bg-primary-600 rounded-lg text-white text-sm transition-colors">
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <h3 className="text-lg font-semibold text-white mb-6">Top Customers by Spend</h3>
                    <div className="space-y-4">
                      {customersData.slice(0, 5).map((customer, index) => (
                        <div key={customer.id} className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{customer.name}</p>
                            <p className="text-dark-400 text-sm">{customer.totalOrders} orders</p>
                          </div>
                          <p className="text-primary-400 font-semibold">${customer.totalSpent.toFixed(0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <h3 className="text-lg font-semibold text-white mb-6">Recent Customer Activity</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Sarah Chen', action: 'Placed a new order', time: '5 min ago', amount: '$1,299' },
                        { name: 'Marcus Johnson', action: 'Updated profile', time: '12 min ago', amount: null },
                        { name: 'Emily Rodriguez', action: 'Left a review', time: '25 min ago', amount: '5 stars' },
                        { name: 'David Kim', action: 'Completed BNPL payment', time: '1 hour ago', amount: '$267' },
                        { name: 'Lisa Thompson', action: 'Requested return', time: '2 hours ago', amount: '$899' }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {activity.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{activity.name}</p>
                            <p className="text-dark-400 text-sm">{activity.action}</p>
                          </div>
                          <div className="text-right">
                            {activity.amount && (
                              <p className="text-primary-400 font-medium text-sm">{activity.amount}</p>
                            )}
                            <p className="text-dark-400 text-xs">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePage === 'settings' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white">Store Settings</h2>
                    <p className="text-dark-400 mt-1">Configure your store and MorphCredit integration</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-dark-800/50 hover:bg-dark-700/50 rounded-lg border border-dark-600 text-white transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Import Settings</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white transition-colors">
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">Save Changes</span>
                    </button>
                  </div>
                </div>

                {/* Settings Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Store Configuration */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                          <Settings className="w-5 h-5 text-primary-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Store Information</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Store Name</label>
                            <input 
                              type="text" 
                              value="TechStore Pro"
                              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Store URL</label>
                            <input 
                              type="text" 
                              value="techstore.morphcredit.demo"
                              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-300 mb-2">Store Description</label>
                          <textarea 
                            rows={3}
                            value="Premium technology retailer offering the latest gadgets with flexible payment options through MorphCredit BNPL."
                            className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Contact Email</label>
                            <input 
                              type="email" 
                              value="support@techstore.com"
                              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Phone Number</label>
                            <input 
                              type="tel" 
                              value="+1 (555) 123-4567"
                              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MorphCredit Integration */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                          <CreditCard className="w-5 h-5 text-primary-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">MorphCredit BNPL Settings</h3>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">Connected</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Minimum Order Amount</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                              <input 
                                type="number" 
                                value="50"
                                className="w-full bg-dark-700/50 border border-dark-600 rounded-lg pl-10 pr-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Maximum Order Amount</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                              <input 
                                type="number" 
                                value="5000"
                                className="w-full bg-dark-700/50 border border-dark-600 rounded-lg pl-10 pr-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Default Installments</label>
                            <select className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                              <option value="4">4 payments</option>
                              <option value="6">6 payments</option>
                              <option value="8">8 payments</option>
                              <option value="12">12 payments</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">Interest Rate</label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                              <input 
                                type="number" 
                                value="12.5"
                                step="0.1"
                                className="w-full bg-dark-700/50 border border-dark-600 rounded-lg pl-10 pr-3 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                          <div>
                            <p className="text-white font-medium">Auto-approve orders</p>
                            <p className="text-dark-400 text-sm">Automatically approve BNPL orders under threshold</p>
                          </div>
                          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-500 transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                          <div>
                            <p className="text-white font-medium">Risk assessment</p>
                            <p className="text-dark-400 text-sm">Enable enhanced credit scoring and risk analysis</p>
                          </div>
                          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-500 transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <Bell className="w-5 h-5 text-yellow-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { title: 'New Orders', description: 'Get notified when customers place new orders', enabled: true },
                          { title: 'BNPL Applications', description: 'Notifications for new BNPL applications', enabled: true },
                          { title: 'Payment Received', description: 'Alerts when installment payments are received', enabled: false },
                          { title: 'Failed Payments', description: 'Immediate alerts for failed payment attempts', enabled: true },
                          { title: 'Customer Reviews', description: 'Notifications when customers leave reviews', enabled: false },
                          { title: 'Low Stock', description: 'Alerts when product inventory is running low', enabled: true }
                        ].map((notification, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                            <div>
                              <p className="text-white font-medium">{notification.title}</p>
                              <p className="text-dark-400 text-sm">{notification.description}</p>
                            </div>
                            <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              notification.enabled ? 'bg-primary-500' : 'bg-dark-600'
                            }`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                notification.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Security Status */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Shield className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Security Status</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-white">SSL Certificate</span>
                          </div>
                          <span className="text-xs text-green-400 font-medium">Active</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-white">API Keys</span>
                          </div>
                          <span className="text-xs text-green-400 font-medium">Secure</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-white">Backup</span>
                          </div>
                          <span className="text-xs text-yellow-400 font-medium">Due</span>
                        </div>
                        
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 transition-colors">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-medium">Run Security Scan</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                      
                      <div className="space-y-3">
                        <button className="w-full flex items-center gap-3 p-3 bg-dark-700/50 hover:bg-dark-600/50 rounded-lg text-left transition-colors">
                          <Download className="w-4 h-4 text-primary-400" />
                          <span className="text-white text-sm">Export Data</span>
                        </button>
                        
                        <button className="w-full flex items-center gap-3 p-3 bg-dark-700/50 hover:bg-dark-600/50 rounded-lg text-left transition-colors">
                          <Upload className="w-4 h-4 text-blue-400" />
                          <span className="text-white text-sm">Import Products</span>
                        </button>
                        
                        <button className="w-full flex items-center gap-3 p-3 bg-dark-700/50 hover:bg-dark-600/50 rounded-lg text-left transition-colors">
                          <RefreshCw className="w-4 h-4 text-yellow-400" />
                          <span className="text-white text-sm">Sync Inventory</span>
                        </button>
                        
                        <button className="w-full flex items-center gap-3 p-3 bg-dark-700/50 hover:bg-dark-600/50 rounded-lg text-left transition-colors">
                          <Globe className="w-4 h-4 text-green-400" />
                          <span className="text-white text-sm">API Documentation</span>
                        </button>
                      </div>
                    </div>

                    {/* Theme Customization */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Palette className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Theme</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-dark-300 mb-2">Primary Color</label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-500 rounded-lg"></div>
                            <input 
                              type="text" 
                              value="#0ea5e9"
                              className="flex-1 bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-dark-300 mb-2">Accent Color</label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-accent-500 rounded-lg"></div>
                            <input 
                              type="text" 
                              value="#10b981"
                              className="flex-1 bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <Cart
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
          totalPrice={getTotalPrice()}
        />
      )}

      {/* Order Confirmation Modal */}
      {showOrderConfirmation && orderDetails && (
        <OrderConfirmation
          order={orderDetails}
          onClose={() => setShowOrderConfirmation(false)}
        />
      )}
    </div>
  );
};

export default App;