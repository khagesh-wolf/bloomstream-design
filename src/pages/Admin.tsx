import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useStore } from '@/store/useStore';
import { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  UtensilsCrossed,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { 
    menuItems, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    toggleItemAvailability,
    transactions,
    customers,
    getTodayStats
  } = useStore();

  const [tab, setTab] = useState('menu');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Tea' });

  const stats = getTodayStats();
  const categories = [...new Set(menuItems.map(m => m.category))];

  // Analytics data
  const thisWeekRevenue = transactions
    .filter(t => {
      const date = new Date(t.paidAt);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    })
    .reduce((sum, t) => sum + t.total, 0);

  const topItems = menuItems.map(item => ({
    ...item,
    sold: transactions.flatMap(t => t.items).filter(i => i.id === item.id).reduce((sum, i) => sum + i.qty, 0)
  })).sort((a, b) => b.sold - a.sold).slice(0, 5);

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) {
      toast.error('Please fill all fields');
      return;
    }
    addMenuItem({
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category,
      available: true,
    });
    toast.success('Menu item added');
    setNewItem({ name: '', price: '', category: 'Tea' });
    setIsAddingItem(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    updateMenuItem(editingItem.id, editingItem);
    toast.success('Menu item updated');
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMenuItem(id);
      toast.success('Menu item deleted');
    }
  };

  return (
    <PageLayout 
      title="Admin Dashboard" 
      subtitle="Manage menu, analytics & settings"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="menu">
            <UtensilsCrossed className="w-4 h-4 mr-2" /> Menu
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" /> Customers
          </TabsTrigger>
        </TabsList>

        {/* Menu Tab */}
        <TabsContent value="menu">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-xl font-semibold">Menu Items</h2>
            <Button onClick={() => setIsAddingItem(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="font-serif text-lg font-semibold text-primary mb-3">{category}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.filter(m => m.category === category).map(item => (
                    <div 
                      key={item.id} 
                      className={`glass-card p-4 ${!item.available ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-primary font-bold">₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleItemAvailability(item.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {item.available ? (
                              <ToggleRight className="w-6 h-6 text-success" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.available ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon={DollarSign} 
              label="Today's Revenue" 
              value={`₹${stats.revenue.toLocaleString()}`}
              color="primary"
            />
            <StatCard 
              icon={ShoppingBag} 
              label="Today's Orders" 
              value={stats.orders.toString()}
              color="success"
            />
            <StatCard 
              icon={TrendingUp} 
              label="This Week" 
              value={`₹${thisWeekRevenue.toLocaleString()}`}
              color="accent"
            />
            <StatCard 
              icon={Users} 
              label="Total Customers" 
              value={customers.length.toString()}
              color="warning"
            />
          </div>

          {/* Top Items */}
          <div className="glass-card p-6">
            <h3 className="font-serif text-xl font-semibold mb-4">Top Selling Items</h3>
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-muted-foreground">#{idx + 1}</span>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{item.sold} sold</p>
                    <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                  </div>
                </div>
              ))}
              {topItems.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No sales data yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Phone</th>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Visits</th>
                  <th className="text-left p-4 font-semibold">Loyalty Points</th>
                  <th className="text-left p-4 font-semibold">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No customers yet
                    </td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.phone} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-4 font-mono">{c.phone}</td>
                      <td className="p-4">{c.name || '-'}</td>
                      <td className="p-4">{c.visits}</td>
                      <td className="p-4">
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded font-medium">
                          {c.loyaltyPoints} pts
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Item Modal */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Item name" 
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <Input 
              placeholder="Price" 
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            />
            <select 
              className="w-full p-2 rounded-lg border border-border bg-background"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingItem(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Item name" 
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              />
              <Input 
                placeholder="Price" 
                type="number"
                value={editingItem.price}
                onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
              />
              <select 
                className="w-full p-2 rounded-lg border border-border bg-background"
                value={editingItem.category}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleUpdateItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  color: 'primary' | 'success' | 'accent' | 'warning';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    accent: 'text-accent bg-accent/10',
    warning: 'text-warning bg-warning/10',
  };

  return (
    <div className="glass-card p-6">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
