import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, Search, User, LogOut, Package, Heart } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  cartItemCount?: number;
}

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

export const Header = ({ cartItemCount = 0 }: HeaderProps) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.getCurrentUser();
          if (response.success) {
            setUser(response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        api.setToken(null);
      }
    };

    getCurrentUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await api.logout();
      setUser(null);
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity"
          >
            <Package className="h-8 w-8" />
            <span>TradeSphere</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center space-x-2 flex-1 max-w-md mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
          </form>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <Link to="/shop">
              <Button variant="ghost" size="sm">
                Shop
              </Button>
            </Link>

            {user ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-5 w-5" />
                      <span className="hidden md:inline-block ml-2">
                        {user.fullName || 'Account'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>

                    {user.role === 'vendor' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/vendor/dashboard" className="cursor-pointer">
                            <Package className="mr-2 h-4 w-4" />
                            Vendor Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/auth">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};