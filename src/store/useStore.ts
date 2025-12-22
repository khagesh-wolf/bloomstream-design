import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, Order, Bill, Transaction, Customer, OrderStatus } from '@/types';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Default menu items
const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Masala Chai', price: 30, category: 'Tea', available: true },
  { id: '2', name: 'Ginger Tea', price: 35, category: 'Tea', available: true },
  { id: '3', name: 'Green Tea', price: 40, category: 'Tea', available: true },
  { id: '4', name: 'Black Tea', price: 25, category: 'Tea', available: true },
  { id: '5', name: 'Milk Tea', price: 30, category: 'Tea', available: true },
  { id: '6', name: 'Lemon Tea', price: 35, category: 'Tea', available: true },
  { id: '7', name: 'Samosa', price: 25, category: 'Snacks', available: true },
  { id: '8', name: 'Pakoda', price: 40, category: 'Snacks', available: true },
  { id: '9', name: 'Biscuit', price: 15, category: 'Snacks', available: true },
  { id: '10', name: 'Toast', price: 30, category: 'Snacks', available: true },
  { id: '11', name: 'Sandwich', price: 60, category: 'Snacks', available: true },
  { id: '12', name: 'Momo', price: 80, category: 'Snacks', available: true },
];

interface StoreState {
  // Menu
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleItemAvailability: (id: string) => void;

  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'time'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;

  // Bills
  bills: Bill[];
  createBill: (table: number, customer: string) => string;
  addOrderToBill: (billId: string, order: Order) => void;
  payBill: (billId: string, paymentMethod: 'cash' | 'fonepay', discount?: number) => void;

  // Transactions (History)
  transactions: Transaction[];

  // Customers
  customers: Customer[];
  addOrUpdateCustomer: (phone: string, name?: string) => void;
  addLoyaltyPoints: (phone: string, points: number) => void;
  redeemLoyaltyPoints: (phone: string, points: number) => void;

  // Utility
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getActiveBills: () => Bill[];
  getPendingOrders: () => Order[];
  getTodayStats: () => { revenue: number; orders: number; activeOrders: number; activeTables: number };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Menu
      menuItems: defaultMenuItems,
      
      addMenuItem: (item) => set((state) => ({
        menuItems: [...state.menuItems, { ...item, id: generateId() }]
      })),
      
      updateMenuItem: (id, item) => set((state) => ({
        menuItems: state.menuItems.map(m => m.id === id ? { ...m, ...item } : m)
      })),
      
      deleteMenuItem: (id) => set((state) => ({
        menuItems: state.menuItems.filter(m => m.id !== id)
      })),
      
      toggleItemAvailability: (id) => set((state) => ({
        menuItems: state.menuItems.map(m => 
          m.id === id ? { ...m, available: !m.available } : m
        )
      })),

      // Orders
      orders: [],
      
      addOrder: (order) => {
        const newOrder: Order = {
          ...order,
          id: generateId(),
          time: new Date().toISOString(),
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
        return newOrder;
      },
      
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })),
      
      deleteOrder: (id) => set((state) => ({
        orders: state.orders.filter(o => o.id !== id)
      })),

      // Bills
      bills: [],
      
      createBill: (table, customer) => {
        const existingBill = get().bills.find(
          b => b.table === table && b.status === 'active'
        );
        if (existingBill) {
          if (!existingBill.customers.includes(customer)) {
            set((state) => ({
              bills: state.bills.map(b =>
                b.id === existingBill.id
                  ? { ...b, customers: [...b.customers, customer] }
                  : b
              )
            }));
          }
          return existingBill.id;
        }
        
        const newBill: Bill = {
          id: generateId(),
          table,
          customers: [customer],
          orders: [],
          subtotal: 0,
          discount: 0,
          total: 0,
          status: 'active',
        };
        set((state) => ({ bills: [...state.bills, newBill] }));
        return newBill.id;
      },
      
      addOrderToBill: (billId, order) => set((state) => ({
        bills: state.bills.map(b => {
          if (b.id === billId) {
            const orders = [...b.orders, order];
            const subtotal = orders.reduce((sum, o) => sum + o.total, 0);
            return { ...b, orders, subtotal, total: subtotal - b.discount };
          }
          return b;
        })
      })),
      
      payBill: (billId, paymentMethod, discount = 0) => {
        const bill = get().bills.find(b => b.id === billId);
        if (!bill) return;
        
        const total = bill.subtotal - discount;
        const paidAt = new Date().toISOString();
        
        // Create transaction
        const transaction: Transaction = {
          id: generateId(),
          billId,
          table: bill.table,
          customers: bill.customers,
          total,
          paymentMethod,
          paidAt,
          items: bill.orders.flatMap(o => o.items),
        };
        
        // Update bill status and add transaction
        set((state) => ({
          bills: state.bills.map(b =>
            b.id === billId
              ? { ...b, status: 'paid' as const, discount, total, paidAt, paymentMethod }
              : b
          ),
          transactions: [...state.transactions, transaction],
          // Mark all orders as paid
          orders: state.orders.map(o =>
            bill.orders.some(bo => bo.id === o.id)
              ? { ...o, status: 'paid' as OrderStatus }
              : o
          ),
        }));
        
        // Add loyalty points to customers
        bill.customers.forEach(phone => {
          get().addLoyaltyPoints(phone, Math.floor(total / 10));
        });
      },

      // Transactions
      transactions: [],

      // Customers
      customers: [],
      
      addOrUpdateCustomer: (phone, name) => set((state) => {
        const existing = state.customers.find(c => c.phone === phone);
        if (existing) {
          return {
            customers: state.customers.map(c =>
              c.phone === phone
                ? { ...c, name: name || c.name, visits: c.visits + 1, lastVisit: new Date().toISOString() }
                : c
            )
          };
        }
        return {
          customers: [...state.customers, {
            phone,
            name,
            loyaltyPoints: 0,
            visits: 1,
            lastVisit: new Date().toISOString(),
          }]
        };
      }),
      
      addLoyaltyPoints: (phone, points) => set((state) => ({
        customers: state.customers.map(c =>
          c.phone === phone
            ? { ...c, loyaltyPoints: c.loyaltyPoints + points }
            : c
        )
      })),
      
      redeemLoyaltyPoints: (phone, points) => set((state) => ({
        customers: state.customers.map(c =>
          c.phone === phone
            ? { ...c, loyaltyPoints: Math.max(0, c.loyaltyPoints - points) }
            : c
        )
      })),

      // Utility
      getOrdersByStatus: (status) => get().orders.filter(o => o.status === status),
      
      getActiveBills: () => get().bills.filter(b => b.status === 'active'),
      
      getPendingOrders: () => get().orders.filter(o => o.status === 'pending'),
      
      getTodayStats: () => {
        const today = new Date().toDateString();
        const todayTransactions = get().transactions.filter(
          t => new Date(t.paidAt).toDateString() === today
        );
        const activeOrders = get().orders.filter(
          o => ['pending', 'preparing', 'ready'].includes(o.status)
        );
        const activeTables = new Set(get().getActiveBills().map(b => b.table)).size;
        
        return {
          revenue: todayTransactions.reduce((sum, t) => sum + t.total, 0),
          orders: todayTransactions.length,
          activeOrders: activeOrders.length,
          activeTables,
        };
      },
    }),
    {
      name: 'chiyadani-store',
    }
  )
);
