"""
Чаты: список чатов, создать чат, добавить участника.
Action передаётся в поле 'action' тела POST запроса. GET = список чатов.
"""
import json
import os
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    session = headers.get("X-Session-Token", "").strip()
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    if not session:
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Нет сессии"})}

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id, display_name, username FROM users WHERE session_token = %s", (session,))
    user = cur.fetchone()
    if not user:
        conn.close()
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверная сессия"})}

    user_id, user_name, user_username = user
    action = body.get("action", "list") if method == "POST" else "list"

    if method == "GET" or action == "list":
        cur.execute("""
            SELECT c.id, c.name, c.avatar_letter, c.avatar_color,
                   (SELECT m.text FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_msg,
                   (SELECT to_char(m.created_at, 'HH24:MI') FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_time
            FROM chats c
            JOIN chat_members cm ON cm.chat_id = c.id
            WHERE cm.user_id = %s
            ORDER BY c.created_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        chats = [{"id": r[0], "name": r[1], "avatar_letter": r[2], "avatar_color": r[3],
                  "last_msg": r[4] or "", "last_time": r[5] or ""} for r in rows]
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"chats": chats, "user_id": user_id, "display_name": user_name, "username": user_username})}

    if action == "create":
        name = body.get("name", "").strip()
        avatar_letter = body.get("avatar_letter", (name[:1].upper() if name else "?"))
        avatar_color = body.get("avatar_color", "from-blue-400 to-cyan-500")
        invite_user_id = body.get("invite_user_id")

        if not name:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Нужно название чата"})}

        cur.execute("INSERT INTO chats (name, avatar_letter, avatar_color) VALUES (%s, %s, %s) RETURNING id", (name, avatar_letter, avatar_color))
        chat_id = cur.fetchone()[0]
        cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user_id))

        if invite_user_id and invite_user_id != user_id:
            cur.execute("SELECT id FROM users WHERE id = %s", (invite_user_id,))
            if cur.fetchone():
                cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (chat_id, invite_user_id))

        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"chat_id": chat_id, "name": name, "avatar_letter": avatar_letter, "avatar_color": avatar_color})}

    if action == "add_member":
        chat_id = body.get("chat_id")
        target_username = body.get("username", "").strip().lstrip("@")
        if not chat_id or not target_username:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Нужны chat_id и username"})}

        cur.execute("SELECT id, display_name FROM users WHERE username = %s", (target_username,))
        target = cur.fetchone()
        if not target:
            conn.close()
            return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Пользователь не найден"})}

        cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (chat_id, target[0]))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True, "added": target[1]})}

    conn.close()
    return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Неизвестное действие"})}