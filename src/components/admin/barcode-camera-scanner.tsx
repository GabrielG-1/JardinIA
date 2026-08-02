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
  const isRunningRef = useRef(false);
  const onScanRef = useRef(onScan);
  const handledRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const safeStop = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !isRunningRef.current) return;
    isRunningRef.current = false;
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

    handledRef.current = false;

    const scanner = new Html5Qrcode(CONTAINER_ID, {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 300, height: 120 } },
        (decodedText) => {
          if (handledRef.current) return;
          handledRef.current = true;
          isRunningRef.current = false;
          scanner.stop().catch(() => {}).finally(() => {
            scanner.clear();
            scannerRef.current = null;
            setActive(false);
            onScanRef.current(decodedText);
          });
        },
        undefined
      )
      .then(() => {
        isRunningRef.current = true;
      })
      .catch((err) => {
        setError("No se pudo acceder a la cámara. Verifica los permisos.");
        console.error("[BarcodeCameraScanner]", err);
        scannerRef.current = null;
        setActive(false);
      });

    return () => {
      if (isRunningRef.current) {
        safeStop();
      } else {
        setTimeout(() => safeStop(), 300);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleCancel = async () => {
    await safeStop();
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
