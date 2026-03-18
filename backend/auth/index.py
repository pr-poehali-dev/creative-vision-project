"""
Регистрация и авторизация. Action передаётся в поле 'action' тела запроса:
register, login, update_profile
"""
import json
import os
import secrets
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

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    action = body.get("action", "login")
    headers = event.get("headers") or {}
    session = headers.get("X-Session-Token", "").strip()

    conn = get_conn()
    cur = conn.cursor()

    # register
    if action == "register":
        invite_token = body.get("invite_token", "").strip()
        phone = body.get("phone", "").strip()
        display_name = body.get("display_name", "").strip()

        if not invite_token or not phone or not display_name:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Укажите токен, телефон и имя"})}

        cur.execute("SELECT id, used FROM invite_tokens WHERE token = %s", (invite_token,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Токен не найден"})}
        if row[1]:
            conn.close()
            return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Токен уже использован"})}

        token_id = row[0]
        cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": HEADERS, "body": json.dumps({"error": "Этот номер уже зарегистрирован"})}

        new_session = secrets.token_hex(32)
        cur.execute(
            "INSERT INTO users (phone, display_name, session_token) VALUES (%s, %s, %s) RETURNING id",
            (phone, display_name, new_session)
        )
        user_id = cur.fetchone()[0]
        cur.execute("UPDATE invite_tokens SET used = TRUE, used_by_user_id = %s WHERE id = %s", (user_id, token_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"session_token": new_session, "user_id": user_id, "display_name": display_name})}

    # login — проверить сессию
    if action == "login":
        if not session:
            session = body.get("session_token", "").strip()
        if not session:
            conn.close()
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Нет сессионного токена"})}

        cur.execute("SELECT id, phone, display_name, username FROM users WHERE session_token = %s", (session,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Сессия не найдена"})}

        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"user_id": row[0], "phone": row[1], "display_name": row[2], "username": row[3]})}

    # update_profile
    if action == "update_profile":
        if not session:
            conn.close()
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Нет сессии"})}

        cur.execute("SELECT id FROM users WHERE session_token = %s", (session,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверная сессия"})}

        user_id = row[0]
        display_name = body.get("display_name", "").strip()
        username = body.get("username", "").strip() or None

        if display_name:
            cur.execute("UPDATE users SET display_name = %s WHERE id = %s", (display_name, user_id))
        cur.execute("UPDATE users SET username = %s WHERE id = %s", (username, user_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Неизвестное действие"})}
