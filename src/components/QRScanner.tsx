import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, SwitchCamera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QRScannerProps {
  onScan: (tableNumber: number) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    setError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Parse QR code URL to extract table number
          // Expected format: /scan?table=X or /table/X
          const tableMatch = decodedText.match(/[?&]table=(\d+)/) || 
                            decodedText.match(/\/table\/(\d+)/);
          
          if (tableMatch) {
            const tableNum = parseInt(tableMatch[1]);
            if (tableNum > 0) {
              // Stop scanner before navigating
              html5QrCode.stop().then(() => {
                onScan(tableNum);
              }).catch(() => {
                onScan(tableNum);
              });
            }
          } else {
            toast.error('Invalid QR code');
          }
        },
        () => {
          // Ignore errors during scanning (no QR detected)
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Unable to access camera. Please grant camera permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    await stopScanner();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, [facingMode]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
        <span className="text-white font-medium">Scan Table QR</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={switchCamera}
          className="text-white hover:bg-white/20"
        >
          <SwitchCamera className="w-6 h-6" />
        </Button>
      </div>

      {/* Scanner container */}
      <div className="flex flex-col items-center justify-center h-full">
        <div 
          id="qr-reader" 
          ref={containerRef}
          className="w-full max-w-sm aspect-square"
        />
        
        {/* Loading state */}
        {isScanning && !error && (
          <div className="absolute bottom-32 flex items-center gap-2 text-white/80">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Point camera at QR code</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6">
            <Camera className="w-16 h-16 text-white/50 mb-4" />
            <p className="text-white text-center mb-4">{error}</p>
            <Button onClick={startScanner} variant="outline" className="text-white border-white">
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Scanning frame overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white/30 rounded-2xl">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
        </div>
      </div>

      {/* Bottom instruction */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-center text-white/70 text-sm">
          Position the QR code within the frame to scan
        </p>
      </div>
    </div>
  );
}
