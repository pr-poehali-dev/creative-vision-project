import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import VideoRecorder from "@/components/VideoRecorder";
import VoiceRecorder from "@/components/VoiceRecorder";
import CallScreen from "@/components/CallScreen";
import * as api from "@/api";

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
  id: string | number;
  text: string;
  outgoing: boolean;
  time: string;
  sender?: string;
  local?: boolean;
}

interface Chat {
  id: number;
  name: string;
  avatar_letter: string;
  avatar_color: string;
  last_msg: string;
  last_time: string;
}

interface User {
  user_id: number;
  phone: string;
  display_name: string;
  username: string | null;
}

// ─── localStorage для медиа ───────────────────────────────────────────────────

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

// ─── Экран регистрации ────────────────────────────────────────────────────────

const RegisterScreen = ({ onDone }: { onDone: (user: User) => void }) => {
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token.trim() || !phone.trim() || !name.trim()) { setError("Заполните все поля"); return; }
    setLoading(true);
    setError("");
    const res = await api.register(token.trim(), phone.trim(), name.trim());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    api.setSession(res.session_token);
    onDone({ user_id: res.user_id, phone: phone.trim(), display_name: res.display_name, username: null });
  };

  return (
    <div className="min-h-screen bg-[#1c2733] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#2AABEE] rounded-full flex items-center justify-center">
            <Icon name="MessageCircleHeart" size={32} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Близко</h1>
        <p className="text-[#8096a7] text-center text-sm mb-8">Введите инвайт-токен для регистрации</p>

        <div className="bg-[#17212b] rounded-2xl p-5 border border-[#243447] space-y-4">
          <div>
            <label className="text-[#8096a7] text-xs mb-1.5 block">Инвайт-токен</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Вставьте токен..." className="w-full bg-[#242f3d] text-white text-sm rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#2AABEE] transition-colors placeholder-[#8096a7]" />
          </div>
          <div>
            <label className="text-[#8096a7] text-xs mb-1.5 block">Номер телефона</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" type="tel" className="w-full bg-[#242f3d] text-white text-sm rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#2AABEE] transition-colors placeholder-[#8096a7]" />
          </div>
          <div>
            <label className="text-[#8096a7] text-xs mb-1.5 block">Ваше имя</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как вас зовут?" className="w-full bg-[#242f3d] text-white text-sm rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#2AABEE] transition-colors placeholder-[#8096a7]" onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <Button onClick={submit} disabled={loading} className="w-full bg-[#2AABEE] hover:bg-[#1a9fd8] text-white rounded-full py-3 font-medium">
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </Button>
        </div>
        <p className="text-[#8096a7] text-xs text-center mt-4">Токен выдаётся разработчиком</p>
      </div>
    </div>
  );
};

// ─── Главный компонент ────────────────────────────────────────────────────────

const Index = () => {
  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // UI
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Звонки
  const [call, setCall] = useState<{ type: "audio" | "video" } | null>(null);

  // Чаты
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);

  // Сообщения
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Поиск по чату
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Профиль
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayInput, setDisplayInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

  // Создать чат
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatLoading, setNewChatLoading] = useState(false);

  // Встроенный браузер
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserUrl, setBrowserUrl] = useState("https://www.google.com/");
  const [browserInput, setBrowserInput] = useState("https://www.google.com/");

  // Настройки (токены для разработчика)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminPass, setAdminPass] = useState(() => localStorage.getItem("blizko_admin") || "");
  const [adminTokens, setAdminTokens] = useState<{ token: string; used: boolean; created_at: string }[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [copiedToken, setCopiedToken] = useState("");

  // Текстовое сообщение
  const [textInput, setTextInput] = useState("");

  // Медиа (локальные)
  const [items, setItems] = useState<MediaItem[]>(() => loadItems());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileMessages, setFileMessages] = useState<{ id: string; url: string; name: string; type: string; timestamp: Date }[]>([]);

  useEffect(() => { saveItems(items); }, [items]);

  // Авторизация при загрузке
  useEffect(() => {
    api.loginSession().then((res) => {
      if (res && !res.error) setUser(res);
      setAuthLoading(false);
    });
  }, []);

  // Загрузка чатов при входе
  useEffect(() => {
    if (!user) return;
    setChatsLoading(true);
    api.getChats().then((res) => {
      if (res.chats) setChats(res.chats);
      setChatsLoading(false);
    });
  }, [user]);

  // Загрузка сообщений при смене чата
  const loadMessages = useCallback(async (chat: Chat) => {
    setMessagesLoading(true);
    setMessages([]);
    const res = await api.getMessages(chat.id);
    if (res.messages) setMessages(res.messages);
    setMessagesLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  useEffect(() => {
    if (activeChat) loadMessages(activeChat);
  }, [activeChat, loadMessages]);

  // Отправка текстового сообщения
  const sendText = async () => {
    const t = textInput.trim();
    if (!t || !activeChat) return;
    const time = `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}`;
    const tempId = `local_${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, text: t, outgoing: true, time, local: true }]);
    setTextInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    const res = await api.sendMessage(activeChat.id, t);
    if (res.id) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: res.id, time: res.time, local: false } : m));
      setChats((prev) => prev.map((c) => c.id === activeChat.id ? { ...c, last_msg: t, last_time: res.time } : c));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  // Сохранение профиля
  const saveProfile = async () => {
    const clean = usernameInput.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32);
    const res = await api.updateProfile(displayInput, clean);
    if (!res.error && user) {
      setUser({ ...user, display_name: displayInput, username: clean || null });
    }
    setProfileOpen(false);
  };

  // Создать новый чат
  const createChat = async () => {
    if (!newChatName.trim()) return;
    setNewChatLoading(true);
    const colors = ["from-pink-400 to-rose-500", "from-blue-400 to-cyan-500", "from-green-400 to-teal-500", "from-purple-400 to-pink-500", "from-yellow-400 to-orange-500"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const res = await api.createChat(newChatName.trim(), newChatName.trim()[0].toUpperCase(), color);
    setNewChatLoading(false);
    if (res.chat_id) {
      const newChat: Chat = { id: res.chat_id, name: res.name, avatar_letter: res.avatar_letter, avatar_color: res.avatar_color, last_msg: "", last_time: "" };
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
      setNewChatName("");
      setNewChatOpen(false);
    }
  };

  // Медиа
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFileMessages((prev) => [...prev, { id: crypto.randomUUID(), url: reader.result as string, name: file.name, type: file.type, timestamp: new Date() }]);
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = "";
  };

  const handleVideoReady = (video: { id: string; url: string; duration: number; timestamp: Date }) => {
    setItems((prev) => [...prev, { ...video, type: "video" }]);
  };
  const handleVoiceReady = (voice: { id: string; url: string; duration: number; timestamp: Date }) => {
    setItems((prev) => [...prev, { ...voice, type: "voice" }]);
  };
  const handleDelete = (id: string) => { setItems((prev) => prev.filter((v) => v.id !== id)); setConfirmDeleteId(null); };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Загрузка инвайт-токенов (для разработчика)
  const loadAdminTokens = async () => {
    if (!adminPass) { setAdminError("Введите пароль разработчика"); return; }
    setAdminLoading(true);
    setAdminError("");
    localStorage.setItem("blizko_admin", adminPass);
    const res = await api.adminGetTokens(adminPass);
    setAdminLoading(false);
    if (res.error) { setAdminError("Неверный пароль"); return; }
    setAdminTokens(res.tokens || []);
  };

  const generateToken = async () => {
    setAdminLoading(true);
    const res = await api.adminGenerateToken(adminPass);
    setAdminLoading(false);
    if (res.token) {
      setAdminTokens((prev) => [{ token: res.token, used: false, created_at: res.created_at }, ...prev]);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(""), 2000);
  };

  // Браузер — переход по URL
  const navigateBrowser = () => {
    let url = browserInput.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    setBrowserUrl(url);
    setBrowserInput(url);
  };

  const searchResults = searchQuery.trim().length > 1
    ? messages.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1c2733] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#2AABEE] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icon name="MessageCircleHeart" size={24} className="text-white" />
          </div>
          <p className="text-[#8096a7] text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <RegisterScreen onDone={(u) => setUser(u)} />;
  }

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
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" onClick={() => setBrowserOpen(true)} className="text-[#8096a7] hover:text-white hover:bg-[#242f3d]">
              <Icon name="Globe" size={16} className="mr-2" />
              Браузер
            </Button>
            <Button variant="ghost" onClick={() => { setDisplayInput(user.display_name); setUsernameInput(user.username || ""); setSettingsOpen(true); }} className="text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-2">
              <Icon name="Settings" size={18} />
            </Button>
            <Button variant="ghost" onClick={() => { api.clearSession(); setUser(null); }} className="text-[#8096a7] hover:text-red-400 hover:bg-[#242f3d] p-2" title="Выйти">
              <Icon name="LogOut" size={18} />
            </Button>
          </div>
          <Button variant="ghost" className="sm:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <Icon name="X" size={20} /> : <Icon name="Menu" size={20} />}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-[#0d1821] flex flex-col gap-2">
            <Button variant="ghost" onClick={() => { setBrowserOpen(true); setMobileMenuOpen(false); }} className="justify-start text-[#8096a7] hover:text-white hover:bg-[#242f3d]">
              <Icon name="Globe" size={16} className="mr-2" /> Браузер
            </Button>
            <Button variant="ghost" onClick={() => { setDisplayInput(user.display_name); setUsernameInput(user.username || ""); setSettingsOpen(true); setMobileMenuOpen(false); }} className="justify-start text-[#8096a7] hover:text-white hover:bg-[#242f3d]">
              <Icon name="Settings" size={16} className="mr-2" /> Настройки
            </Button>
            <Button variant="ghost" onClick={() => { api.clearSession(); setUser(null); }} className="justify-start text-red-400 hover:bg-[#242f3d]">
              <Icon name="LogOut" size={16} className="mr-2" /> Выйти
            </Button>
          </div>
        )}
      </nav>

      {/* ── Макет ── */}
      <div className="flex" style={{ height: "calc(100vh - 73px)" }}>

        {/* ── Боковая панель чатов ── */}
        <div className={`${mobileSidebarOpen ? "fixed inset-0 z-40" : "hidden"} lg:relative lg:flex lg:flex-col w-full lg:w-72 bg-[#17212b] border-r border-[#0d1821] flex-shrink-0`}>
          {/* Поиск + кнопка нового чата */}
          <div className="p-3 border-b border-[#0d1821] flex items-center gap-2">
            <div className="flex-1 bg-[#242f3d] rounded-full px-4 py-2 flex items-center gap-2">
              <Icon name="Search" size={14} className="text-[#8096a7]" />
              <span className="text-[#8096a7] text-sm">Поиск чатов</span>
            </div>
            <button onClick={() => setNewChatOpen(true)} className="w-8 h-8 bg-[#2AABEE] hover:bg-[#1a9fd8] rounded-full flex items-center justify-center flex-shrink-0 transition-colors" title="Новый чат">
              <Icon name="Plus" size={16} className="text-white" />
            </button>
            <Button variant="ghost" className="lg:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-1" onClick={() => setMobileSidebarOpen(false)}>
              <Icon name="X" size={16} />
            </Button>
          </div>

          {/* Список чатов */}
          <div className="flex-1 overflow-y-auto">
            {chatsLoading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-[#8096a7] text-sm">Загрузка...</p>
              </div>
            )}
            {!chatsLoading && chats.length === 0 && (
              <div className="p-4 text-center">
                <Icon name="MessageCirclePlus" size={32} className="text-[#8096a7] mx-auto mb-2" />
                <p className="text-[#8096a7] text-sm">Нет чатов</p>
                <p className="text-[#8096a7] text-xs mt-1">Нажмите + чтобы создать</p>
              </div>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => { setActiveChat(chat); setMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#242f3d] transition-colors ${activeChat?.id === chat.id ? "bg-[#2b5278]" : ""}`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 bg-gradient-to-br ${chat.avatar_color} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-base font-semibold">{chat.avatar_letter}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-sm font-medium truncate">{chat.name}</span>
                    <span className="text-[#8096a7] text-xs flex-shrink-0 ml-2">{chat.last_time}</span>
                  </div>
                  <span className="text-[#8096a7] text-xs truncate block">{chat.last_msg || "Нет сообщений"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Мой профиль */}
          <div className="p-3 bg-[#17212b] border-t border-[#0d1821] flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2AABEE] to-[#1a9fd8] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">{user.display_name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user.display_name}</div>
              <div className="text-[#2AABEE] text-xs truncate">{user.username ? `@${user.username}` : user.phone}</div>
            </div>
            <button onClick={() => { setDisplayInput(user.display_name); setUsernameInput(user.username || ""); setProfileOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#242f3d] transition-colors">
              <Icon name="UserCog" size={16} className="text-[#8096a7]" />
            </button>
          </div>
        </div>

        {/* ── Область чата ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Заголовок чата */}
          <div className="h-14 bg-[#17212b] border-b border-[#0d1821] flex items-center px-4 gap-3 flex-shrink-0">
            <Button variant="ghost" className="lg:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-1 mr-1" onClick={() => setMobileSidebarOpen(true)}>
              <Icon name="Menu" size={20} />
            </Button>
            {activeChat ? (
              <>
                <div className={`w-9 h-9 bg-gradient-to-br ${activeChat.avatar_color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm font-semibold">{activeChat.avatar_letter}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm">{activeChat.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCall({ type: "audio" })} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#242f3d] transition-colors">
                    <Icon name="Phone" size={18} className="text-[#8096a7] hover:text-white" />
                  </button>
                  <button onClick={() => setCall({ type: "video" })} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#242f3d] transition-colors">
                    <Icon name="Video" size={18} className="text-[#8096a7] hover:text-white" />
                  </button>
                  <button onClick={() => { setSearchOpen((v) => !v); setSearchQuery(""); }} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${searchOpen ? "bg-[#2AABEE]" : "hover:bg-[#242f3d]"}`}>
                    <Icon name="Search" size={18} className={searchOpen ? "text-white" : "text-[#8096a7]"} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#8096a7] text-sm">Выберите чат</p>
              </div>
            )}
          </div>

          {/* Панель поиска */}
          {searchOpen && activeChat && (
            <div className="bg-[#17212b] border-b border-[#0d1821] px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-[#242f3d] rounded-full px-4 py-2">
                <Icon name="Search" size={14} className="text-[#8096a7]" />
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по сообщениям..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#8096a7]" />
                {searchQuery && <button onClick={() => setSearchQuery("")}><Icon name="X" size={14} className="text-[#8096a7]" /></button>}
              </div>
              {searchQuery.trim().length > 1 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-[#8096a7] text-xs px-2 py-2">Ничего не найдено</p>
                  ) : (
                    searchResults.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2 px-2 py-2 rounded-xl hover:bg-[#242f3d] cursor-pointer">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${msg.outgoing ? "bg-[#2AABEE]" : "bg-gradient-to-br from-pink-400 to-rose-500"}`}>
                          {msg.outgoing ? "Я" : (msg.sender?.charAt(0) || "?")}
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
            {!activeChat && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-[#182533] rounded-full flex items-center justify-center mb-4">
                  <Icon name="MessageCircleHeart" size={28} className="text-[#2AABEE]" />
                </div>
                <h2 className="text-white font-semibold text-lg mb-2">Выберите чат</h2>
                <p className="text-[#8096a7] text-sm">или создайте новый, нажав +</p>
              </div>
            )}

            {activeChat && messagesLoading && (
              <div className="flex justify-center py-8">
                <p className="text-[#8096a7] text-sm">Загрузка сообщений...</p>
              </div>
            )}

            {activeChat && !messagesLoading && (
              <>
                <div className="flex justify-center">
                  <span className="bg-[#182533] text-[#8096a7] text-xs px-3 py-1 rounded-full">Сегодня</span>
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.outgoing ? "justify-end" : "gap-2 items-end"}`}>
                    {!msg.outgoing && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{msg.sender?.charAt(0) || "?"}</span>
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md`}>
                      {!msg.outgoing && <div className="text-[#2AABEE] text-xs mb-0.5 ml-1">{msg.sender}</div>}
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

                {/* Файловые сообщения */}
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
              </>
            )}
          </div>

          {/* Поле ввода */}
          {activeChat && (
            <div className="p-3 bg-[#17212b] border-t border-[#0d1821] flex-shrink-0">
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
              <div className="bg-[#242f3d] rounded-full px-4 py-2 flex items-center gap-2">
                <Icon name="Smile" size={20} className="text-[#8096a7] flex-shrink-0" />
                <input value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Написать сообщение..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#8096a7] py-1.5 min-w-0" />
                <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2AABEE]/20 transition-colors flex-shrink-0">
                  <Icon name="Paperclip" size={18} className="text-[#8096a7]" />
                </button>
                <button onClick={() => setShowVideoRecorder(true)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2AABEE]/20 transition-colors flex-shrink-0">
                  <Icon name="Video" size={18} className="text-[#8096a7]" />
                </button>
                {textInput.trim() ? (
                  <button onClick={sendText} className="w-8 h-8 bg-[#2AABEE] hover:bg-[#1a9fd8] rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                    <Icon name="Send" size={16} className="text-white" />
                  </button>
                ) : (
                  <button onClick={() => setShowVoiceRecorder(true)} className="w-8 h-8 bg-[#2AABEE] hover:bg-[#1a9fd8] rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                    <Icon name="Mic" size={16} className="text-white" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Встроенный браузер ── */}
      {browserOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#17212b]">
          <div className="flex items-center gap-2 p-3 border-b border-[#0d1821] flex-shrink-0">
            <button onClick={() => setBrowserOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#242f3d] transition-colors">
              <Icon name="X" size={18} className="text-[#8096a7]" />
            </button>
            <div className="flex-1 flex items-center bg-[#242f3d] rounded-full px-4 py-2 gap-2">
              <Icon name="Globe" size={14} className="text-[#8096a7] flex-shrink-0" />
              <input
                value={browserInput}
                onChange={(e) => setBrowserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigateBrowser()}
                placeholder="Введите адрес..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#8096a7]"
              />
            </div>
            <button onClick={navigateBrowser} className="w-8 h-8 bg-[#2AABEE] hover:bg-[#1a9fd8] rounded-full flex items-center justify-center transition-colors flex-shrink-0">
              <Icon name="ArrowRight" size={16} className="text-white" />
            </button>
          </div>
          <iframe src={browserUrl} className="flex-1 w-full border-0" title="Браузер" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </div>
      )}

      {/* ── Создать чат ── */}
      {newChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#17212b] rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#243447]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Новый чат</span>
              <button onClick={() => setNewChatOpen(false)}><Icon name="X" size={18} className="text-[#8096a7]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[#8096a7] text-xs mb-1.5 block">Название чата</label>
                <input value={newChatName} onChange={(e) => setNewChatName(e.target.value)} placeholder="Например: Семья, Друзья..." onKeyDown={(e) => e.key === "Enter" && createChat()} className="w-full bg-[#242f3d] text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-transparent focus:border-[#2AABEE] transition-colors placeholder-[#8096a7]" />
              </div>
              <Button onClick={createChat} disabled={newChatLoading || !newChatName.trim()} className="w-full bg-[#2AABEE] hover:bg-[#1a9fd8] text-white rounded-full">
                {newChatLoading ? "Создаётся..." : "Создать чат"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Редактор профиля ── */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#17212b] rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-[#243447]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Мой профиль</span>
              <button onClick={() => setProfileOpen(false)}><Icon name="X" size={18} className="text-[#8096a7]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[#8096a7] text-xs mb-1 block">Отображаемое имя</label>
                <input value={displayInput} onChange={(e) => setDisplayInput(e.target.value)} placeholder="Ваше имя" className="w-full bg-[#242f3d] text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-transparent focus:border-[#2AABEE] transition-colors" />
              </div>
              <div>
                <label className="text-[#8096a7] text-xs mb-1 block">Username</label>
                <div className="flex items-center bg-[#242f3d] rounded-xl px-4 py-2.5 border border-transparent focus-within:border-[#2AABEE] transition-colors">
                  <span className="text-[#2AABEE] text-sm mr-1">@</span>
                  <input value={usernameInput} onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32))} placeholder="username" className="flex-1 bg-transparent text-white text-sm outline-none" />
                </div>
                <p className="text-[#8096a7] text-xs mt-1">Только латинские буквы, цифры и _</p>
              </div>
              <Button onClick={saveProfile} className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white rounded-full w-full mt-1">Сохранить</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Настройки (токены) ── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#17212b] rounded-2xl p-5 w-full max-w-md shadow-2xl border border-[#243447] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <span className="text-white font-semibold flex items-center gap-2">
                <Icon name="Settings" size={18} className="text-[#2AABEE]" />
                Настройки
              </span>
              <button onClick={() => setSettingsOpen(false)}><Icon name="X" size={18} className="text-[#8096a7]" /></button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              {/* Профиль */}
              <div>
                <label className="text-[#8096a7] text-xs mb-2 block uppercase tracking-wide">Профиль</label>
                <button onClick={() => { setSettingsOpen(false); setDisplayInput(user.display_name); setUsernameInput(user.username || ""); setProfileOpen(true); }} className="w-full flex items-center gap-3 p-3 bg-[#242f3d] rounded-xl hover:bg-[#2b3a4a] transition-colors text-left">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#2AABEE] to-[#1a9fd8] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">{user.display_name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{user.display_name}</div>
                    <div className="text-[#8096a7] text-xs">{user.username ? `@${user.username}` : user.phone}</div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-[#8096a7] ml-auto" />
                </button>
              </div>

              {/* Раздел разработчика — инвайт-токены */}
              <div>
                <label className="text-[#8096a7] text-xs mb-2 block uppercase tracking-wide flex items-center gap-1">
                  <Icon name="Code2" size={12} />
                  Режим разработчика
                </label>
                <div className="bg-[#242f3d] rounded-xl p-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Пароль разработчика"
                      className="flex-1 bg-[#1c2733] text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-transparent focus:border-[#2AABEE] transition-colors placeholder-[#8096a7]"
                      onKeyDown={(e) => e.key === "Enter" && loadAdminTokens()}
                    />
                    <button onClick={loadAdminTokens} disabled={adminLoading} className="px-4 py-2.5 bg-[#2AABEE] hover:bg-[#1a9fd8] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0">
                      {adminLoading ? "..." : "Войти"}
                    </button>
                  </div>
                  {adminError && <p className="text-red-400 text-xs">{adminError}</p>}
                  {adminTokens.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8096a7] text-xs">Инвайт-токены</span>
                        <button onClick={generateToken} disabled={adminLoading} className="text-[#2AABEE] text-xs hover:underline flex items-center gap-1">
                          <Icon name="Plus" size={12} /> Создать
                        </button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {adminTokens.map((t, i) => (
                          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${t.used ? "bg-[#1a2530] opacity-60" : "bg-[#1c3040]"}`}>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.used ? "bg-red-400" : "bg-green-400"}`} />
                            <span className="text-white text-xs font-mono truncate flex-1">{t.token.slice(0, 24)}...</span>
                            {!t.used && (
                              <button onClick={() => copyToken(t.token)} className="text-[#2AABEE] text-xs flex-shrink-0 flex items-center gap-1">
                                <Icon name={copiedToken === t.token ? "Check" : "Copy"} size={12} />
                                {copiedToken === t.token ? "Скопировано" : "Копировать"}
                              </button>
                            )}
                            {t.used && <span className="text-red-400 text-xs flex-shrink-0">Использован</span>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Выход */}
              <div>
                <button onClick={() => { api.clearSession(); setUser(null); setSettingsOpen(false); }} className="w-full flex items-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors">
                  <Icon name="LogOut" size={16} />
                  <span className="text-sm">Выйти из аккаунта</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Удаление медиа ── */}
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

      {showVideoRecorder && <VideoRecorder onVideoReady={handleVideoReady} onClose={() => setShowVideoRecorder(false)} />}
      {showVoiceRecorder && <VoiceRecorder onVoiceReady={handleVoiceReady} onClose={() => setShowVoiceRecorder(false)} />}
      {call && activeChat && (
        <CallScreen
          type={call.type}
          contactName={activeChat.name}
          contactAvatar=""
          contactColor={activeChat.avatar_color}
          onClose={() => setCall(null)}
        />
      )}
    </div>
  );
};

export default Index;
