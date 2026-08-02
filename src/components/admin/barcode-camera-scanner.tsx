"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X } from "lucide-react";

interface BarcodeCameraScannerProps {
  onScan: (code: string) => void;
}

const CONTAINER_ID = "barcode-scanner-container";

export function BarcodeCameraScanner({ onScan }: BarcodeCameraScannerProps) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    scannerRef.current = null;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!active) return;

    let done = false;
    const scanner = new Html5Qrcode(CONTAINER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 300, height: 120 },
          // formatsToSupport no está en los tipos pero sí funciona en runtime
          ...({ formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ] } as any),
        },
        (decodedText) => {
          if (done) return;
          done = true;
          scannerRef.current = null;
          scanner.stop().catch(() => {}).finally(() => {
            scanner.clear();
            setActive(false);
            onScanRef.current(decodedText);
          });
        },
        undefined
      )
      .catch((err) => {
        setError("No se pudo acceder a la cámara. Verifica los permisos.");
        console.error("[BarcodeCameraScanner]", err);
        scannerRef.current = null;
        setActive(false);
      });

    return () => {
      done = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        setTimeout(() => {
          s.stop().catch(() => {}).finally(() => s.clear());
        }, 200);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleCancel = async () => {
    await stopScanner();
    setActive(false);
  };

  return (
    <div>
      {!active ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setError(null); setActive(true); }}
          >
            <Camera className="mr-2 h-4 w-4" />
            Escanear con cámara
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      ) : (
        <Card className="w-full">
          <CardContent className="pt-4 space-y-3">
            <div
              id={CONTAINER_ID}
              className="w-full overflow-hidden rounded-md"
              style={{ minHeight: "300px", background: "#000" }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
