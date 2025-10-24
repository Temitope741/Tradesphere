import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    imageUrl: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    fullName: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  phone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingNumber?: string;
  createdAt: string;
}

export default function VendorOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkVendorAccess();
    fetchOrders();
  }, []);

  const checkVendorAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await api.getCurrentUser();
      if (response.success) {
        if (response.data.role !== 'vendor') {
          toast({
            title: "Access Denied",
            description: "Only vendors can access this page.",
            variant: "destructive",
          });
          navigate('/');
        }
      }
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.getVendorOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await api.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        toast({ title: "Order status updated successfully" });
        fetchOrders();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Orders Management</h1>
          <p className="text-muted-foreground">Manage and track your customer orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground">Customer orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber || order._id.slice(-8)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order._id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Customer Details</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Name:</span>{' '}
                          {order.customer?.fullName || 'N/A'}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Email:</span>{' '}
                          {order.customer?.email || 'N/A'}
                        </p>
                        {order.phone && (
                          <p>
                            <span className="text-muted-foreground">Phone:</span>{' '}
                            {order.phone}
                          </p>
                        )}
                        <p>
                          <span className="text-muted-foreground">Address:</span>{' '}
                          {order.shippingAddress}
                        </p>
                        {order.paymentMethod && (
                          <p>
                            <span className="text-muted-foreground">Payment Method:</span>{' '}
                            <span className="capitalize">{order.paymentMethod.replace(/_/g, ' ')}</span>
                          </p>
                        )}
                        {order.trackingNumber && (
                          <p>
                            <span className="text-muted-foreground">Tracking:</span>{' '}
                            <span className="font-mono text-xs">{order.trackingNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold mb-3">Order Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item._id} className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {item.product.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} × ₦{item.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold">
                              ₦{item.totalPrice.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">
                          ₦{order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}