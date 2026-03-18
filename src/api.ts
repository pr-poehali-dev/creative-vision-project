const AUTH_URL = "https://functions.poehali.dev/71822d04-03d6-4ef6-872d-0b8f46d7fa50";
const CHATS_URL = "https://functions.poehali.dev/3ff9600e-71be-4a7a-98b1-24781474b8f0";
const MESSAGES_URL = "https://functions.poehali.dev/841256a4-36fb-424a-a076-c38705e12232";
const ADMIN_URL = "https://functions.poehali.dev/7b8007d8-b1c1-481c-a6e6-ff60c0d10a7c";

const SESSION_KEY = "blizko_session";

export const getSession = () => localStorage.getItem(SESSION_KEY) || "";
export const setSession = (token: string) => localStorage.setItem(SESSION_KEY, token);
export const clearSession = () => localStorage.removeItem(SESSION_KEY);

const authHeaders = () => ({
  "Content-Type": "application/json",
  "X-Session-Token": getSession(),
});

export async function register(invite_token: string, phone: string, display_name: string) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", invite_token, phone, display_name }),
  });
  return res.json();
}

export async function loginSession() {
  const session = getSession();
  if (!session) return null;
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Token": session },
    body: JSON.stringify({ action: "login" }),
  });
  if (res.status === 401) { clearSession(); return null; }
  return res.json();
}

export async function updateProfile(display_name: string, username: string) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action: "update_profile", display_name, username }),
  });
  return res.json();
}

export async function getChats() {
  const res = await fetch(CHATS_URL, { headers: authHeaders() });
  return res.json();
}

export async function createChat(name: string, avatar_letter: string, avatar_color: string) {
  const res = await fetch(CHATS_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action: "create", name, avatar_letter, avatar_color }),
  });
  return res.json();
}

export async function addMember(chat_id: number, username: string) {
  const res = await fetch(CHATS_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action: "add_member", chat_id, username }),
  });
  return res.json();
}

export async function getMessages(chat_id: number) {
  const res = await fetch(`${MESSAGES_URL}?chat_id=${chat_id}`, { headers: authHeaders() });
  return res.json();
}

export async function sendMessage(chat_id: number, text: string) {
  const res = await fetch(MESSAGES_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ chat_id, text }),
  });
  return res.json();
}

export async function adminGetTokens(admin_password: string) {
  const res = await fetch(ADMIN_URL, {
    headers: { "X-Admin-Password": admin_password },
  });
  return res.json();
}

export async function adminGenerateToken(admin_password: string) {
  const res = await fetch(ADMIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Password": admin_password },
    body: JSON.stringify({ action: "generate" }),
  });
  return res.json();
}
