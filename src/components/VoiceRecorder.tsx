import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface RecordedVoice {
  id: string;
  url: string;
  duration: number;
  timestamp: Date;
}

interface VoiceRecorderProps {
  onVoiceReady: (voice: RecordedVoice) => void;
  onClose: () => void;
}

const MAX_DURATION = 660; // 11 минут

export const VoiceRecorder = ({ onVoiceReady, onClose }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    };
  }, [stopStream]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Визуализация волны
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bars: number[] = Array(30).fill(4);
      setWaveform(bars);

      waveTimerRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = Array.from(data).slice(0, 30).map((v) => Math.max(4, Math.round((v / 255) * 36)));
        setWaveform(avg);
      }, 80);

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        if (waveTimerRef.current) clearInterval(waveTimerRef.current);
        setWaveform(Array(30).fill(4));
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          setRecordedUrl(reader.result as string);
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
    } catch {
      setError("Нет доступа к микрофону. Разрешите доступ в браузере.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
    stopStream();
    setIsRecording(false);
  };

  const togglePlay = () => {
    if (!audioRef.current || !recordedUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setPlayProgress(isNaN(pct) ? 0 : pct);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlayProgress(0);
  };

  const handleSend = () => {
    if (!recordedUrl) return;
    onVoiceReady({
      id: crypto.randomUUID(),
      url: recordedUrl,
      duration: elapsed,
      timestamp: new Date(),
    });
    onClose();
  };

  const handleRetake = () => {
    if (audioRef.current) { audioRef.current.pause(); }
    setRecordedUrl(null);
    setIsPreviewing(false);
    setIsPlaying(false);
    setPlayProgress(0);
    setElapsed(0);
    setWaveform(Array(30).fill(4));
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const remaining = MAX_DURATION - elapsed;
  const progress = (elapsed / MAX_DURATION) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#17212b] rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">

        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d1821]">
          <span className="text-white font-semibold text-sm">Голосовое сообщение</span>
          <button onClick={() => { stopStream(); onClose(); }} className="text-[#8096a7] hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Основная область */}
        <div className="px-6 py-8 flex flex-col items-center gap-6">

          {error ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <Icon name="MicOff" size={40} className="text-[#8096a7]" />
              <p className="text-[#8096a7] text-sm">{error}</p>
            </div>
          ) : isPreviewing ? (
            /* Превью записи */
            <div className="w-full">
              {recordedUrl && (
                <audio
                  ref={audioRef}
                  src={recordedUrl}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onEnded={handleAudioEnded}
                />
              )}
              <div className="bg-[#242f3d] rounded-2xl px-4 py-3 flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-[#2AABEE] hover:bg-[#1a9fd8] rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <Icon name={isPlaying ? "Pause" : "Play"} size={18} className="text-white" />
                </button>
                <div className="flex-1">
                  {/* Псевдо-волна (статичная для превью) */}
                  <div className="flex items-center gap-0.5 h-8 mb-1">
                    {Array(30).fill(0).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-colors"
                        style={{
                          height: `${8 + Math.sin(i * 0.7) * 12 + Math.cos(i * 1.3) * 8}px`,
                          backgroundColor: (i / 30) * 100 <= playProgress ? "#2AABEE" : "#3d5166",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8096a7] text-xs font-mono">
                      {audioRef.current ? fmt(Math.floor(audioRef.current.currentTime)) : "0:00"}
                    </span>
                    <span className="text-[#8096a7] text-xs font-mono">{fmt(elapsed)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Запись */
            <div className="w-full flex flex-col items-center gap-4">
              {/* Анимированная волна */}
              <div className="flex items-center gap-0.5 h-10 w-full">
                {waveform.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-75"
                    style={{
                      height: `${h}px`,
                      backgroundColor: isRecording ? "#2AABEE" : "#3d5166",
                    }}
                  />
                ))}
              </div>

              {/* Таймер */}
              <div className="flex items-center gap-3">
                {isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                <span className="text-white text-2xl font-mono font-bold">{fmt(elapsed)}</span>
                {isRecording && <span className="text-[#8096a7] text-sm">−{fmt(remaining)}</span>}
              </div>

              {!isRecording && (
                <p className="text-[#8096a7] text-xs">Нажми для записи · до 11 мин</p>
              )}
            </div>
          )}
        </div>

        {/* Прогресс-бар */}
        {isRecording && (
          <div className="h-0.5 bg-[#242f3d] mx-6 mb-2 rounded-full">
            <div className="h-full bg-[#2AABEE] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Управление */}
        <div className="px-4 pb-5 flex items-center justify-center gap-4">
          {!isPreviewing ? (
            !isRecording ? (
              <Button
                onClick={startRecording}
                disabled={!!error}
                className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg"
              >
                <Icon name="Mic" size={26} />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg"
              >
                <Icon name="Square" size={22} />
              </Button>
            )
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="flex-1 border-[#243447] text-[#8096a7] hover:text-white hover:bg-[#242f3d] bg-transparent rounded-full"
              >
                <Icon name="RotateCcw" size={16} className="mr-2" />
                Перезаписать
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

export default VoiceRecorder;
