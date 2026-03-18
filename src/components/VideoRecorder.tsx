import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface RecordedVideo {
  id: string;
  url: string;
  duration: number;
  timestamp: Date;
}

interface VideoRecorderProps {
  onVideoReady: (video: RecordedVideo) => void;
  onClose: () => void;
}

const MAX_DURATION = 180; // 3 минуты

export const VideoRecorder = ({ onVideoReady, onClose }: VideoRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      } catch {
        setError("Нет доступа к камере или микрофону. Разрешите доступ в браузере.");
      }
    };
    startCamera();
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopStream]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setRecordedUrl(base64);
        setIsPreviewing(true);
      };
      reader.readAsDataURL(blob);
    };
    mr.start(200);
    mediaRecorderRef.current = mr;
    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= MAX_DURATION) stopRecording();
    }, 500);
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSend = () => {
    if (!recordedUrl) return;
    onVideoReady({
      id: crypto.randomUUID(),
      url: recordedUrl,
      duration: elapsed,
      timestamp: new Date(),
    });
    stopStream();
    onClose();
  };

  const handleRetake = () => {
    setRecordedUrl(null);
    setIsPreviewing(false);
    setElapsed(0);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const remaining = MAX_DURATION - elapsed;
  const progress = (elapsed / MAX_DURATION) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#17212b] rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d1821]">
          <span className="text-white font-semibold text-sm">Видеосообщение</span>
          <button onClick={() => { stopStream(); onClose(); }} className="text-[#8096a7] hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Видео */}
        <div className="relative bg-black aspect-video">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
              <Icon name="VideoOff" size={40} className="text-[#8096a7]" />
              <p className="text-[#8096a7] text-sm">{error}</p>
            </div>
          ) : isPreviewing ? (
            <video ref={previewRef} src={recordedUrl ?? ""} controls className="w-full h-full object-cover" />
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          )}

          {/* Индикатор записи */}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs font-mono">{fmt(elapsed)}</span>
            </div>
          )}

          {/* Оставшееся время */}
          {isRecording && (
            <div className="absolute top-3 right-3 bg-black/50 rounded-full px-3 py-1">
              <span className="text-white text-xs font-mono">−{fmt(remaining)}</span>
            </div>
          )}
        </div>

        {/* Прогресс-бар */}
        {isRecording && (
          <div className="h-1 bg-[#242f3d]">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Управление */}
        <div className="px-4 py-4 flex items-center justify-center gap-4">
          {!isPreviewing ? (
            <>
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={!cameraReady || !!error}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-lg"
                >
                  <Icon name="Video" size={22} />
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-lg"
                >
                  <Icon name="Square" size={20} />
                </Button>
              )}
              {!isRecording && cameraReady && !error && (
                <p className="text-[#8096a7] text-xs">Нажми для записи · до 3 мин</p>
              )}
            </>
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="flex-1 border-[#243447] text-[#8096a7] hover:text-white hover:bg-[#242f3d] bg-transparent rounded-full"
              >
                <Icon name="RotateCcw" size={16} className="mr-2" />
                Переснять
              </Button>
              <Button
                onClick={handleSend}
                className="flex-1 bg-[#2AABEE] hover:bg-[#1a9fd8] text-white rounded-full"
              >
                <Icon name="Send" size={16} className="mr-2" />
                Отправить
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecorder;