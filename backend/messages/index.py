"""
Сообщения: получить историю чата (GET ?chat_id=X), отправить сообщение (POST action=send).
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
    params = event.get("queryStringParameters") or {}
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

    cur.execute("SELECT id FROM users WHERE session_token = %s", (session,))
    user_row = cur.fetchone()
    if not user_row:
        conn.close()
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверная сессия"})}

    user_id = user_row[0]

    if method == "GET":
        chat_id = params.get("chat_id")
        if not chat_id:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Нужен chat_id"})}

        cur.execute("SELECT user_id FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user_id))
        if not cur.fetchone():
            conn.close()
            return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Нет доступа к чату"})}

        cur.execute("""
            SELECT m.id, m.user_id, u.display_name, m.text,
                   to_char(m.created_at, 'HH24:MI') as time
            FROM messages m
            LEFT JOIN users u ON u.id = m.user_id
            WHERE m.chat_id = %s
            ORDER BY m.created_at ASC
            LIMIT 200
        """, (chat_id,))
        rows = cur.fetchall()
        msgs = [{"id": r[0], "user_id": r[1], "sender": r[2], "text": r[3], "time": r[4],
                 "outgoing": r[1] == user_id} for r in rows]
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"messages": msgs})}

    if method == "POST":
        chat_id = body.get("chat_id")
        text = body.get("text", "").strip()
        if not chat_id or not text:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Нужны chat_id и text"})}

        cur.execute("SELECT user_id FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user_id))
        if not cur.fetchone():
            conn.close()
            return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Нет доступа к чату"})}

        cur.execute(
            "INSERT INTO messages (chat_id, user_id, text) VALUES (%s, %s, %s) RETURNING id, to_char(created_at, 'HH24:MI')",
            (chat_id, user_id, text)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"id": row[0], "time": row[1]})}

    conn.close()
    return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}