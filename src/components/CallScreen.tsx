import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface CallScreenProps {
  type: "audio" | "video";
  contactName: string;
  contactAvatar: string;
  contactColor: string;
  onClose: () => void;
}

const STATUSES = ["Подключение...", "Вызов..."];

const CallScreen = ({
  type,
  contactName,
  contactAvatar,
  contactColor,
  onClose,
}: CallScreenProps) => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUSES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#17212b" }}>
      {/* Background */}
      {type === "video" ? (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
          <div className="relative z-10 flex flex-col items-center gap-4 opacity-40">
            <Icon name="VideoOff" size={80} className="text-white/50" />
          </div>
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${contactColor} opacity-90`} />
      )}

      {/* Overlay tint */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center flex-1 pt-20 px-6">
        {/* Avatar */}
        <div
          className={`w-28 h-28 rounded-full bg-gradient-to-br ${contactColor} flex items-center justify-center shadow-2xl ring-4 ring-white/20 mb-6 overflow-hidden`}
        >
          {contactAvatar ? (
            <img
              src={contactAvatar}
              alt={contactName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-4xl font-bold select-none">
              {contactName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name */}
        <h1 className="text-white text-3xl font-semibold tracking-wide mb-2 text-center drop-shadow-lg">
          {contactName}
        </h1>

        {/* Status */}
        <p
          key={statusIndex}
          className="text-white/70 text-base font-medium animate-pulse transition-all duration-500"
        >
          {STATUSES[statusIndex]}
        </p>

        {/* Coming soon banner */}
        <div className="mt-10 w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-4 flex flex-col items-center gap-2 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="text-white font-semibold text-sm">Функция скоро появится</span>
          </div>
          <p className="text-white/70 text-xs text-center leading-relaxed">
            Звонки появятся в ближайшем обновлении. Спасибо за ожидание!
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-6 pb-14 pt-6">
        {/* Mic toggle */}
        <button
          onClick={() => setMicOn((v) => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
          style={{
            background: micOn ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
          }}
          aria-label={micOn ? "Выключить микрофон" : "Включить микрофон"}
        >
          <Icon
            name={micOn ? "Mic" : "MicOff"}
            size={22}
            className={micOn ? "text-white" : "text-red-400"}
          />
        </button>

        {/* End call */}
        <button
          onClick={onClose}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 transition-colors duration-200 shadow-xl"
          aria-label="Завершить звонок"
        >
          <Icon name="PhoneOff" size={26} className="text-white" />
        </button>

        {/* Camera toggle — only for video */}
        {type === "video" ? (
          <button
            onClick={() => setCameraOn((v) => !v)}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
            style={{
              background: cameraOn ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
            aria-label={cameraOn ? "Выключить камеру" : "Включить камеру"}
          >
            <Icon
              name={cameraOn ? "Camera" : "CameraOff"}
              size={22}
              className={cameraOn ? "text-white" : "text-red-400"}
            />
          </button>
        ) : (
          /* Placeholder to keep end-call button centered */
          <div className="w-14 h-14" />
        )}
      </div>
    </div>
  );
};

export default CallScreen;
