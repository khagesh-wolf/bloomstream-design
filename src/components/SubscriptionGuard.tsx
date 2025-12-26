import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionLockScreen } from './SubscriptionLockScreen';
import { SubscriptionWarning } from './SubscriptionWarning';

interface SubscriptionGuardProps {
  children: ReactNode;
}

// Customer-facing routes where subscription check should be skipped entirely
const CUSTOMER_ROUTES = ['/', '/table'];

function isCustomerRoute(pathname: string): boolean {
  return CUSTOMER_ROUTES.some(route => 
    pathname === route || pathname.startsWith('/table/')
  );
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  // Skip subscription check entirely for customer routes
  if (isCustomerRoute(pathname)) {
    return <>{children}</>;
  }
  
  return <SubscriptionGuardInternal>{children}</SubscriptionGuardInternal>;
}

// Internal component that actually checks subscription (only for staff routes)
function SubscriptionGuardInternal({ children }: { children: ReactNode }) {
  const { status, isLoading, isValid, showWarning, refresh } = useSubscription();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const hideWarning = isCustomerRoute(pathname);

  // Don't show separate loading - let DataProvider handle it
  // Only block if we positively know subscription is invalid
  if (!isLoading && !isValid && status) {
    return (
      <SubscriptionLockScreen 
        status={status} 
        onRefresh={refresh}
        isRefreshing={isLoading}
      />
    );
  }

  const shouldShowWarning = showWarning && status && !hideWarning;

  return (
    <>
      {shouldShowWarning && <SubscriptionWarning status={status} />}
      <div className={shouldShowWarning ? 'pt-10' : ''}>
        {children}
      </div>
    </>
  );
}
