import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useLocation } from 'wouter';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const [, setLocation] = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-region';

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Initialize scanner
      const scanner = new Html5Qrcode(qrRegionId);
      scannerRef.current = scanner;

      // Request camera permission and start scanning
      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err: any) {
      console.error('Scanner start error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access to scan QR codes.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to start camera. Please try again.');
      }
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Scanner stop error:', err);
      }
    }
    setIsScanning(false);
  };

  const onScanSuccess = (decodedText: string) => {
    setLastScanned(decodedText);

    // Check if it's a Housewhere URL
    try {
      const url = new URL(decodedText);
      const currentOrigin = window.location.origin;

      // Check if it's our app's URL
      if (url.origin === currentOrigin) {
        const path = url.pathname;

        // Navigate to the scanned path
        stopScanning();
        onClose();
        setLocation(path);
      } else {
        setError('QR code is not a valid Housewhere storage area link.');
      }
    } catch (err) {
      setError('Invalid QR code format. Please scan a Housewhere QR code.');
    }
  };

  const onScanFailure = (errorMessage: string) => {
    // Ignore scan failures - they happen continuously while scanning
    // Only show actual errors
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!bg-white !text-gray-900 border-2 border-gray-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="!text-gray-900 text-xl flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Scan QR Code
          </DialogTitle>
          <DialogDescription className="!text-gray-600">
            Point your camera at a storage area QR code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner Region */}
          <div className="relative">
            <div id={qrRegionId} className="w-full rounded-lg overflow-hidden border-2 border-gray-300" />

            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Initializing camera...</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Last Scanned */}
          {lastScanned && (
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <strong>Last scanned:</strong> {lastScanned}
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <strong>How to scan:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Hold your device steady</li>
              <li>Center the QR code in the frame</li>
              <li>Wait for automatic detection</li>
            </ul>
          </div>

          {/* Close Button */}
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            Close Scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
