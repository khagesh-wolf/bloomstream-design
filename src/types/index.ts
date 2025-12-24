export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Tea' | 'Snacks' | 'Cold Drink' | 'Pastry';
  available: boolean;
  description?: string;
  image?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  customerPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  total: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface Bill {
  id: string;
  tableNumber: number;
  orders: Order[];
  customerPhones: string[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'fonepay';
  paidAt?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  billId: string;
  tableNumber: number;
  customerPhones: string[];
  total: number;
  discount: number;
  paymentMethod: 'cash' | 'fonepay';
  paidAt: string;
  items: OrderItem[];
}

export interface Customer {
  phone: string;
  name?: string;
  totalOrders: number;
  totalSpent: number;
  points: number;
  lastVisit: string;
}

export interface Staff {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'counter';
  name: string;
  createdAt: string;
}

export interface Settings {
  restaurantName: string;
  tableCount: number;
  wifiSSID: string;
  wifiPassword: string;
  baseUrl: string;
  logo?: string;
  // Social media links
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  googleReviewUrl?: string;
  // Admin-less mode: counter gets full admin access
  counterAsAdmin?: boolean;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeOrders: number;
  activeTables: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: 'ingredients' | 'utilities' | 'salary' | 'maintenance' | 'other';
  createdAt: string;
  createdBy: string;
}

export interface WaiterCall {
  id: string;
  tableNumber: number;
  customerPhone: string;
  status: 'pending' | 'acknowledged';
  createdAt: string;
  acknowledgedAt?: string;
}
