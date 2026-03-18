import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import VideoRecorder from "@/components/VideoRecorder";
import VoiceRecorder from "@/components/VoiceRecorder";
import CallScreen from "@/components/CallScreen";

// ─── Типы ────────────────────────────────────────────────────────────────────

interface MediaItem {
  id: string;
  url: string;
  duration: number;
  timestamp: Date;
  type: "video" | "voice";
}

interface StoredItem {
  id: string;
  base64: string;
  duration: number;
  timestamp: string;
  type: "video" | "voice";
}

interface ChatMessage {
  id: string;
  text: string;
  outgoing: boolean;
  time: string;
  sender?: string;
}

// ─── Данные чата ─────────────────────────────────────────────────────────────

const DEMO_MESSAGES: ChatMessage[] = [
  { id: "1", text: "Как дела, солнышко? Мы с папой скучаем 💙", outgoing: false, time: "12:42", sender: "Мама" },
  { id: "2", text: "Всё хорошо, мам! Работаю 😊 Скоро приеду!", outgoing: true, time: "12:44" },
  { id: "3", text: "Ждём тебя! Приготовлю твоё любимое 🍝", outgoing: false, time: "12:45", sender: "Мама" },
  { id: "4", text: "Скучаю по домашней еде! Кстати, привет папе!", outgoing: true, time: "12:46" },
  { id: "5", text: "Папа говорит привет и что купил тебе подарок 🎁", outgoing: false, time: "12:47", sender: "Мама" },
  { id: "6", text: "Интересно, что за подарок... Завтра буду к обеду!", outgoing: true, time: "12:49" },
];

const CONTACTS = [
  { name: "Мама", username: "@mama_natasha", msg: "Как дела, солнышко? 💙", time: "12:45", avatar: "М", unread: 2, online: true, color: "from-pink-400 to-rose-500" },
  { name: "Семья 🏠", username: "@family_chat", msg: "Папа: Все едем на дачу!", time: "12:30", avatar: "С", unread: 5, online: false, color: "from-blue-400 to-cyan-500" },
  { name: "Антон", username: "@anton_k", msg: "Встречаемся у фонтана?", time: "11:58", avatar: "А", unread: 0, online: true, color: "from-green-400 to-teal-500" },
  { name: "Катя ❤️", username: "@katya_love", msg: "Уже скучаю...", time: "вчера", avatar: "К", unread: 0, online: true, color: "from-purple-400 to-pink-500" },
  { name: "Друзья", username: "@friends_gang", msg: "Ты: Завтра встречаемся!", time: "вчера", avatar: "Д", unread: 0, online: false, color: "from-yellow-400 to-orange-500" },
];

// ─── localStorage ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "blizko_media";

const loadItems = (): MediaItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const stored: StoredItem[] = JSON.parse(raw);
    return stored.map((s) => ({ id: s.id, url: s.base64, duration: s.duration, timestamp: new Date(s.timestamp), type: s.type }));
  } catch { return []; }
};

const saveItems = (items: MediaItem[]) => {
  const stored: StoredItem[] = items.map((v) => ({ id: v.id, base64: v.url, duration: v.duration, timestamp: v.timestamp.toISOString(), type: v.type }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
};

// ─── Компонент голосового сообщения ──────────────────────────────────────────

const VoiceMessage = ({ item, onDelete }: { item: MediaItem; onDelete: () => void }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  return (
    <div className="flex justify-end group">
      <div className="max-w-xs lg:max-w-sm w-64">
        <div className="bg-[#2b5278] rounded-2xl rounded-br-sm px-3 py-2.5 relative">
          <audio ref={audioRef} src={item.url}
            onTimeUpdate={() => { if (!audioRef.current) return; setCurrentTime(Math.floor(audioRef.current.currentTime)); setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0); }}
            onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }}
          />
          <button onClick={onDelete} className="absolute -top-2 -right-2 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <Icon name="Trash2" size={11} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="w-9 h-9 bg-[#2AABEE] hover:bg-[#1a9fd8] rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
              <Icon name={isPlaying ? "Pause" : "Play"} size={16} className="text-white" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-0.5 h-6 mb-0.5">
                {Array(28).fill(0).map((_, i) => (
                  <div key={i} className="flex-1 rounded-full" style={{ height: `${6 + Math.sin(i * 0.8) * 9 + Math.cos(i * 1.5) * 5}px`, backgroundColor: (i / 28) * 100 <= progress ? "#fff" : "rgba(255,255,255,0.3)" }} />
                ))}
              </div>
              <div className="flex justify-between">
                <span className="text-white/70 text-xs font-mono">{fmt(currentTime)}</span>
                <span className="text-white/70 text-xs font-mono">{fmt(item.duration)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 mt-1 mr-1">
          <span className="text-[#8096a7] text-xs">{item.timestamp.getHours()}:{String(item.timestamp.getMinutes()).padStart(2, "0")}</span>
          <Icon name="CheckCheck" size={14} className="text-[#2AABEE]" />
        </div>
      </div>
    </div>
  );
};

// ─── Главный компонент ────────────────────────────────────────────────────────

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [items, setItems] = useState<MediaItem[]>(() => loadItems());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Звонки
  const [call, setCall] = useState<{ type: "audio" | "video" } | null>(null);

  // Поиск по чату
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = searchQuery.trim().length > 1
    ? DEMO_MESSAGES.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Профиль / @username
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState(() => localStorage.getItem("blizko_username") || "");
  const [usernameInput, setUsernameInput] = useState(username);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("blizko_display") || "Мой аккаунт");
  const [displayInput, setDisplayInput] = useState(displayName);

  const saveProfile = () => {
    const clean = usernameInput.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32);
    setUsername(clean);
    setDisplayName(displayInput || "Мой аккаунт");
    localStorage.setItem("blizko_username", clean);
    localStorage.setItem("blizko_display", displayInput || "Мой аккаунт");
    setProfileOpen(false);
  };

  // Текстовые сообщения
  const [textInput, setTextInput] = useState("");
  const [textMessages, setTextMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendText = () => {
    const t = textInput.trim();
    if (!t) return;
    setTextMessages((prev) => [...prev, { id: crypto.randomUUID(), text: t, outgoing: true, time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}` }]);
    setTextInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  // Отправка фото/видео файлов
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileMessages, setFileMessages] = useState<{ id: string; url: string; name: string; type: string; timestamp: Date }[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFileMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          url: reader.result as string,
          name: file.name,
          type: file.type,
          timestamp: new Date(),
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = "";
  };

  useEffect(() => { saveItems(items); }, [items]);

  const handleVideoReady = (video: { id: string; url: string; duration: number; timestamp: Date }) => {
    setItems((prev) => [...prev, { ...video, type: "video" }]);
  };
  const handleVoiceReady = (voice: { id: string; url: string; duration: number; timestamp: Date }) => {
    setItems((prev) => [...prev, { ...voice, type: "voice" }]);
  };
  const handleDelete = (id: string) => { setItems((prev) => prev.filter((v) => v.id !== id)); setConfirmDeleteId(null); };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#1c2733] text-white overflow-x-hidden">

      {/* ── Навигация ── */}
      <nav className="bg-[#17212b] border-b border-[#0d1821] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#2AABEE] rounded-full flex items-center justify-center">
              <Icon name="MessageCircleHeart" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">Близко</h1>
              <p className="text-xs text-[#8096a7] hidden sm:block">Приватный мессенджер для близких</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {/* APK баннер */}
            <div className="flex items-center gap-2 bg-[#242f3d] border border-[#2AABEE]/30 rounded-full px-3 py-1.5">
              <Icon name="Smartphone" size={14} className="text-[#2AABEE]" />
              <span className="text-[#8096a7] text-xs">APK</span>
              <span className="text-[#2AABEE] text-xs font-medium">Скоро</span>
            </div>
            <Button variant="ghost" className="text-[#8096a7] hover:text-white hover:bg-[#242f3d]">
              <Icon name="Globe" size={16} className="mr-2" />
              Браузер
            </Button>
            <Button className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white px-5 py-2 rounded-full text-sm font-medium">
              Попробовать
            </Button>
          </div>
          <Button variant="ghost" className="sm:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <Icon name="X" size={20} /> : <Icon name="Menu" size={20} />}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-[#0d1821]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-[#242f3d] border border-[#2AABEE]/30 rounded-full px-4 py-2 w-fit">
                <Icon name="Smartphone" size={14} className="text-[#2AABEE]" />
                <span className="text-[#8096a7] text-xs">APK — скоро</span>
              </div>
              <Button className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white px-6 py-2 rounded-full text-sm font-medium">Попробовать</Button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Макет ── */}
      <div className="flex min-h-screen">

        {/* ── Боковая панель чатов ── */}
        <div className={`${mobileSidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-72 bg-[#17212b] flex flex-col border-r border-[#0d1821]`}>
          <div className="p-3 border-b border-[#0d1821] flex items-center justify-between gap-2">
            <div className="flex-1 bg-[#242f3d] rounded-full px-4 py-2 flex items-center gap-2">
              <Icon name="Search" size={14} className="text-[#8096a7]" />
              <span className="text-[#8096a7] text-sm">Поиск чатов</span>
            </div>
            <Button variant="ghost" className="lg:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-1" onClick={() => setMobileSidebarOpen(false)}>
              <Icon name="X" size={16} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {CONTACTS.map((chat, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#242f3d] transition-colors ${i === 0 ? "bg-[#2b5278]" : ""}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 bg-gradient-to-br ${chat.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-base font-semibold">{chat.avatar}</span>
                  </div>
                  {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2AABEE] border-2 border-[#17212b] rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-sm font-medium truncate">{chat.name}</span>
                    <span className="text-[#8096a7] text-xs flex-shrink-0 ml-2">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8096a7] text-xs truncate">{chat.username}</span>
                    {chat.unread > 0 && (
                      <span className="bg-[#2AABEE] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2 font-medium">{chat.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Нижняя панель — мой профиль */}
          <div className="p-3 bg-[#17212b] border-t border-[#0d1821] flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2AABEE] to-[#1a9fd8] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">{displayName.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{displayName}</div>
              <div className="text-[#2AABEE] text-xs truncate">{username ? `@${username}` : "Задать @username"}</div>
            </div>
            <button onClick={() => { setUsernameInput(username); setDisplayInput(displayName); setProfileOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#242f3d] transition-colors">
              <Icon name="Settings" size={16} className="text-[#8096a7]" />
            </button>
          </div>
        </div>

        {/* ── Область чата ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Заголовок чата */}
          <div className="h-14 bg-[#17212b] border-b border-[#0d1821] flex items-center px-4 gap-3">
            <Button variant="ghost" className="lg:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-1 mr-1" onClick={() => setMobileSidebarOpen(true)}>
              <Icon name="Menu" size={20} />
            </Button>
            <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">М</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">Мама</div>
              <div className="text-[#8096a7] text-xs">@mama_natasha · в сети</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCall({ type: "audio" })} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#242f3d] transition-colors" title="Аудиозвонок">
                <Icon name="Phone" size={18} className="text-[#8096a7] hover:text-white" />
              </button>
              <button onClick={() => setCall({ type: "video" })} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#242f3d] transition-colors" title="Видеозвонок">
                <Icon name="Video" size={18} className="text-[#8096a7] hover:text-white" />
              </button>
              <button onClick={() => { setSearchOpen((v) => !v); setSearchQuery(""); }} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${searchOpen ? "bg-[#2AABEE]" : "hover:bg-[#242f3d]"}`} title="Поиск в чате">
                <Icon name="Search" size={18} className={searchOpen ? "text-white" : "text-[#8096a7]"} />
              </button>
            </div>
          </div>

          {/* Панель поиска */}
          {searchOpen && (
            <div className="bg-[#17212b] border-b border-[#0d1821] px-4 py-3">
              <div className="flex items-center gap-2 bg-[#242f3d] rounded-full px-4 py-2">
                <Icon name="Search" size={14} className="text-[#8096a7]" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по сообщениям..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#8096a7]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}><Icon name="X" size={14} className="text-[#8096a7]" /></button>
                )}
              </div>
              {searchQuery.trim().length > 1 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-[#8096a7] text-xs px-2 py-2">Ничего не найдено</p>
                  ) : (
                    searchResults.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2 px-2 py-2 rounded-xl hover:bg-[#242f3d] cursor-pointer">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${msg.outgoing ? "bg-[#2AABEE]" : "bg-gradient-to-br from-pink-400 to-rose-500"}`}>
                          {msg.outgoing ? "Я" : "М"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[#8096a7] text-xs">{msg.time} · {msg.outgoing ? "Вы" : msg.sender}</span>
                          <p className="text-white text-sm truncate">
                            {msg.text.split(new RegExp(`(${searchQuery})`, "gi")).map((part, i) =>
                              part.toLowerCase() === searchQuery.toLowerCase()
                                ? <mark key={i} className="bg-[#2AABEE]/40 text-white rounded px-0.5">{part}</mark>
                                : part
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Сообщения */}
          <div className="flex-1 p-3 sm:p-5 space-y-3 overflow-y-auto" style={{ background: "linear-gradient(135deg, #0d1821 0%, #1c2733 50%, #17212b 100%)" }}>

            <div className="flex justify-center">
              <span className="bg-[#182533] text-[#8096a7] text-xs px-3 py-1 rounded-full">Сегодня</span>
            </div>

            {/* Демо-сообщения */}
            {DEMO_MESSAGES.map((msg) => (
              <div key={msg.id} className={`flex ${msg.outgoing ? "justify-end" : "gap-2 items-end"}`}>
                {!msg.outgoing && (
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">М</span>
                  </div>
                )}
                <div className={`max-w-xs lg:max-w-md ${msg.outgoing ? "" : ""}`}>
                  <div className={`${msg.outgoing ? "bg-[#2b5278] rounded-2xl rounded-br-sm" : "bg-[#182533] rounded-2xl rounded-bl-sm"} px-4 py-2.5`}>
                    <p className="text-white text-sm">{msg.text}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${msg.outgoing ? "justify-end mr-1" : "ml-1"}`}>
                    <span className="text-[#8096a7] text-xs">{msg.time}</span>
                    {msg.outgoing && <Icon name="CheckCheck" size={14} className="text-[#2AABEE]" />}
                  </div>
                </div>
              </div>
            ))}

            {/* Медиасообщения */}
            {items.map((item) =>
              item.type === "voice" ? (
                <VoiceMessage key={item.id} item={item} onDelete={() => setConfirmDeleteId(item.id)} />
              ) : (
                <div key={item.id} className="flex justify-end group">
                  <div className="max-w-xs lg:max-w-sm">
                    <div className="bg-[#2b5278] rounded-2xl rounded-br-sm overflow-hidden relative">
                      <video src={item.url} controls className="w-full max-h-48 object-cover" />
                      <button onClick={() => setConfirmDeleteId(item.id)} className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Icon name="Trash2" size={13} className="text-white" />
                      </button>
                      <div className="px-3 py-1.5 flex items-center gap-1.5">
                        <Icon name="Video" size={12} className="text-[#2AABEE]" />
                        <span className="text-[#8096a7] text-xs">Видео · {fmt(item.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                      <span className="text-[#8096a7] text-xs">{item.timestamp.getHours()}:{String(item.timestamp.getMinutes()).padStart(2, "0")}</span>
                      <Icon name="CheckCheck" size={14} className="text-[#2AABEE]" />
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Текстовые сообщения */}
            {textMessages.map((msg) => (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-[#2b5278] rounded-2xl rounded-br-sm px-4 py-2.5">
                    <p className="text-white text-sm">{msg.text}</p>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                    <span className="text-[#8096a7] text-xs">{msg.time}</span>
                    <Icon name="CheckCheck" size={14} className="text-[#2AABEE]" />
                  </div>
                </div>
              </div>
            ))}

            {/* Файловые сообщения (фото/видео) */}
            {fileMessages.map((fm) => (
              <div key={fm.id} className="flex justify-end group">
                <div className="max-w-xs lg:max-w-sm">
                  <div className="bg-[#2b5278] rounded-2xl rounded-br-sm overflow-hidden">
                    {fm.type.startsWith("image/") ? (
                      <img src={fm.url} alt={fm.name} className="w-full max-h-64 object-cover" />
                    ) : fm.type.startsWith("video/") ? (
                      <video src={fm.url} controls className="w-full max-h-48 object-cover" />
                    ) : (
                      <div className="px-4 py-3 flex items-center gap-2">
                        <Icon name="FileText" size={20} className="text-[#2AABEE]" />
                        <span className="text-white text-xs truncate">{fm.name}</span>
                      </div>
                    )}
                    <div className="px-3 py-1 flex items-center gap-1.5">
                      <Icon name={fm.type.startsWith("image/") ? "Image" : "File"} size={11} className="text-[#2AABEE]" />
                      <span className="text-[#8096a7] text-xs truncate max-w-[160px]">{fm.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                    <span className="text-[#8096a7] text-xs">{fm.timestamp.getHours()}:{String(fm.timestamp.getMinutes()).padStart(2, "0")}</span>
                    <Icon name="CheckCheck" size={14} className="text-[#2AABEE]" />
                  </div>
                </div>
              </div>
            ))}

            <div ref={chatEndRef} />

            {/* Секция "Начало работы" */}
            <div className="bg-[#182533] border border-[#243447] rounded-2xl p-4 sm:p-6 mt-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Icon name="Heart" size={22} className="text-[#2AABEE]" />
                Начни общаться с близкими
              </h2>
              <p className="text-[#8096a7] text-sm mb-5">Без рекламы, без слежки — только вы и ваши близкие</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-5">
                {[
                  { n: "1", title: "Создай аккаунт", desc: "Регистрация за 30 секунд — только номер телефона" },
                  { n: "2", title: "Задай @username", desc: "Короткое имя — легко найти друзей без номера телефона" },
                  { n: "3", title: "Общайся свободно", desc: "Сообщения, фото, голос, видео — всё в одном месте" },
                ].map((s) => (
                  <div key={s.n} className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2AABEE] rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-sm sm:text-base">{s.n}</span>
                    </div>
                    <h3 className="text-white font-medium mb-2 text-sm sm:text-base">{s.title}</h3>
                    <p className="text-[#8096a7] text-xs sm:text-sm">{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm font-medium">
                  <Icon name="Globe" size={16} className="mr-2" />
                  Открыть в браузере
                </Button>
                <Button variant="outline" className="border-[#2AABEE]/50 text-[#8096a7] hover:text-white hover:bg-[#242f3d] px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm font-medium bg-transparent transition-colors flex items-center">
                  <Icon name="Smartphone" size={16} className="mr-2" />
                  APK — скоро
                </Button>
              </div>
            </div>

            {/* Преимущества */}
            <div className="bg-[#182533] border border-[#243447] rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Почему Близко?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {([
                  { icon: "Lock" as const, title: "Сквозное шифрование", desc: "Ваши сообщения читаете только вы" },
                  { icon: "Users" as const, title: "Семейные чаты", desc: "Группы для семьи с удобным управлением" },
                  { icon: "AtSign" as const, title: "Короткие @имена", desc: "Найти друга без номера телефона — легко" },
                  { icon: "Heart" as const, title: "Без рекламы навсегда", desc: "Никаких объявлений и слежки за вами" },
                ] as const).map((f, i) => (
                  <div key={i} className="flex items-start gap-2 sm:gap-3 p-3 rounded-xl hover:bg-[#1c2d3e] transition-colors">
                    <div className="text-[#2AABEE] mt-0.5"><Icon name={f.icon} size={18} /></div>
                    <div>
                      <div className="text-white font-medium text-sm">{f.title}</div>
                      <div className="text-[#8096a7] text-xs sm:text-sm">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Поле ввода */}
          <div className="p-3 bg-[#17212b] border-t border-[#0d1821]">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
            <div className="bg-[#242f3d] rounded-full px-4 py-2 flex items-center gap-2">
              <Icon name="Smile" size={20} className="text-[#8096a7] flex-shrink-0" />
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Написать сообщение..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#8096a7] py-1.5 min-w-0"
              />
              <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2AABEE]/20 transition-colors flex-shrink-0" title="Прикрепить фото/видео">
                <Icon name="Paperclip" size={18} className="text-[#8096a7]" />
              </button>
              <button onClick={() => setShowVideoRecorder(true)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2AABEE]/20 transition-colors flex-shrink-0" title="Записать видео">
                <Icon name="Video" size={18} className="text-[#8096a7]" />
              </button>
              {textInput.trim() ? (
                <button onClick={sendText} className="w-8 h-8 bg-[#2AABEE] hover:bg-[#1a9fd8] rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                  <Icon name="Send" size={16} className="text-white" />
                </button>
              ) : (
                <button onClick={() => setShowVoiceRecorder(true)} className="w-8 h-8 bg-[#2AABEE] hover:bg-[#1a9fd8] rounded-full flex items-center justify-center transition-colors flex-shrink-0" title="Записать голосовое">
                  <Icon name="Mic" size={16} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Боковая панель участников ── */}
        <div className="hidden xl:block w-64 bg-[#17212b] p-4 border-l border-[#0d1821]">
          <h3 className="text-[#8096a7] text-xs font-semibold uppercase tracking-wide mb-3">В сети — 4</h3>
          <div className="space-y-1 mb-6">
            {[
              { name: "Мама", username: "@mama_natasha", avatar: "М", color: "from-pink-400 to-rose-500" },
              { name: "Катя ❤️", username: "@katya_love", avatar: "К", color: "from-purple-400 to-pink-500" },
              { name: "Антон", username: "@anton_k", avatar: "А", color: "from-green-400 to-teal-500" },
              { name: "Семья 🏠", username: "@family_chat", avatar: "С", color: "from-blue-400 to-cyan-500" },
            ].map((user, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#242f3d] cursor-pointer transition-colors">
                <div className={`w-9 h-9 bg-gradient-to-br ${user.color} rounded-full flex items-center justify-center relative`}>
                  <span className="text-white text-sm font-semibold">{user.avatar}</span>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#2AABEE] border-2 border-[#17212b] rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{user.name}</div>
                  <div className="text-[#2AABEE] text-xs truncate">{user.username}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-[#1c2d3e] rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Shield" size={16} className="text-[#2AABEE]" />
              <span className="text-white text-sm font-semibold">Полная приватность</span>
            </div>
            <p className="text-[#8096a7] text-xs leading-relaxed">Все сообщения зашифрованы. Мы не читаем ваши переписки и не передаём данные третьим лицам.</p>
          </div>
        </div>
      </div>

      {/* ── Модалки ── */}

      {/* Диалог удаления */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#17212b] rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-[#243447]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="Trash2" size={18} className="text-red-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Удалить сообщение?</div>
                <div className="text-[#8096a7] text-xs mt-0.5">Это действие нельзя отменить</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setConfirmDeleteId(null)} variant="outline" className="flex-1 border-[#243447] text-[#8096a7] hover:text-white hover:bg-[#242f3d] bg-transparent rounded-full text-sm">Отмена</Button>
              <Button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm">Удалить</Button>
            </div>
          </div>
        </div>
      )}

      {/* Редактор профиля / @username */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#17212b] rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#243447]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Мой профиль</span>
              <button onClick={() => setProfileOpen(false)}><Icon name="X" size={18} className="text-[#8096a7]" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[#8096a7] text-xs mb-1 block">Отображаемое имя</label>
                <input
                  value={displayInput}
                  onChange={(e) => setDisplayInput(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full bg-[#242f3d] text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-transparent focus:border-[#2AABEE] transition-colors"
                />
              </div>
              <div>
                <label className="text-[#8096a7] text-xs mb-1 block">Username</label>
                <div className="flex items-center bg-[#242f3d] rounded-xl px-4 py-2.5 border border-transparent focus-within:border-[#2AABEE] transition-colors">
                  <span className="text-[#2AABEE] text-sm mr-1">@</span>
                  <input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32))}
                    placeholder="username"
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                  />
                </div>
                <p className="text-[#8096a7] text-xs mt-1">Только латинские буквы, цифры и _</p>
              </div>
              <Button onClick={saveProfile} className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white rounded-full mt-1">
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}

      {showVideoRecorder && <VideoRecorder onVideoReady={handleVideoReady} onClose={() => setShowVideoRecorder(false)} />}
      {showVoiceRecorder && <VoiceRecorder onVoiceReady={handleVoiceReady} onClose={() => setShowVoiceRecorder(false)} />}
      {call && (
        <CallScreen
          type={call.type}
          contactName="Мама"
          contactAvatar=""
          contactColor="from-pink-400 to-rose-500"
          onClose={() => setCall(null)}
        />
      )}
    </div>
  );
};

export default Index;