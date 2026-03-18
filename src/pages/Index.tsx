import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1c2733] text-white overflow-x-hidden">
      {/* Навигация в стиле Telegram */}
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
          <div className="hidden sm:flex items-center gap-4">
            <Button variant="ghost" className="text-[#8096a7] hover:text-white hover:bg-[#242f3d]">
              <Icon name="Info" size={16} className="mr-2" />
              О нас
            </Button>
            <Button className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white px-6 py-2 rounded-full text-sm font-medium">
              Попробовать
            </Button>
          </div>
          <Button
            variant="ghost"
            className="sm:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <Icon name="X" size={20} /> : <Icon name="Menu" size={20} />}
          </Button>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-[#0d1821]">
            <div className="flex flex-col gap-3">
              <Button variant="ghost" className="text-[#8096a7] hover:text-white hover:bg-[#242f3d] justify-start">
                <Icon name="Info" size={16} className="mr-2" />
                О нас
              </Button>
              <Button className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white px-6 py-2 rounded-full text-sm font-medium">
                Попробовать
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Макет в стиле Telegram */}
      <div className="flex min-h-screen">
        {/* Боковая панель чатов */}
        <div
          className={`${mobileSidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-72 bg-[#17212b] flex flex-col border-r border-[#0d1821]`}
        >
          {/* Поиск */}
          <div className="p-3 border-b border-[#0d1821] flex items-center justify-between">
            <div className="flex-1 bg-[#242f3d] rounded-full px-4 py-2 flex items-center gap-2">
              <Icon name="Search" size={14} className="text-[#8096a7]" />
              <span className="text-[#8096a7] text-sm">Поиск</span>
            </div>
            <Button
              variant="ghost"
              className="lg:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-1 ml-2"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon name="X" size={16} />
            </Button>
          </div>

          {/* Список чатов */}
          <div className="flex-1 overflow-y-auto">
            {[
              { name: "Мама", msg: "Как дела, солнышко? 💙", time: "12:45", avatar: "М", unread: 2, online: true, color: "from-pink-400 to-rose-500" },
              { name: "Семья 🏠", msg: "Папа: Все едем на дачу!", time: "12:30", avatar: "С", unread: 5, online: false, color: "from-blue-400 to-cyan-500" },
              { name: "Антон", msg: "Встречаемся у фонтана?", time: "11:58", avatar: "А", unread: 0, online: true, color: "from-green-400 to-teal-500" },
              { name: "Катя ❤️", msg: "Уже скучаю...", time: "вчера", avatar: "К", unread: 0, online: true, color: "from-purple-400 to-pink-500" },
              { name: "Друзья", msg: "Ты: Завтра встречаемся!", time: "вчера", avatar: "Д", unread: 0, online: false, color: "from-yellow-400 to-orange-500" },
            ].map((chat, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#242f3d] transition-colors ${i === 0 ? "bg-[#2b5278]" : ""}`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 bg-gradient-to-br ${chat.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-base font-semibold">{chat.avatar}</span>
                  </div>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2AABEE] border-2 border-[#17212b] rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white text-sm font-medium truncate">{chat.name}</span>
                    <span className="text-[#8096a7] text-xs flex-shrink-0 ml-2">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8096a7] text-xs truncate">{chat.msg}</span>
                    {chat.unread > 0 && (
                      <span className="bg-[#2AABEE] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2 font-medium">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Нижняя панель */}
          <div className="p-3 bg-[#17212b] border-t border-[#0d1821] flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2AABEE] to-[#1a9fd8] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Я</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">Мой аккаунт</div>
              <div className="text-[#8096a7] text-xs">В сети</div>
            </div>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-[#242f3d]">
              <Icon name="Settings" size={16} className="text-[#8096a7]" />
            </Button>
          </div>
        </div>

        {/* Область чата */}
        <div className="flex-1 flex flex-col">
          {/* Заголовок чата */}
          <div className="h-14 bg-[#17212b] border-b border-[#0d1821] flex items-center px-4 gap-3">
            <Button
              variant="ghost"
              className="lg:hidden text-[#8096a7] hover:text-white hover:bg-[#242f3d] p-1 mr-1"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Icon name="Menu" size={20} />
            </Button>
            <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">М</span>
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">Мама</div>
              <div className="text-[#2AABEE] text-xs">в сети</div>
            </div>
            <div className="flex items-center gap-3">
              <Icon name="Phone" size={20} className="text-[#8096a7] cursor-pointer hover:text-white" />
              <Icon name="Video" size={20} className="text-[#8096a7] cursor-pointer hover:text-white" />
              <Icon name="Search" size={20} className="text-[#8096a7] cursor-pointer hover:text-white" />
            </div>
          </div>

          {/* Фон чата с паттерном */}
          <div className="flex-1 p-3 sm:p-5 space-y-3 overflow-y-auto" style={{ background: "linear-gradient(135deg, #0d1821 0%, #1c2733 50%, #17212b 100%)" }}>

            {/* Дата */}
            <div className="flex justify-center">
              <span className="bg-[#182533] text-[#8096a7] text-xs px-3 py-1 rounded-full">Сегодня</span>
            </div>

            {/* Входящее сообщение — Мама */}
            <div className="flex gap-2 items-end">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">М</span>
              </div>
              <div className="max-w-xs lg:max-w-md">
                <div className="bg-[#182533] rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <p className="text-white text-sm">Как дела, солнышко? Мы с папой скучаем 💙</p>
                </div>
                <span className="text-[#8096a7] text-xs mt-1 ml-1">12:42</span>
              </div>
            </div>

            {/* Исходящее сообщение */}
            <div className="flex justify-end">
              <div className="max-w-xs lg:max-w-md">
                <div className="bg-[#2b5278] rounded-2xl rounded-br-sm px-4 py-2.5">
                  <p className="text-white text-sm">Всё хорошо, мам! Работаю 😊 Скоро приеду!</p>
                </div>
                <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                  <span className="text-[#8096a7] text-xs">12:44</span>
                  <Icon name="CheckCheck" size={14} className="text-[#2AABEE]" />
                </div>
              </div>
            </div>

            {/* Входящее — Мама */}
            <div className="flex gap-2 items-end">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">М</span>
              </div>
              <div className="max-w-xs lg:max-w-md">
                <div className="bg-[#182533] rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <p className="text-white text-sm">Ждём тебя! Приготовлю твоё любимое 🍝</p>
                </div>
                <span className="text-[#8096a7] text-xs mt-1 ml-1">12:45</span>
              </div>
            </div>

            {/* Секция "Начало работы" */}
            <div className="bg-[#182533] border border-[#243447] rounded-2xl p-4 sm:p-6 mt-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Icon name="Heart" size={22} className="text-[#2AABEE]" />
                Начни общаться с близкими
              </h2>
              <p className="text-[#8096a7] text-sm mb-5">Без рекламы, без слежки — только вы и ваши близкие</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-5">
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2AABEE] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-sm sm:text-base">1</span>
                  </div>
                  <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Создай аккаунт</h3>
                  <p className="text-[#8096a7] text-xs sm:text-sm">Регистрация за 30 секунд — только номер телефона</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2AABEE] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-sm sm:text-base">2</span>
                  </div>
                  <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Пригласи близких</h3>
                  <p className="text-[#8096a7] text-xs sm:text-sm">Отправь ссылку — они присоединятся в один клик</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2AABEE] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-sm sm:text-base">3</span>
                  </div>
                  <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Общайся свободно</h3>
                  <p className="text-[#8096a7] text-xs sm:text-sm">Сообщения, фото, голос — всё в одном месте</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="bg-[#2AABEE] hover:bg-[#1a9fd8] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm font-medium">
                  <Icon name="Download" size={16} className="mr-2" />
                  Скачать приложение
                </Button>
                <Button
                  variant="outline"
                  className="border-[#2AABEE] text-[#2AABEE] hover:bg-[#2AABEE] hover:text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm font-medium bg-transparent transition-colors"
                >
                  <Icon name="Globe" size={16} className="mr-2" />
                  Открыть в браузере
                </Button>
              </div>
            </div>

            {/* Преимущества */}
            <div className="bg-[#182533] border border-[#243447] rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Почему Близко?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  {
                    icon: "Lock",
                    title: "Сквозное шифрование",
                    desc: "Ваши сообщения читаете только вы",
                  },
                  {
                    icon: "Users",
                    title: "Семейные чаты",
                    desc: "Группы для семьи с удобным управлением",
                  },
                  {
                    icon: "Zap",
                    title: "Мгновенная доставка",
                    desc: "Сообщения приходят за доли секунды",
                  },
                  {
                    icon: "Heart",
                    title: "Без рекламы навсегда",
                    desc: "Никаких объявлений и слежки за вами",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 sm:gap-3 p-3 rounded-xl hover:bg-[#1c2d3e] transition-colors"
                  >
                    <div className="text-[#2AABEE] mt-0.5">
                      <Icon name={feature.icon} size={18} />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{feature.title}</div>
                      <div className="text-[#8096a7] text-xs sm:text-sm">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Поле ввода сообщения */}
          <div className="p-3 bg-[#17212b] border-t border-[#0d1821]">
            <div className="bg-[#242f3d] rounded-full px-4 py-3 flex items-center gap-3">
              <Icon name="Smile" size={20} className="text-[#8096a7]" />
              <span className="text-[#8096a7] text-sm flex-1">Написать сообщение...</span>
              <Icon name="Paperclip" size={20} className="text-[#8096a7]" />
              <div className="w-8 h-8 bg-[#2AABEE] rounded-full flex items-center justify-center">
                <Icon name="Mic" size={16} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Боковая панель участников */}
        <div className="hidden xl:block w-64 bg-[#17212b] p-4 border-l border-[#0d1821]">
          <div className="mb-5">
            <h3 className="text-[#8096a7] text-xs font-semibold uppercase tracking-wide mb-3">В сети — 4</h3>
            <div className="space-y-1">
              {[
                { name: "Мама", status: "в сети", avatar: "М", color: "from-pink-400 to-rose-500" },
                { name: "Катя ❤️", status: "в сети", avatar: "К", color: "from-purple-400 to-pink-500" },
                { name: "Антон", status: "в сети", avatar: "А", color: "from-green-400 to-teal-500" },
                { name: "Семья 🏠", status: "3 участника онлайн", avatar: "С", color: "from-blue-400 to-cyan-500" },
              ].map((user, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#242f3d] cursor-pointer transition-colors">
                  <div
                    className={`w-9 h-9 bg-gradient-to-br ${user.color} rounded-full flex items-center justify-center relative`}
                  >
                    <span className="text-white text-sm font-semibold">{user.avatar}</span>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#2AABEE] border-2 border-[#17212b] rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{user.name}</div>
                    <div className="text-[#2AABEE] text-xs truncate">{user.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#1c2d3e] rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Shield" size={16} className="text-[#2AABEE]" />
              <span className="text-white text-sm font-semibold">Полная приватность</span>
            </div>
            <p className="text-[#8096a7] text-xs leading-relaxed">
              Все сообщения зашифрованы. Мы не читаем ваши переписки и не передаём данные третьим лицам.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;