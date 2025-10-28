// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'https://tradesphere-backend-g0sr.onrender.com/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ===============================
  // AUTH METHODS
  // ===============================
  async register(userData: any) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(credentials: any) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // ===============================
  // PRODUCT METHODS
  // ===============================
  async getProducts(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products${queryString ? '?' + queryString : ''}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  // ===============================
  // CATEGORY METHODS
  // ===============================
  async getCategories() {
    return this.request('/categories');
  }

  // ===============================
  // CART METHODS
  // ===============================
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId: string, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: string, quantity: number) {
    return this.request(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: string) {
    return this.request(`/cart/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart/clear', {
      method: 'DELETE',
    });
  }

  // ===============================
  // ORDER METHODS (Updated)
  // ===============================
  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getMyOrders() {
    return this.request('/orders');
  }

  // 💳 PAYMENT METHODS
  async verifyPayment(reference: string) {
    return this.request('/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  }

  async confirmBankTransfer(orderId: string, transferReference: string) {
    return this.request(`/orders/${orderId}/confirm-transfer`, {
      method: 'PUT',
      body: JSON.stringify({ transferReference }),
    });
  }

  // ===============================
  // REVIEW METHODS
  // ===============================
  async getProductReviews(productId: string) {
    return this.request(`/reviews/product/${productId}`);
  }

  async createReview(reviewData: any) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // ===============================
  // WISHLIST METHODS
  // ===============================
  async getWishlist() {
    return this.request('/wishlist');
  }

  async addToWishlist(productId: string) {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  async removeFromWishlist(productId: string) {
    return this.request(`/wishlist/${productId}`, {
      method: 'DELETE',
    });
  }

  // ===============================
  // VENDOR METHODS
  // ===============================
  async getVendorDashboard() {
    return this.request('/vendor/dashboard');
  }

  async getVendorProducts(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/vendor/products${queryString ? '?' + queryString : ''}`);
  }

  async getVendorOrders(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/vendor/orders${queryString ? '?' + queryString : ''}`);
  }

  // ===============================
  // USER PROFILE
  // ===============================
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // ===============================
  // PRODUCT MANAGEMENT (Vendor)
  // ===============================
  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

export const api = new ApiClient();
export default api;
