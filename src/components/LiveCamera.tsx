"use client";
// Live in-app camera for AI scans: a real viewfinder (getUserMedia) with the scan frame, a laser sweep
// and a shutter. Camera only: no gallery, so old photos can't be reused. The frame is grabbed to a
// canvas in the browser; nothing is stored. If the browser can't open a live camera (no permission,
// old browser, http), the parent falls back to the phone's own camera app.

import { useCallback, useEffect, useRef, useState } from "react";
import { CloseIcon, SwapIcon } from "@/components/icons";

type Props = {
  onCapture: (photo: Blob) => void;
  onCancel: () => void;
  /** Called when a live camera can't be opened; the message says why in plain words. */
  onUnavailable: (message: string) => void;
};

export function liveCameraSupported() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && window.isSecureContext;
}

export default function LiveCamera({ onCapture, onCancel, onUnavailable }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);
  const [canFlip, setCanFlip] = useState(false);
  const [flash, setFlash] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false); // eslint-disable-line react-hooks/set-state-in-effect -- restarting the stream
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then(async (stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        stop();
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
        if (!cancelled) setCanFlip(cams.length > 1);
      })
      .catch((e: DOMException) => {
        if (cancelled) return;
        onUnavailable(
          e.name === "NotAllowedError"
            ? "Camera permission is off. Allow the camera for this site in your browser settings, or use your phone's camera below."
            : e.name === "NotFoundError" || e.name === "OverconstrainedError"
              ? "We couldn't find a camera on this device."
              : "Couldn't open the camera. Try again, or use your phone's camera below.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [facing, onUnavailable, stop]);

  // Always release the camera when leaving the screen.
  useEffect(() => stop, [stop]);

  function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    // Square crop from the centre, matching the frame the student sees.
    const side = Math.min(v.videoWidth, v.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      ctx.translate(side, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, side, side);
    setFlash(true);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        onCapture(blob);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-[2rem] bg-ink shadow-xl motion-safe:animate-pop" style={{ ["--sweep-distance" as string]: "28rem" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onLoadedData={() => setReady(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"} ${facing === "user" ? "-scale-x-100" : ""}`}
          aria-label="Live camera view"
        />
        {!ready && (
          <p className="absolute inset-0 grid place-items-center text-sm font-bold text-on-ink-muted" role="status">
            Opening camera…
          </p>
        )}
        {/* Scan frame: corner brackets, a soft vignette and the laser sweep. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.55)]" />
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden preserveAspectRatio="none">
          <g fill="none" strokeWidth="2.6" strokeLinecap="round" style={{ stroke: "var(--color-gold)" }} className="motion-safe:animate-glint">
            <path d="M7 22V7h15M78 7h15v15M93 78v15H78M22 93H7V78" />
          </g>
        </svg>
        {ready && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-0 h-1 rounded-full bg-leaf shadow-[0_0_18px_5px_var(--color-leaf)] motion-safe:animate-sweep motion-reduce:hidden"
          />
        )}
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-sm font-bold text-white drop-shadow">
          Fit your whole plate in the frame
        </p>
        {flash && <div aria-hidden className="absolute inset-0 bg-white motion-safe:animate-[blink_0.35s_ease-out_1]" />}
      </div>

      <div className="flex w-full max-w-md items-center justify-between px-2">
        <button
          type="button"
          onClick={() => {
            stop();
            onCancel();
          }}
          aria-label="Close camera"
          className="grid size-14 place-items-center rounded-full bg-mist text-ink transition-transform active:scale-90"
        >
          <CloseIcon size={24} />
        </button>

        <button
          type="button"
          onClick={shoot}
          disabled={!ready}
          aria-label="Take the photo"
          className="group relative grid size-20 place-items-center rounded-full bg-paper shadow-lg ring-4 ring-leaf transition-transform active:scale-90 disabled:opacity-50"
        >
          <span className="absolute inset-0 rounded-full ring-4 ring-leaf/40 motion-safe:animate-ping motion-reduce:hidden" aria-hidden />
          <span className="size-14 rounded-full bg-leaf transition-colors group-active:bg-leaf-dark" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          disabled={!canFlip}
          aria-label="Switch camera"
          className="grid size-14 place-items-center rounded-full bg-mist text-ink transition-transform active:scale-90 disabled:invisible"
        >
          <SwapIcon size={24} />
        </button>
      </div>
    </div>
  );
}
