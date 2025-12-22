import { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  fullWidth?: boolean;
}

export function PageLayout({ children, title, subtitle, actions, fullWidth = false }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className={`pt-20 pb-8 ${fullWidth ? '' : 'container mx-auto px-4'}`}>
        {(title || actions) && (
          <div className="flex items-center justify-between mb-6">
            <div>
              {title && (
                <h1 className="font-serif text-3xl font-bold text-foreground">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
