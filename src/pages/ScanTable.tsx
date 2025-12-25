import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { QrCode, Smartphone, Camera } from 'lucide-react';
import { isPWA } from './Install';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { QRScanner } from '@/components/QRScanner';

export default function ScanTable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useStore();
  const [showScanner, setShowScanner] = useState(false);

  // Check for table parameter from QR code scan
  const tableFromQR = searchParams.get('table');

  // Handle scan result from in-app scanner
  const handleScanResult = (tableNum: number) => {
    setShowScanner(false);
    if (tableNum >= 1 && tableNum <= settings.tableCount) {
      // Update session with new table
      const sessionKey = 'chiyadani:customerActiveSession';
      const phoneKey = 'chiyadani:customerPhone';
      const savedPhone = localStorage.getItem(phoneKey);
      
      let phone = savedPhone || '';
      let isPhoneEntered = false;
      
      const existingSession = localStorage.getItem(sessionKey);
      if (existingSession) {
        try {
          const session = JSON.parse(existingSession);
          phone = session.phone || savedPhone || '';
          isPhoneEntered = Boolean(session.isPhoneEntered);
        } catch {
          // Ignore parse errors
        }
      }
      
      localStorage.setItem(sessionKey, JSON.stringify({
        table: tableNum,
        phone,
        isPhoneEntered,
        tableTimestamp: Date.now(),
        timestamp: Date.now()
      }));
      
      toast.success(`Switched to Table ${tableNum}`);
      navigate(`/table/${tableNum}`, { replace: true });
    } else {
      toast.error('Invalid table number');
    }
  };

  // Handle QR code scan with table number
  useEffect(() => {
    if (tableFromQR) {
      const tableNum = parseInt(tableFromQR);
      if (tableNum && tableNum >= 1 && tableNum <= settings.tableCount) {
        // Update session with new table (allows table switching via QR)
        const sessionKey = 'chiyadani:customerActiveSession';
        const phoneKey = 'chiyadani:customerPhone';
        const savedPhone = localStorage.getItem(phoneKey);
        
        const existingSession = localStorage.getItem(sessionKey);
        let phone = savedPhone || '';
        let isPhoneEntered = false;
        
        if (existingSession) {
          try {
            const session = JSON.parse(existingSession);
            phone = session.phone || savedPhone || '';
            isPhoneEntered = Boolean(session.isPhoneEntered);
          } catch {
            // Ignore parse errors
          }
        }
        
        // Create/update session with new table
        localStorage.setItem(sessionKey, JSON.stringify({
          table: tableNum,
          phone,
          isPhoneEntered,
          tableTimestamp: Date.now(),
          timestamp: Date.now()
        }));
        
        toast.success(`Switched to Table ${tableNum}`);
        navigate(`/table/${tableNum}`, { replace: true });
        return;
      }
    }
  }, [tableFromQR, settings.tableCount, navigate]);

  // Check for existing session (only if no QR table parameter)
  useEffect(() => {
    if (tableFromQR) return; // Skip if we're processing a QR scan
    
    const sessionKey = 'chiyadani:customerActiveSession';
    const phoneKey = 'chiyadani:customerPhone';
    const existingSession = localStorage.getItem(sessionKey);
    const savedPhone = localStorage.getItem(phoneKey);
    
    if (existingSession) {
      try {
        const session = JSON.parse(existingSession) as { 
          table: number; 
          phone?: string; 
          tableTimestamp?: number;
          timestamp: number 
        };
        
        // Check if table session is still valid (4 hours)
        const tableTimestamp = session.tableTimestamp || session.timestamp;
        const tableAge = Date.now() - tableTimestamp;
        const isTableExpired = tableAge > 4 * 60 * 60 * 1000; // 4 hours
        
        if (!isTableExpired && session.table) {
          // Table session still valid, redirect to table
          navigate(`/table/${session.table}`);
          return;
        }
        
        // Table expired but phone might still be saved
        if (savedPhone) {
          localStorage.setItem(phoneKey, savedPhone);
        }
        
        // Clear expired table session
        localStorage.removeItem(sessionKey);
      } catch {
        localStorage.removeItem(sessionKey);
      }
    }
  }, [navigate, tableFromQR]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col items-center justify-center p-6 text-white">
      {/* Logo */}
      <div className="mb-8 text-center">
        {settings.logo ? (
          <img 
            src={settings.logo} 
            alt={settings.restaurantName} 
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-2xl"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-4xl">🍵</span>
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{settings.restaurantName}</h1>
        <p className="text-gray-400 mt-1">Digital Menu</p>
      </div>

      {/* Main Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-sm w-full text-center border border-white/10">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
          <QrCode className="w-12 h-12 text-amber-400" />
        </div>
        
        <h2 className="text-xl font-semibold mb-2">Scan Table QR Code</h2>
        <p className="text-gray-400 text-sm mb-6">
          {isPWA() 
            ? "Use your camera to scan the QR code on your table."
            : "Please scan the QR code on your table to start ordering delicious food and drinks."
          }
        </p>

        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
          <Smartphone className="w-4 h-4" />
          <span>Use your camera app to scan</span>
        </div>
      </div>

      {/* Scan QR Button for PWA */}
      {isPWA() && (
        <Button
          onClick={() => setShowScanner(true)}
          className="mt-6 bg-amber-500 hover:bg-amber-600 text-black font-medium"
        >
          <Camera className="w-4 h-4 mr-2" />
          Scan QR Code
        </Button>
      )}

      {/* PWA status indicator */}
      {isPWA() && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>App Mode</span>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
