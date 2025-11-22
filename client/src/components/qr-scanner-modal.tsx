import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { X, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (itemId: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = (result: any) => {
    if (!result || !result[0]?.rawValue) return;

    try {
      const data = JSON.parse(result[0].rawValue);

      if (data.type === "item" && data.id) {
        toast({
          title: "QR Code Scanned",
          description: `Found item: ${data.name}`,
        });

        setIsScanning(false);

        if (onScanSuccess) {
          onScanSuccess(data.id);
        } else {
          // Navigate to search with item ID
          window.location.href = `/search?id=${data.id}`;
        }

        onClose();
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not for an item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read QR code data",
        variant: "destructive",
      });
    }
  };

  const handleError = (error: any) => {
    console.error("QR Scanner error:", error);
    toast({
      title: "Scanner Error",
      description: "Failed to access camera. Please check permissions.",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border border-card-border shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 w-5 h-5" />
            Scan QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "1/1" }}>
            {isScanning && (
              <Scanner
                onScan={handleScan}
                onError={handleError}
                constraints={{
                  facingMode: "environment",
                }}
                styles={{
                  container: {
                    width: "100%",
                    height: "100%",
                  },
                }}
              />
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Position the QR code within the camera frame
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
