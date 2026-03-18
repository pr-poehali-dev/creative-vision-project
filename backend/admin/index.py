"""
Административный раздел: генерация инвайт-токенов (только для разработчика).
Защищён секретным ADMIN_PASSWORD в заголовке X-Admin-Password.
GET = список токенов, POST action=generate = создать токен.
"""
import json
import os
import secrets
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    headers = event.get("headers") or {}
    admin_pass = headers.get("X-Admin-Password", "").strip()
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    expected = os.environ.get("ADMIN_PASSWORD", "")
    if not expected or admin_pass != expected:
        return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Нет доступа"})}

    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        cur.execute("SELECT token, used, used_by_user_id, created_at::text FROM invite_tokens ORDER BY created_at DESC")
        rows = cur.fetchall()
        tokens = [{"token": r[0], "used": r[1], "used_by": r[2], "created_at": r[3]} for r in rows]
        conn.close()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"tokens": tokens})}

    if method == "POST":
        action = body.get("action", "generate")
        if action == "generate":
            token = secrets.token_urlsafe(32)
            cur.execute("INSERT INTO invite_tokens (token) VALUES (%s) RETURNING id, token, created_at::text", (token,))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"id": row[0], "token": row[1], "created_at": row[2]})}

    conn.close()
    return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Неизвестное действие"})}