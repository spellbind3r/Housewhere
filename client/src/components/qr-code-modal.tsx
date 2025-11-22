import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
}

export function QRCodeModal({ isOpen, onClose, itemId, itemName }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generateQRCode();
    }
  }, [isOpen, itemId]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    try {
      // Generate QR code with item ID
      const qrData = JSON.stringify({
        type: "item",
        id: itemId,
        name: itemName,
      });

      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Also generate data URL for download
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 600,
        margin: 2,
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${itemName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "QR code downloaded successfully",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border border-card-border shadow-lg">
        <DialogHeader>
          <DialogTitle>QR Code for {itemName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center p-6 bg-white rounded-lg">
            <canvas ref={canvasRef} />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code to quickly access item details
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
