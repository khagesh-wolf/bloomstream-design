import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { SyncStatus } from '@/components/SyncStatus';
import { ServerConfig } from '@/components/ServerConfig';

interface MainLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  headerContent?: ReactNode;
}

export function MainLayout({ children, showHeader = true, headerContent }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {showHeader && (
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              {headerContent}
            </div>
            <div className="flex items-center gap-2">
              <SyncStatus />
              <ServerConfig />
            </div>
          </header>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
