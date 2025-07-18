# main.py
# Haupt-Loop + API-Starter 
from fastapi import FastAPI
from app.imap.fetcher import fetch_latest_emails
from app.analysis.content import analyze_email_content
from app.analysis.result import parse_analysis_result, combine_results
import asyncio
from app.imap.modifier import change_subject
from fastapi import Query
import imaplib, email
from app.core import config
from app.analysis.headers import analyze_headers
from app.analysis.links import extract_links, analyze_links

app = FastAPI()

RISK_PREFIXES = ["[⚠️ Hochrisiko]", "[Warnung]", "[Info]"]

def has_risk_prefix(subject):
    return any((subject or "").startswith(prefix) for prefix in RISK_PREFIXES)

@app.get("/analyze")
async def analyze_emails(limit: int = 3):
    emails = fetch_latest_emails(limit=limit)
    results = []
    for uid, msg in emails:
        subject = msg["subject"] or ""
        # Header-Analyse
        header_result = analyze_headers(msg)
        # Text extrahieren
        text = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    text += part.get_payload(decode=True).decode(errors="ignore")
        else:
            text = msg.get_payload(decode=True).decode(errors="ignore")
        # Link-Analyse
        links = extract_links(text)
        link_result = analyze_links(links)
        gpt_response = await analyze_email_content(text, headers=header_result, links=link_result)
        result = parse_analysis_result(gpt_response)
        combined = combine_results(header_result, link_result, result)
        results.append({
            "uid": uid.decode() if isinstance(uid, bytes) else str(uid),
            "subject": subject,
            "from": msg["from"],
            "headers": header_result,
            "links": link_result,
            "analysis": result,
            "final": combined
        })
    return {"results": results} 

@app.post("/modify-subject")
def modify_subject(uid: str = Query(...), risk: str = Query(...)):
    prefix = {
        "hoch": "[⚠️ Hochrisiko] ",
        "mittel": "[Warnung] ",
        "niedrig": "[Info] "
    }.get(risk, "[Info] ")
    # Hole die Originalmail, um den Betreff zu lesen
    mail = imaplib.IMAP4_SSL(config.IMAP_HOST, config.IMAP_PORT)
    mail.login(config.IMAP_USER, config.IMAP_PASSWORD)
    mail.select('INBOX')
    result, data = mail.uid('fetch', uid.encode(), '(RFC822)')
    if result != 'OK':
        mail.logout()
        return {"success": False, "error": "Mail not found"}
    raw_email = data[0][1]
    msg = email.message_from_bytes(raw_email)
    orig_subject = msg["subject"] or ""
    mail.logout()
    # Setze Prefix nur, wenn es noch nicht da ist
    if has_risk_prefix(orig_subject):
        return {"success": False, "error": "Subject already has risk prefix", "subject": orig_subject}
    new_subject = f"{prefix}{orig_subject}"
    ok = change_subject(uid.encode(), new_subject)
    return {"success": ok, "new_subject": new_subject} 