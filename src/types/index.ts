export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  table: number;
  phone: string;
  items: OrderItem[];
  status: OrderStatus;
  time: string;
  total: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

export interface Bill {
  id: string;
  table: number;
  customers: string[];
  orders: Order[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'active' | 'paid';
  paidAt?: string;
  paymentMethod?: 'cash' | 'fonepay';
}

export interface Transaction {
  id: string;
  billId: string;
  table: number;
  customers: string[];
  total: number;
  paymentMethod: 'cash' | 'fonepay';
  paidAt: string;
  items: OrderItem[];
}

export interface Customer {
  phone: string;
  name?: string;
  loyaltyPoints: number;
  visits: number;
  lastVisit?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeOrders: number;
  activeTables: number;
}
