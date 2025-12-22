import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useStore } from '@/store/useStore';
import { ChefHat, CreditCard, Settings, TrendingUp, Users, ShoppingBag, Coffee } from 'lucide-react';
import { LiveIndicator } from '@/components/ui/LiveIndicator';

const modules = [
  {
    path: '/kitchen',
    title: 'Kitchen Display',
    description: 'Live orders for cooking staff',
    icon: ChefHat,
    color: 'from-orange-500 to-amber-500',
  },
  {
    path: '/counter',
    title: 'Counter POS',
    description: 'Billing and payments',
    icon: CreditCard,
    color: 'from-emerald-500 to-green-500',
  },
  {
    path: '/admin',
    title: 'Admin Dashboard',
    description: 'Menu, analytics & settings',
    icon: Settings,
    color: 'from-blue-500 to-indigo-500',
  },
];

export default function Index() {
  const { getTodayStats, getPendingOrders } = useStore();
  const stats = getTodayStats();
  const pendingOrders = getPendingOrders();

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-background border border-border mb-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23d4a574%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Coffee className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-4xl font-bold gradient-text">
                Chiyadani System
              </h1>
              <p className="text-muted-foreground mt-1">
                Tea Restaurant Management Portal
              </p>
            </div>
          </div>
          
          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-2 mt-4 text-warning">
              <LiveIndicator color="amber" />
              <span className="font-medium">
                {pendingOrders.length} pending order{pendingOrders.length > 1 ? 's' : ''} waiting
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Today's Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          trend={stats.revenue > 0 ? '+' : ''}
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders Completed"
          value={stats.orders.toString()}
        />
        <StatCard
          icon={ChefHat}
          label="Active Orders"
          value={stats.activeOrders.toString()}
          highlight={stats.activeOrders > 0}
        />
        <StatCard
          icon={Users}
          label="Active Tables"
          value={stats.activeTables.toString()}
        />
      </div>

      {/* Module Cards */}
      <h2 className="font-serif text-2xl font-semibold mb-4">Quick Access</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.path}
              to={module.path}
              className="glass-card-hover p-6 group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                {module.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {module.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-muted-foreground text-sm">
        <p>Chiyadani System v2.0 • Built with ❤️</p>
      </div>
    </PageLayout>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  highlight 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  trend?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`glass-card p-4 ${highlight ? 'border-primary/30' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
        {trend && <span className="text-success text-xs font-medium">{trend}</span>}
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
