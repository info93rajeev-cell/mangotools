import { useEffect, useRef, useState } from 'preact/hooks';
import styles from './passportCameraModal.module.css';

export interface PassportCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

function BiometricCameraGuide() {
  return (
    <div class={styles.guideOverlay}>
      <span class={styles.guidePill}>Align face inside the oval</span>
      <svg
        class={styles.guideSvg}
        viewBox="0 0 300 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <ellipse
          cx="150"
          cy="185"
          rx="95"
          ry="130"
          stroke="#facc15"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        <line
          x1="60"
          y1="65"
          x2="240"
          y2="65"
          stroke="#eab308"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x="150" y="58" fill="#eab308" fontSize="10" textAnchor="middle" fontWeight="700">
          CROWN / HAIRLINE
        </text>

        <line
          x1="45"
          y1="165"
          x2="255"
          y2="165"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x="150" y="158" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="700">
          EYE LEVEL
        </text>

        <line
          x1="75"
          y1="310"
          x2="225"
          y2="310"
          stroke="#f87171"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x="150" y="325" fill="#f87171" fontSize="10" textAnchor="middle" fontWeight="700">
          CHIN BASE
        </text>
      </svg>
      <span class={styles.guidePill}>Look directly into the camera</span>
    </div>
  );
}

async function requestCameraStream(facingMode: 'user' | 'environment'): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera API not available in this browser environment.');
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 1280 },
    },
    audio: false,
  });
}

function stopAllTracks(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

interface CameraControlsProps {
  hasCaptured: boolean;
  onRetake: () => void;
  onUsePhoto: () => void;
  onFlip: () => void;
  onSnap: () => void;
}

function CameraControlsBar({
  hasCaptured,
  onRetake,
  onUsePhoto,
  onFlip,
  onSnap,
}: CameraControlsProps) {
  if (hasCaptured) {
    return (
      <div class={styles.controlsBar}>
        <button type="button" class={styles.secondaryBtn} onClick={onRetake}>
          <span>↺ Retake</span>
        </button>
        <button type="button" class={styles.snapBtn} onClick={onUsePhoto}>
          <span>✓ Use Photo for Passport</span>
        </button>
      </div>
    );
  }

  return (
    <div class={styles.controlsBar}>
      <button
        type="button"
        class={styles.secondaryBtn}
        onClick={onFlip}
        title="Switch between front and back camera"
      >
        <span>🔄 Flip</span>
      </button>
      <button type="button" class={styles.snapBtn} onClick={onSnap}>
        <span>📸 Take Photo</span>
      </button>
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Camera modal dialog
export function PassportCameraModal({ isOpen, onClose, onCapture }: PassportCameraModalProps) {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopAllTracks(stream);
      setStream(null);
      setCapturedDataUrl(null);
      setCapturedBlob(null);
      setCameraError(null);
      return;
    }

    let active = true;
    requestCameraStream(facingMode)
      .then((mediaStream) => {
        if (!active) {
          stopAllTracks(mediaStream);
          return;
        }
        setCameraError(null);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Unable to access camera.';
          setCameraError(msg);
        }
      });

    return () => {
      active = false;
      stopAllTracks(stream);
    };
  }, [isOpen, facingMode]);

  useEffect(() => {
    if (videoRef.current && stream && !capturedDataUrl) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, capturedDataUrl]);

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 960;
    const h = video.videoHeight || 1280;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedDataUrl(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.95,
    );
  };

  const handleRetake = () => {
    if (capturedDataUrl) URL.revokeObjectURL(capturedDataUrl);
    setCapturedDataUrl(null);
    setCapturedBlob(null);
  };

  const handleUsePhoto = () => {
    if (capturedBlob) {
      try {
        const downloadUrl = URL.createObjectURL(capturedBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `passport-selfie-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
      } catch {
        // Ignored
      }

      const file = new File([capturedBlob], 'passport-selfie.jpg', { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      class={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Passport Camera Capture"
    >
      <div class={styles.modalCard}>
        <div class={styles.modalHeader}>
          <div class={styles.headerTitle}>
            <span>📷</span>
            <span>{facingMode === 'user' ? 'Front Camera Selfie' : 'Camera Capture'}</span>
          </div>
          <button type="button" class={styles.closeBtn} onClick={onClose} aria-label="Close camera">
            ✕
          </button>
        </div>

        <div class={styles.cameraViewport}>
          {cameraError ? (
            <div class={styles.errorBox}>
              <span>⚠️ {cameraError}</span>
              <p>You can use your device's native camera app instead:</p>
              <button
                type="button"
                class={styles.snapBtn}
                onClick={() => fallbackFileInputRef.current?.click()}
              >
                📱 Open Native Device Camera
              </button>
              <input
                ref={fallbackFileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) {
                    onCapture(f);
                    onClose();
                  }
                }}
              />
            </div>
          ) : capturedDataUrl ? (
            <img src={capturedDataUrl} alt="Captured portrait" class={styles.capturedPreview} />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                class={facingMode === 'user' ? styles.videoElementMirrored : styles.videoElement}
              />
              <BiometricCameraGuide />
            </>
          )}
        </div>

        {!cameraError && (
          <CameraControlsBar
            hasCaptured={!!capturedDataUrl}
            onRetake={handleRetake}
            onUsePhoto={handleUsePhoto}
            onFlip={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            onSnap={handleSnap}
          />
        )}
      </div>
    </div>
  );
}
