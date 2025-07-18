# main.py
# Haupt-Loop + API-Starter 
from fastapi import FastAPI, Query, HTTPException
from app.imap.fetcher import fetch_latest_emails
from app.analysis.content import analyze_email_content
from app.analysis.result import parse_analysis_result, combine_results
from app.analysis.headers import analyze_headers
from app.analysis.links import extract_links, analyze_links
from app.imap.modifier import change_subject
from app.core.config import logger
import asyncio
import imaplib, email
from typing import Dict, Any

app = FastAPI()

RISK_PREFIXES = ["[⚠️ Hochrisiko]", "[Warnung]", "[Info]"]

def has_risk_prefix(subject: str) -> bool:
    return any((subject or "").startswith(prefix) for prefix in RISK_PREFIXES)

@app.get("/analyze")
async def analyze_emails(limit: int = 3) -> Dict[str, Any]:
    """
    Analysiert die letzten E-Mails und gibt die Ergebnisse als JSON zurück.
    """
    try:
        emails = fetch_latest_emails(limit=limit)
        results = []
        for uid, msg in emails:
            subject = msg["subject"] or ""
            header_result = analyze_headers(msg)
            text = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        text += part.get_payload(decode=True).decode(errors="ignore")
            else:
                text = msg.get_payload(decode=True).decode(errors="ignore")
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
        logger.info("Analyse von %d E-Mails abgeschlossen.", len(results))
        return {"results": results}
    except Exception as e:
        logger.error("Fehler im Analyse-Endpoint: %s", e)
        raise HTTPException(status_code=500, detail="Analyse fehlgeschlagen")

@app.post("/modify-subject")
def modify_subject(uid: str = Query(...), risk: str = Query(...)) -> Dict[str, Any]:
    """
    Setzt ein Risikopräfix im Betreff einer E-Mail (per UID).
    """
    prefix = {
        "hoch": "[⚠️ Hochrisiko] ",
        "mittel": "[Warnung] ",
        "niedrig": "[Info] "
    }.get(risk, "[Info] ")
    try:
        mail = imaplib.IMAP4_SSL("localhost")  # Host aus config holen, falls nötig
        mail.login("user", "pass")  # User/Pass aus config holen
        mail.select('INBOX')
        result, data = mail.uid('fetch', uid.encode(), '(RFC822)')
        if result != 'OK':
            mail.logout()
            logger.warning("Mail mit UID %s nicht gefunden.", uid)
            return {"success": False, "error": "Mail not found"}
        raw_email = data[0][1]
        msg = email.message_from_bytes(raw_email)
        orig_subject = msg["subject"] or ""
        mail.logout()
        if has_risk_prefix(orig_subject):
            logger.info("Subject für UID %s hat bereits ein Risikopräfix.", uid)
            return {"success": False, "error": "Subject already has risk prefix", "subject": orig_subject}
        new_subject = f"{prefix}{orig_subject}"
        ok = change_subject(uid.encode(), new_subject)
        logger.info("Subject für UID %s geändert: %s", uid, new_subject)
        return {"success": ok, "new_subject": new_subject}
    except Exception as e:
        logger.error("Fehler beim Setzen des Betreffs: %s", e)
        raise HTTPException(status_code=500, detail="Betreff-Änderung fehlgeschlagen") 