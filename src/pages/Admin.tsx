import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Edit, Trash2, LogOut, Settings, LayoutDashboard, 
  UtensilsCrossed, Users, QrCode, History, TrendingUp, ShoppingBag, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { formatNepalDateTime, formatNepalDateReadable } from '@/lib/nepalTime';

type Category = 'Tea' | 'Snacks' | 'Cold Drink' | 'Pastry';
const categories: Category[] = ['Tea', 'Snacks', 'Cold Drink', 'Pastry'];

export default function Admin() {
  const navigate = useNavigate();
  const { 
    menuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability,
    customers, transactions, staff, settings, updateSettings,
    isAuthenticated, currentUser, logout, getTodayStats
  } = useStore();

  const [tab, setTab] = useState('dashboard');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<{ name: string; price: string; category: Category }>({ 
    name: '', price: '', category: 'Tea' 
  });

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    navigate('/auth');
    return null;
  }

  const stats = getTodayStats();

  const thisWeekRevenue = transactions
    .filter(t => {
      const date = new Date(t.paidAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    })
    .reduce((sum, t) => sum + t.total, 0);

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) {
      toast.error('Please fill all fields');
      return;
    }
    addMenuItem({ 
      name: newItem.name, 
      price: parseFloat(newItem.price), 
      category: newItem.category, 
      available: true 
    });
    toast.success('Item added');
    setNewItem({ name: '', price: '', category: 'Tea' });
    setIsAddingItem(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    updateMenuItem(editingItem.id, editingItem);
    toast.success('Item updated');
    setEditingItem(null);
  };

  const handleLogout = () => { 
    logout(); 
    navigate('/auth'); 
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'history', label: 'History', icon: History },
    { id: 'qr', label: 'Tables & QR', icon: QrCode },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-lg">{settings.restaurantName}</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full nav-item ${tab === item.id ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto flex flex-col">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">{formatNepalDateTime(new Date())}</p>
        </div>
        <div className="flex-1">

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <StatCard icon={DollarSign} label="Today's Revenue" value={`रू ${stats.revenue}`} color="primary" />
              <StatCard icon={ShoppingBag} label="Orders Today" value={stats.orders.toString()} color="success" />
              <StatCard icon={TrendingUp} label="This Week" value={`रू ${thisWeekRevenue}`} color="accent" />
              <StatCard icon={Users} label="Total Customers" value={customers.length.toString()} color="warning" />
            </div>
          </div>
        )}

        {/* Menu */}
        {tab === 'menu' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Menu Management</h2>
              <Button onClick={() => setIsAddingItem(true)} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>
            {categories.map(cat => (
              <div key={cat} className="mb-8">
                <h3 className="font-bold text-lg mb-3 text-primary">{cat}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {menuItems.filter(m => m.category === cat).map(item => (
                    <div key={item.id} className={`bg-card rounded-xl border border-border p-4 ${!item.available ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-primary font-bold">रू {item.price}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleItemAvailability(item.id)} className="text-muted-foreground hover:text-foreground">
                            {item.available ? '✓' : '✗'}
                          </button>
                          <button onClick={() => setEditingItem(item)}><Edit className="w-4 h-4 text-muted-foreground" /></button>
                          <button onClick={() => { deleteMenuItem(item.id); toast.success('Deleted'); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Customers */}
        {tab === 'customers' && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Orders</th>
                  <th className="text-left p-4">Total Spent</th>
                  <th className="text-left p-4">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No customers yet</td></tr>
                ) : customers.map(c => (
                  <tr key={c.phone} className="border-t border-border">
                    <td className="p-4 font-mono">{c.phone}</td>
                    <td className="p-4">{c.totalOrders}</td>
                    <td className="p-4 font-bold">रू {c.totalSpent}</td>
                    <td className="p-4 text-muted-foreground">{formatNepalDateReadable(c.lastVisit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">Time</th>
                  <th className="text-left p-4">Table</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Method</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice().reverse().map(t => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="p-4">{formatNepalDateTime(t.paidAt)}</td>
                    <td className="p-4">Table {t.tableNumber}</td>
                    <td className="p-4 font-bold">रू {t.total}</td>
                    <td className="p-4">{t.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* QR */}
        {tab === 'qr' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Tables & QR Codes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: settings.tableCount }, (_, i) => i + 1).map(num => (
                <div key={num} className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="font-bold text-lg mb-2">Table {num}</p>
                  <p className="text-xs text-muted-foreground break-all">/table/{num}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Restaurant Name</label>
                <Input value={settings.restaurantName} onChange={e => updateSettings({ restaurantName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Table Count</label>
                <Input type="number" value={settings.tableCount} onChange={e => updateSettings({ tableCount: parseInt(e.target.value) || 10 })} />
              </div>
              <div>
                <label className="text-sm font-medium">WiFi SSID</label>
                <Input value={settings.wifiSSID} onChange={e => updateSettings({ wifiSSID: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">WiFi Password</label>
                <Input value={settings.wifiPassword} onChange={e => updateSettings({ wifiPassword: e.target.value })} />
              </div>
            </div>
          </div>
        )}
        </div>
        
        {/* Copyright Footer */}
        <footer className="mt-auto pt-8 pb-4 text-center border-t border-border">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings.restaurantName}. All rights reserved.
          </p>
        </footer>
      </main>

      {/* Add Item Modal */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Item name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            <Input placeholder="Price" type="number" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
            <Select value={newItem.category} onValueChange={(v: Category) => setNewItem({ ...newItem, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingItem(false)}>Cancel</Button>
            <Button onClick={handleAddItem} className="gradient-primary">Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <Input value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
              <Input type="number" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })} />
              <Select value={editingItem.category} onValueChange={(v: Category) => setEditingItem({ ...editingItem, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleUpdateItem} className="gradient-primary">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { 
  icon: any; label: string; value: string; 
  color: 'primary' | 'success' | 'accent' | 'warning';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    accent: 'text-secondary bg-secondary/10',
    warning: 'text-warning bg-warning/10',
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
