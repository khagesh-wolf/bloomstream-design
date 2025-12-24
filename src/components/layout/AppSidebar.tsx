import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { NavLink } from '@/components/NavLink';
import { 
  CreditCard, 
  ChefHat, 
  Settings, 
  LayoutDashboard,
  LogOut,
  Coffee,
  ShieldCheck
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, currentUser, logout } = useStore();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  // Determine if user has admin access
  const hasAdminAccess = currentUser?.role === 'admin' || settings.counterAsAdmin;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const mainNavItems = [
    { path: '/', label: 'Hub', icon: LayoutDashboard },
    { path: '/counter', label: 'Counter', icon: CreditCard },
    { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Admin Panel', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          {settings.logo ? (
            <img 
              src={settings.logo} 
              alt="Logo" 
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Coffee className="w-5 h-5 text-primary" />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-lg font-semibold text-sidebar-foreground truncate">
                {settings.restaurantName}
              </span>
              {currentUser && (
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {currentUser.name} ({currentUser.role})
                </span>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                  >
                    <NavLink to={item.path}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only show if user has admin access */}
        {hasAdminAccess && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>
                <ShieldCheck className="w-3 h-3 mr-1" />
                {settings.counterAsAdmin && currentUser?.role === 'counter' 
                  ? 'Admin Mode' 
                  : 'Administration'
                }
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.path)}
                        tooltip={item.label}
                      >
                        <NavLink to={item.path}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip="Logout"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
