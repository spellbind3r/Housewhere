import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageAreaId: string;
  storageAreaName: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  storageAreaId,
  storageAreaName,
}: QRCodeModalProps) {
  // Generate URL for this storage area
  const storageAreaUrl = `${window.location.origin}/storage-areas/${storageAreaId}/items`;

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${storageAreaName.replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${storageAreaName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
              color: #1f2937;
            }
            .subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 30px;
            }
            svg {
              display: block;
              margin: 0 auto 20px;
            }
            .url {
              font-size: 12px;
              color: #6b7280;
              word-break: break-all;
              max-width: 400px;
              margin: 0 auto;
            }
            @media print {
              @page { margin: 1cm; }
              body { background: white; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${storageAreaName}</h1>
            <p class="subtitle">Scan to view items</p>
            ${document.getElementById('qr-code-svg')?.outerHTML || ''}
            <p class="url">${storageAreaUrl}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!bg-white !text-gray-900 border-2 border-gray-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="!text-gray-900 text-xl">QR Code</DialogTitle>
          <DialogDescription className="!text-gray-600">
            Scan this QR code to quickly access "{storageAreaName}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
            <QRCodeSVG
              id="qr-code-svg"
              value={storageAreaUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Storage Area Name */}
          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-900">
              {storageAreaName}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm break-all">
              {storageAreaUrl}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
