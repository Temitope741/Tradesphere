import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, Clock, CheckCircle, XCircle, Truck, CreditCard, CheckCheck } from 'lucide-react';

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
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string;
  trackingNumber?: string;
  createdAt: string;
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await api.getVendorOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.message?.includes('authorized') || error.message?.includes('login')) {
        navigate('/auth');
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const response = await api.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        });
        // Update local state
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleApprovePayment = async (orderId: string) => {
    setUpdatingOrder(orderId);
    try {
      const response = await api.approvePayment(orderId);
      if (response.success) {
        toast({
          title: "Payment Approved!",
          description: "The customer will see the payment as approved.",
        });
        // Update local state
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, paymentStatus: 'approved' } : order
        ));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
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

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="default" className="bg-blue-500">
            <CreditCard className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
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
          <h1 className="text-4xl font-bold">Vendor Orders</h1>
          <p className="text-muted-foreground mt-2">Manage your orders and approve payments</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Your orders will appear here</p>
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
                      <p className="text-sm font-semibold mt-1">
                        Customer: {order.customer?.fullName || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </Badge>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Order Items */}
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

                    {/* Order Details */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Customer Email</p>
                          <p className="font-semibold">{order.customer?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Customer Phone</p>
                          <p className="font-semibold">{order.phone || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Shipping Address</p>
                          <p className="font-semibold">{order.shippingAddress}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="font-semibold capitalize">
                            {order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}
                          </p>
                        </div>
                        {order.paymentReference && (
                          <div>
                            <p className="text-sm text-muted-foreground">Payment Reference</p>
                            <p className="font-mono text-sm font-semibold">{order.paymentReference}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span className="text-primary">₦{order.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t pt-4 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Update Order Status</label>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusUpdate(order._id, value)}
                          disabled={updatingOrder === order._id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      Approve Payment Button
                      {order.paymentStatus === 'pending' && (
                        <div className="flex-1 flex items-end">
                          <Button
                            onClick={() => handleApprovePayment(order._id)}
                            disabled={updatingOrder === order._id}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {updatingOrder === order._id ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Approve Payment
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {order.paymentStatus === 'approved' && (
                        <div className="flex-1 flex items-end">
                          <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                            <p className="text-green-700 font-semibold flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Payment Approved
                            </p>
                          </div>
                        </div>
                      )}
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