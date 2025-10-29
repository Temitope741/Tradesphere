import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, TrendingUp, Users, Package, ArrowRight } from 'lucide-react';
import api from '@/services/api';
import heroImage from '@/assets/hero-ecommerce.jpg';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  vendor: {
    fullName: string;
  };
  category: {
    name: string;
  };
  averageRating: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured products
        const productsResponse = await api.getProducts({ limit: 8 });
        if (productsResponse.success) {
          setFeaturedProducts(productsResponse.data);
        }

        // Fetch categories
        const categoriesResponse = await api.getCategories();
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data.slice(0, 6)); // Limit to 6 categories
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="E-commerce Hero" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            Your Marketplace
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-light">
              Awaits
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 animate-slide-up">
            Discover amazing products from trusted vendors worldwide. 
            Shop with confidence, sell with ease.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <Button variant="hero" size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/shop">
                Start Shopping
                <ShoppingCart className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button variant="premium" size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/auth?tab=vendor">
                Become a Vendor
                <TrendingUp className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose TradeSphere?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We connect customers with amazing vendors, creating a thriving marketplace ecosystem.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 shadow-card hover:shadow-elegant transition-all duration-300 transform hover:scale-105">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Quality Products</h3>
                <p className="text-muted-foreground">
                  Carefully curated products from verified vendors with quality guarantees.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-8 shadow-card hover:shadow-elegant transition-all duration-300 transform hover:scale-105">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold">Trusted Community</h3>
                <p className="text-muted-foreground">
                  Join thousands of satisfied customers and successful vendors in our marketplace.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-8 shadow-card hover:shadow-elegant transition-all duration-300 transform hover:scale-105">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary-light/10 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-primary-light" />
                </div>
                <h3 className="text-2xl font-semibold">Easy Growth</h3>
                <p className="text-muted-foreground">
                  Powerful tools for vendors to grow their business and reach more customers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-xl text-muted-foreground">
              Explore our wide range of product categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link 
                key={category._id} 
                to={`/shop?category=${category.slug}`}
                className="group"
              >
                <Card className="text-center p-6 hover:shadow-card transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  <CardContent className="space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-16">
            <div>
              <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
              <p className="text-xl text-muted-foreground">
                Discover top-rated products from our marketplace
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/shop">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product._id} className="group hover:shadow-card transition-all duration-300 overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={product.imageUrl || '/placeholder.svg'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category?.name}
                    </Badge>
                    <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      ₦{product.price}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">
                        {product.averageRating || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">
                      by {product.vendor?.fullName}
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/product/${product._id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Selling?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of successful vendors on our platform. Start your online business today 
            with our easy-to-use vendor tools and reach customers worldwide.
          </p>
          <Button variant="premium" size="lg" asChild className="text-lg px-8 py-6">
            <Link to="/auth?tab=vendor">
              Get Started as Vendor
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}