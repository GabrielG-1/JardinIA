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
  const onScanRef = useRef(onScan);
  // Points to the current effect run's cancel function, used by handleCancel
  const stopFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const handleCancel = () => {
    stopFnRef.current?.();
    setActive(false);
  };

  useEffect(() => {
    if (!active) return;

    // Local closure vars — each effect run gets its own, so Strict Mode
    // double-invocation cannot cause the cleanup of run 1 to kill run 2.
    let cancelled = false;
    let isRunning = false;
    const scannerInstance = new Html5Qrcode(CONTAINER_ID, {
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

    const stop = () => {
      if (cancelled) return;
      cancelled = true;
      stopFnRef.current = null;
      if (isRunning) {
        isRunning = false;
        scannerInstance.stop().catch(() => {}).finally(() => scannerInstance.clear());
      }
      // If not yet running, the .then() handler will clean up on seeing cancelled
    };

    stopFnRef.current = stop;

    scannerInstance
      .start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 300, height: 120 } },
        (decodedText) => {
          if (cancelled) return;
          cancelled = true;
          stopFnRef.current = null;
          isRunning = false;
          scannerInstance.stop().catch(() => {}).finally(() => {
            scannerInstance.clear();
            setActive(false);
            onScanRef.current(decodedText);
          });
        },
        undefined
      )
      .then(() => {
        if (cancelled) {
          // Cleanup ran before start() resolved — stop the scanner now
          scannerInstance.stop().catch(() => {}).finally(() => scannerInstance.clear());
          return;
        }
        isRunning = true;
      })
      .catch((err) => {
        if (!cancelled) {
          setError("No se pudo acceder a la cámara. Verifica los permisos.");
          console.error("[BarcodeCameraScanner]", err);
          setActive(false);
        }
      });

    return () => {
      stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

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
