import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Coffee, ChefHat, CreditCard, LayoutDashboard, Settings } from 'lucide-react';
import { BackendConfig } from '@/components/BackendConfig';
import { SyncStatus } from '@/components/SyncStatus';

const navItems = [
  { path: '/', label: 'Hub', icon: LayoutDashboard },
  { path: '/counter', label: 'Counter', icon: CreditCard },
  { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { path: '/admin', label: 'Admin', icon: Settings },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-xl font-semibold gradient-text">
              Chiyadani
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}

            <SyncStatus />
            <BackendConfig />
          </div>
        </div>
      </div>
    </nav>
  );
}
