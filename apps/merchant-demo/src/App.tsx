import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Home,
  Search,
  Filter
} from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { OrderConfirmation } from './components/OrderConfirmation';
import { ParticleBackground } from './components/ParticleBackground';

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
    <div className="min-h-screen bg-dark-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <ParticleBackground />
      
      {/* Header */}
      <header className="relative z-10 bg-dark-900/80 backdrop-blur-md border-b border-dark-700/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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
            <div className="hidden md:flex flex-1 max-w-md mx-8">
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

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="relative z-10 w-64 bg-dark-900/80 backdrop-blur-md border-r border-dark-700/50 min-h-screen sticky top-16">
          <nav className="p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
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
        <main className="flex-1 relative z-10">
          <div className="p-6">
            {activePage === 'home' && (
              <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl p-8 border border-primary-500/20">
                  <h1 className="text-3xl font-bold text-white mb-4">
                    Welcome to TechStore Pro
                  </h1>
                  <p className="text-dark-300 text-lg mb-6">
                    Discover the latest in technology with flexible payment options powered by MorphCredit.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-dark-400 text-sm">Total Sales</p>
                        <p className="text-2xl font-bold text-white">$124,567</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-primary-400" />
                    </div>
                  </div>
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-dark-400 text-sm">Orders</p>
                        <p className="text-2xl font-bold text-white">1,234</p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-accent-400" />
                    </div>
                  </div>
                  <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-dark-400 text-sm">Customers</p>
                        <p className="text-2xl font-bold text-white">567</p>
                      </div>
                      <Users className="w-8 h-8 text-secondary-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePage === 'customers' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Customer Management</h2>
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                  <p className="text-dark-400">Customer management features coming soon...</p>
                </div>
              </div>
            )}

            {activePage === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Store Settings</h2>
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                  <p className="text-dark-400">Store configuration options coming soon...</p>
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