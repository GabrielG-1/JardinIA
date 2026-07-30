"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
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
  const stoppingRef = useRef(false);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      // ignore
    }
    stoppingRef.current = false;
    setActive(false);
  };

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const scanner = new Html5Qrcode(CONTAINER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (cancelled) return;
          cancelled = true;
          scanner.stop().catch(() => {}).finally(() => {
            scanner.clear();
            scannerRef.current = null;
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
      cancelled = true;
      scanner.stop().catch(() => {}).finally(() => {
        scanner.clear();
        scannerRef.current = null;
      });
    };
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
              onClick={stopScanner}
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
