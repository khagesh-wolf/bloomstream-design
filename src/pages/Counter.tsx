import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useStore } from '@/store/useStore';
import { Order, OrderItem, Bill } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Check,
  History,
  Receipt,
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function Counter() {
  const { 
    menuItems, 
    orders, 
    bills, 
    transactions,
    createBill, 
    addOrder,
    addOrderToBill, 
    payBill,
    updateOrderStatus,
    customers,
    addOrUpdateCustomer
  } = useStore();

  const [tab, setTab] = useState('order');
  const [table, setTable] = useState('');
  const [phone, setPhone] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const activeBills = bills.filter(b => b.status === 'active');
  const pendingOrders = orders.filter(o => o.status === 'pending');

  // Menu categories
  const categories = [...new Set(menuItems.map(m => m.category))];

  const addToCart = (item: typeof menuItems[0]) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.id === item.id ? { ...c, qty: c.qty + 1 } : c
      ));
    } else {
      setCart([...cart, { id: item.id, name: item.name, qty: 1, price: item.price }]);
    }
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : c;
      }
      return c;
    }).filter(c => c.qty > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const placeOrder = () => {
    if (!table || !phone || cart.length === 0) {
      toast.error('Please fill table number, phone, and add items');
      return;
    }

    const tableNum = parseInt(table);
    
    // Create or get bill
    const billId = createBill(tableNum, phone);
    
    // Add customer
    addOrUpdateCustomer(phone);
    
    // Create order
    const order: Order = {
      id: Math.random().toString(36).substring(2, 9),
      table: tableNum,
      phone,
      items: cart,
      status: 'pending',
      time: new Date().toISOString(),
      total: cartTotal,
    };
    
    addOrder(order);
    addOrderToBill(billId, order);
    
    toast.success('Order placed successfully!');
    setCart([]);
    setTable('');
    setPhone('');
  };

  const handleAcceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'preparing');
    toast.success('Order accepted');
  };

  const handleRejectOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
    toast.info('Order rejected');
  };

  const toggleBillSelection = (billId: string) => {
    setSelectedBills(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const selectedBillsTotal = selectedBills.reduce((sum, id) => {
    const bill = bills.find(b => b.id === id);
    return sum + (bill?.total || 0);
  }, 0);

  const handlePayment = (method: 'cash' | 'fonepay') => {
    selectedBills.forEach(id => {
      payBill(id, method);
    });
    toast.success(`Payment of ₹${selectedBillsTotal} completed via ${method}`);
    setSelectedBills([]);
    setPaymentModal(false);
  };

  const filteredTransactions = searchTerm 
    ? transactions.filter(t => 
        t.table.toString().includes(searchTerm) || 
        t.customers.some(c => c.includes(searchTerm))
      )
    : transactions;

  return (
    <PageLayout 
      title="Counter POS" 
      subtitle="Order & billing management"
      fullWidth
    >
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Sidebar - Pending Orders */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Incoming Orders</h3>
              <div className="flex items-center gap-2">
                <LiveIndicator color={pendingOrders.length > 0 ? 'amber' : 'green'} />
                <span className="text-sm text-muted-foreground">{pendingOrders.length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {pendingOrders.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No pending orders
              </div>
            ) : (
              pendingOrders.map(order => (
                <div key={order.id} className="glass-card p-3 border-l-4 border-warning animate-slide-in">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold">Table {order.table}</span>
                      <p className="text-xs text-muted-foreground">{order.phone}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.qty}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => handleAcceptOrder(order.id)}
                    >
                      <Check className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRejectOrder(order.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
            <div className="border-b border-border px-4">
              <TabsList className="bg-transparent h-12">
                <TabsTrigger value="order" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ShoppingCart className="w-4 h-4 mr-2" /> New Order
                </TabsTrigger>
                <TabsTrigger value="bills" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Receipt className="w-4 h-4 mr-2" /> Active Bills ({activeBills.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <History className="w-4 h-4 mr-2" /> History
                </TabsTrigger>
              </TabsList>
            </div>

            {/* New Order Tab */}
            <TabsContent value="order" className="flex-1 flex m-0">
              {/* Menu Grid */}
              <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
                <div className="flex gap-4 mb-4">
                  <Input 
                    placeholder="Table No." 
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    className="w-32"
                    type="number"
                  />
                  <Input 
                    placeholder="Customer Phone" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-48"
                  />
                </div>

                {categories.map(category => (
                  <div key={category} className="mb-6">
                    <h3 className="font-serif text-lg font-semibold mb-3 text-primary">{category}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {menuItems
                        .filter(m => m.category === category && m.available)
                        .map(item => (
                          <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="glass-card-hover p-4 text-left"
                          >
                            <p className="font-medium">{item.name}</p>
                            <p className="text-primary font-bold">₹{item.price}</p>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Sidebar */}
              <div className="w-80 bg-card border-l border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Cart
                    {cart.length > 0 && (
                      <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs">
                        {cart.reduce((sum, c) => sum + c.qty, 0)}
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                  {cart.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Cart is empty
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-secondary/50 p-2 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-6 h-6 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-medium">{item.qty}</span>
                          <button 
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-6 h-6 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 rounded bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{cartTotal}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={cart.length === 0 || !table || !phone}
                    onClick={placeOrder}
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Active Bills Tab */}
            <TabsContent value="bills" className="flex-1 p-4 overflow-y-auto m-0">
              {activeBills.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Receipt className="w-16 h-16 mx-auto opacity-50 mb-4" />
                  <p>No active bills</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {activeBills.map(bill => (
                      <div 
                        key={bill.id}
                        onClick={() => toggleBillSelection(bill.id)}
                        className={`glass-card p-4 cursor-pointer transition-all ${
                          selectedBills.includes(bill.id) 
                            ? 'border-success ring-2 ring-success/20' 
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-bold text-lg">Table {bill.table}</span>
                            <p className="text-sm text-muted-foreground">
                              {bill.customers.join(', ')}
                            </p>
                          </div>
                          {selectedBills.includes(bill.id) && (
                            <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                              <Check className="w-4 h-4 text-success-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 text-sm mb-3">
                          {bill.orders.flatMap(o => o.items).slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-muted-foreground">
                              <span>{item.qty}x {item.name}</span>
                              <span>₹{item.price * item.qty}</span>
                            </div>
                          ))}
                          {bill.orders.flatMap(o => o.items).length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{bill.orders.flatMap(o => o.items).length - 3} more items
                            </p>
                          )}
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                          <span>Total</span>
                          <span className="text-primary">₹{bill.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 p-4 overflow-y-auto m-0">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by table or phone" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Bill ID</th>
                      <th className="text-left p-4 font-semibold">Time</th>
                      <th className="text-left p-4 font-semibold">Table</th>
                      <th className="text-left p-4 font-semibold">Customers</th>
                      <th className="text-left p-4 font-semibold">Total</th>
                      <th className="text-left p-4 font-semibold">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.slice().reverse().map(t => (
                        <tr key={t.id} className="border-t border-border hover:bg-secondary/30">
                          <td className="p-4 font-mono text-sm">#{t.id.slice(-6)}</td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(t.paidAt).toLocaleString()}
                          </td>
                          <td className="p-4">Table {t.table}</td>
                          <td className="p-4">{t.customers.join(', ')}</td>
                          <td className="p-4 font-bold text-primary">₹{t.total}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              t.paymentMethod === 'cash' 
                                ? 'bg-success/20 text-success' 
                                : 'bg-accent/20 text-accent'
                            }`}>
                              {t.paymentMethod.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedBills.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-6 py-3 shadow-xl flex items-center gap-6 animate-slide-up">
          <span className="font-medium">
            {selectedBills.length} bill{selectedBills.length > 1 ? 's' : ''} selected
          </span>
          <span className="text-xl font-bold text-primary">₹{selectedBillsTotal}</span>
          <Button onClick={() => setPaymentModal(true)}>
            Pay & Clear
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Confirm Payment</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-center mb-6">
              <p className="text-muted-foreground mb-2">Total Amount</p>
              <p className="text-4xl font-bold text-primary">₹{selectedBillsTotal}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col gap-2"
                onClick={() => handlePayment('cash')}
              >
                <Banknote className="w-6 h-6" />
                <span>Cash</span>
              </Button>
              <Button 
                size="lg" 
                className="h-20 flex-col gap-2 bg-accent hover:bg-accent/90"
                onClick={() => handlePayment('fonepay')}
              >
                <CreditCard className="w-6 h-6" />
                <span>Fonepay</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
