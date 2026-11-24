import React, { useEffect, useRef, useState } from 'react';
import { Camera, Download, RefreshCw, Video, VideoOff } from 'lucide-react';
import type { CameraCapture, LiveSensorsSnapshot } from '../types/sensor';
import { formatIso8601WithOffset } from '../utils/isoDate';

interface CameraPanelProps {
  userEmail: string;
  snapshot: LiveSensorsSnapshot;
  onCaptureSaved: (capture: CameraCapture) => Promise<void>;
  onAvailabilityChange?: (available: boolean) => void;
  compact?: boolean;
}

export function CameraPanel({
  userEmail,
  snapshot,
  onCaptureSaved,
  onAvailabilityChange,
  compact = false,
}: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraSupported, setCameraSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCapture, setLastCapture] = useState<CameraCapture | null>(null);
  const [resolutionText, setResolutionText] = useState<string | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setResolutionText(null);
  };

  useEffect(() => {
    let cancelled = false;
    async function checkCameraHardware() {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        if (!cancelled) {
          setCameraSupported(false);
          onAvailabilityChange?.(false);
        }
        return;
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some((d) => d.kind === 'videoinput');
        // Note: on some browsers enumerateDevices returns empty labels/types before permission,
        // so only mark unavailable when devices list is populated and zero videoinputs exist.
        if (devices.length > 0 && !hasVideoInput) {
          if (!cancelled) {
            setCameraSupported(false);
            onAvailabilityChange?.(false);
          }
        } else if (!cancelled) {
          setCameraSupported(true);
          onAvailabilityChange?.(true);
        }
      } catch {
        if (!cancelled) {
          setCameraSupported(true);
          onAvailabilityChange?.(true);
        }
      }
    }
    void checkCameraHardware();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setErrorMessage(null);
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setCameraSupported(false);
      onAvailabilityChange?.(false);
      setErrorMessage('Camera not available on this device');
      return;
    }

    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraSupported(true);
      onAvailabilityChange?.(true);
      setIsActive(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      });

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings();
      if (settings?.width && settings?.height) {
        setResolutionText(`${settings.width}×${settings.height}`);
      }
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraSupported(false);
        onAvailabilityChange?.(false);
        setErrorMessage('Camera not available on this device');
      } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission denied. Allow camera access in your browser settings.');
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to start camera feed.');
      }
      setIsActive(false);
    }
  };

  const handleFlipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (isActive) {
      await startCamera(next);
    }
  };

  const handleCaptureSnapshot = async () => {
    const video = videoRef.current;
    if (!video || !isActive || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const capture: CameraCapture = {
      dataUrl,
      timestamp: formatIso8601WithOffset(new Date()),
      userEmail,
      facingMode,
      width: canvas.width,
      height: canvas.height,
      latitude: snapshot.gps.latitude,
      longitude: snapshot.gps.longitude,
      lightLux: snapshot.ambientLight.lux,
      stepCount: snapshot.steps.todaySteps,
    };
    setLastCapture(capture);
    await onCaptureSaved(capture);
  };

  const handleDownloadLast = () => {
    if (!lastCapture) return;
    const a = document.createElement('a');
    a.href = lastCapture.dataUrl;
    a.download = `sensor_snapshot_${lastCapture.timestamp.replace(/[:+]/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Camera Sensor
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
            {isActive
              ? `${facingMode === 'environment' ? 'Rear' : 'Front'} Lens${resolutionText ? ` · ${resolutionText}` : ''}`
              : cameraSupported
                ? 'Standby · Telemetry-tagged JPEG capture'
                : 'Unavailable'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <button
              type="button"
              onClick={() => void handleFlipCamera()}
              title="Switch Front / Rear Camera"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => (isActive ? stopCamera() : void startCamera())}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isActive ? (
              <>
                <VideoOff className="w-3.5 h-3.5" />
                Stop Camera
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                Start Camera
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {!cameraSupported && !errorMessage && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sensor not available on this device
        </p>
      )}

      {isActive && (
        <div className="space-y-3">
          <div
            className={`relative rounded-lg overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 ${
              compact ? 'aspect-video' : 'aspect-[16/10] max-h-80 w-full'
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCaptureSnapshot()}
              className="min-h-[42px] px-4 py-2 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Capture Tagged Snapshot
            </button>

            {lastCapture && (
              <button
                type="button"
                onClick={handleDownloadLast}
                className="min-h-[42px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Last JPG
              </button>
            )}
          </div>
        </div>
      )}

      {lastCapture && (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <img
            src={lastCapture.dataUrl}
            alt="Latest captured camera snapshot"
            className="w-16 h-12 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div className="min-w-0 text-xs">
            <div className="font-mono truncate">{lastCapture.timestamp}</div>
            <div className="text-slate-500 dark:text-slate-400 font-mono">
              {lastCapture.width}×{lastCapture.height} · Steps {lastCapture.stepCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
