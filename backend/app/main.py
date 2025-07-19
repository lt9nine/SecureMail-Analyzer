# main.py
# Haupt-Loop + API-Starter 
from fastapi import FastAPI, Query, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.imap.fetcher import fetch_latest_emails
from app.analysis.content import analyze_email_content
from app.analysis.result import parse_analysis_result, combine_results
from app.analysis.headers import analyze_headers
from app.analysis.links import extract_links, analyze_links
from app.imap.modifier import change_subject
from app.core.config import logger, IMAP_HOST, IMAP_USER, IMAP_PASSWORD
from app.models import (
    AnalysisResponse, ModifySubjectResponse, HealthResponse, 
    ErrorResponse, EmailAnalysis, HeaderAnalysis, LinkAnalysis, 
    AIAnalysis, FinalScore
)
from app.audit import log_analysis, log_subject_modification, log_api_access
from app.rate_limiter import rate_limiter, get_client_id
import asyncio
import imaplib, email
from email.header import decode_header
from typing import Dict, Any
import httpx
import html
import re
import json
import time
from datetime import datetime, timedelta

app = FastAPI(
    title="SecureMail Analyzer API",
    description="IMAP-basiertes Mail-Security-Tool mit KI-Analyse",
    version="1.0.0"
)

# CORS aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Für Entwicklung - in Produktion spezifische URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache für E-Mail-Analysen (UID -> {data, timestamp})
email_cache: Dict[str, Dict] = {}
CACHE_DURATION = 300  # 5 Minuten Cache

RISK_PREFIXES = ["[⚠️ Hochrisiko]", "[Warnung]", "[Info]"]

def has_risk_prefix(subject: str) -> bool:
    return any((subject or "").startswith(prefix) for prefix in RISK_PREFIXES)

async def get_cached_analysis(uid: str, msg) -> Dict[str, Any]:
    """
    Holt gecachte Analyse oder führt neue durch.
    """
    current_time = time.time()
    
    # Prüfe Cache
    if uid in email_cache:
        cache_entry = email_cache[uid]
        if current_time - cache_entry["timestamp"] < CACHE_DURATION:
            logger.info("Cache-Hit für UID %s", uid)
            return cache_entry["data"]
    
    # Führe neue Analyse durch
    logger.info("Neue Analyse für UID %s", uid)
    
    # Dekodiere MIME-kodierte Betreffzeile
    raw_subject = msg["subject"] or ""
    subject = decode_mime_header(raw_subject)
    
    # Bereinige E-Mail-Adresse
    raw_from = msg["from"] or ""
    from_addr = clean_email_address(raw_from)
    
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
    
    # Cache das Ergebnis
    analysis_data = {
        "uid": uid,
        "subject": subject,
        "from_addr": from_addr,
        "score": combined["score"],
        "risk_level": combined["risikostufe"],
        "headers": header_result,
        "links": link_result,
        "analysis": result
    }
    
    email_cache[uid] = {
        "data": analysis_data,
        "timestamp": current_time
    }
    
    # Cache-Größe begrenzen (max 100 Einträge)
    if len(email_cache) > 100:
        oldest_uid = min(email_cache.keys(), key=lambda k: email_cache[k]["timestamp"])
        del email_cache[oldest_uid]
    
    return analysis_data

def decode_mime_header(header_value: str) -> str:
    """Dekodiert MIME-kodierte Header-Werte (z.B. Betreffzeilen)."""
    if not header_value:
        return ""
    try:
        decoded_parts = decode_header(header_value)
        decoded_string = ""
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                if encoding:
                    decoded_string += part.decode(encoding)
                else:
                    decoded_string += part.decode('utf-8', errors='ignore')
            else:
                decoded_string += part
        return decoded_string
    except Exception as e:
        logger.warning("Fehler beim Dekodieren des Headers '%s': %s", header_value, e)
        return header_value

def clean_email_address(email_addr: str) -> str:
    """Bereinigt E-Mail-Adressen von HTML-Entities und Unicode-Escape-Sequenzen."""
    if not email_addr:
        return ""
    try:
        # Dekodiere HTML-Entities
        cleaned = html.unescape(email_addr)
        # Dekodiere Unicode-Escape-Sequenzen
        cleaned = cleaned.encode().decode('unicode_escape')
        
        # Extrahiere E-Mail aus "Name <email@domain.com>" Format
        email_match = re.search(r'<([^>]+)>', cleaned)
        if email_match:
            return email_match.group(1).strip()
        
        # Fallback: Entferne überflüssige Anführungszeichen und Klammern
        cleaned = re.sub(r'^["\']+|["\']+$', '', cleaned)  # Anführungszeichen am Anfang/Ende
        cleaned = re.sub(r'^<+|>+$', '', cleaned)  # Spitze Klammern am Anfang/Ende
        
        # Suche nach E-Mail-Pattern
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        match = re.search(email_pattern, cleaned)
        if match:
            return match.group(0)
        
        return cleaned.strip()
    except Exception as e:
        logger.warning("Fehler beim Bereinigen der E-Mail-Adresse '%s': %s", email_addr, e)
        return email_addr

async def check_rate_limit(request: Request):
    """Dependency für Rate-Limiting."""
    client_id = get_client_id(request)
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return client_id

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health-Check-Endpoint für das Backend."""
    services = {}
    
    # Prüfe IMAP-Verbindung
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, 993)
        mail.login(IMAP_USER, IMAP_PASSWORD)
        mail.logout()
        services["imap"] = "ok"
    except Exception as e:
        logger.error("IMAP health check failed: %s", e)
        services["imap"] = "error"
    
    # Prüfe OpenRouter-Verbindung
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://openrouter.ai/api/v1/models", timeout=5)
            if response.status_code == 200:
                services["openrouter"] = "ok"
            else:
                services["openrouter"] = "error"
    except Exception as e:
        logger.error("OpenRouter health check failed: %s", e)
        services["openrouter"] = "error"
    
    return HealthResponse(
        status="ok" if all(status == "ok" for status in services.values()) else "degraded",
        version="1.0.0",
        services=services
    )

@app.get("/analyze", response_model=AnalysisResponse)
async def analyze_emails(limit: int = 3):
    """
    Analysiert die letzten E-Mails und gibt die Ergebnisse als JSON zurück.
    """
    try:
        emails = fetch_latest_emails(limit=limit)
        results = []
        
        for uid, msg in emails:
            uid_str = uid.decode() if isinstance(uid, bytes) else str(uid)
            
            # Verwende gecachte Analyse
            analysis_data = await get_cached_analysis(uid_str, msg)
            
            # Audit-Log
            log_analysis(uid_str, analysis_data["subject"], analysis_data["from_addr"], 
                        analysis_data["score"], analysis_data["risk_level"])
            
            # Erstelle Pydantic-Modelle
            email_analysis = EmailAnalysis(
                uid=uid_str,
                subject=analysis_data["subject"],
                from_addr=analysis_data["from_addr"],
                headers=HeaderAnalysis(**analysis_data["headers"]),
                links=[LinkAnalysis(**link) for link in analysis_data["links"]],
                analysis=AIAnalysis(**analysis_data["analysis"]),
                final=FinalScore(score=analysis_data["score"], risikostufe=analysis_data["risk_level"])
            )
            results.append(email_analysis)
        
        logger.info("Analyse von %d E-Mails abgeschlossen.", len(results))
        
        return AnalysisResponse(results=results)
        
    except Exception as e:
        logger.error("Fehler im Analyse-Endpoint: %s", e)
        raise HTTPException(status_code=500, detail="Analyse fehlgeschlagen")

@app.get("/events")
async def email_events():
    """
    Server-Sent Events Endpoint für Echtzeit-Updates.
    Sendet Updates wenn neue E-Mails analysiert werden.
    """
    async def event_generator():
        last_check = time.time()
        last_email_count = 0
        
        while True:
            try:
                # Prüfe auf neue E-Mails alle 30 Sekunden
                current_time = time.time()
                if current_time - last_check >= 30:
                    emails = fetch_latest_emails(limit=10)
                    current_email_count = len(emails)
                    
                    # Sende Update nur wenn sich die Anzahl geändert hat
                    if current_email_count != last_email_count:
                        # Verwende gecachte Analyse für die neueste E-Mail
                        if emails:
                            uid, msg = emails[0]  # Neueste E-Mail
                            uid_str = uid.decode() if isinstance(uid, bytes) else str(uid)
                            
                            # Verwende gecachte Analyse
                            analysis_data = await get_cached_analysis(uid_str, msg)
                            
                            # Erstelle Update-Event
                            update_data = {
                                "type": "new_email",
                                "timestamp": current_time,
                                "email_count": current_email_count,
                                "latest_email": {
                                    "uid": uid_str,
                                    "subject": analysis_data["subject"],
                                    "from_addr": analysis_data["from_addr"],
                                    "score": analysis_data["score"],
                                    "risk_level": analysis_data["risk_level"]
                                }
                            }
                            
                            yield {
                                "event": "email_update",
                                "data": json.dumps(update_data)
                            }
                        
                        last_email_count = current_email_count
                    
                    last_check = current_time
                
                # Sende Heartbeat alle 10 Sekunden
                yield {
                    "event": "heartbeat",
                    "data": json.dumps({
                        "timestamp": current_time,
                        "status": "connected"
                    })
                }
                
                await asyncio.sleep(10)  # 10 Sekunden Pause zwischen Checks
                
            except Exception as e:
                logger.error("Fehler im SSE-Event-Generator: %s", e)
                yield {
                    "event": "error",
                    "data": json.dumps({
                        "error": str(e),
                        "timestamp": time.time()
                    })
                }
                await asyncio.sleep(30)  # Längere Pause bei Fehlern

    async def sse_generator():
        async for event in event_generator():
            if event["event"] == "email_update":
                yield f"event: {event['event']}\ndata: {event['data']}\n\n"
            elif event["event"] == "heartbeat":
                yield f"event: {event['event']}\ndata: {event['data']}\n\n"
            elif event["event"] == "error":
                yield f"event: {event['event']}\ndata: {event['data']}\n\n"
    
    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@app.post("/modify-subject", response_model=ModifySubjectResponse)
async def modify_subject(
    uid: str = Query(..., description="UID der zu ändernden E-Mail"),
    risk: str = Query(..., description="Risikostufe: hoch, mittel, niedrig")
):
    """
    Setzt ein Risikopräfix im Betreff einer E-Mail (per UID).
    """
    prefix = {
        "hoch": "[⚠️ Hochrisiko] ",
        "mittel": "[Warnung] ",
        "niedrig": "[Info] "
    }.get(risk, "[Info] ")
    
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, 993)
        mail.login(IMAP_USER, IMAP_PASSWORD)
        mail.select('INBOX')
        result, data = mail.uid('fetch', uid.encode(), '(RFC822)')
        
        if result != 'OK':
            mail.logout()
            logger.warning("Mail mit UID %s nicht gefunden.", uid)
            return ModifySubjectResponse(success=False, error="Mail not found")
        
        raw_email = data[0][1]
        msg = email.message_from_bytes(raw_email)
        raw_subject = msg["subject"] or ""
        orig_subject = decode_mime_header(raw_subject)
        mail.logout()
        
        if has_risk_prefix(orig_subject):
            logger.info("Subject für UID %s hat bereits ein Risikopräfix.", uid)
            return ModifySubjectResponse(
                success=False, 
                error="Subject already has risk prefix", 
                new_subject=orig_subject
            )
        
        new_subject = f"{prefix}{orig_subject}"
        ok = change_subject(uid.encode(), new_subject)
        
        if ok:
            log_subject_modification(uid, orig_subject, new_subject, risk)
            logger.info("Subject für UID %s geändert: %s", uid, new_subject)
            return ModifySubjectResponse(success=True, new_subject=new_subject)
        else:
            return ModifySubjectResponse(success=False, error="Subject modification failed")
            
    except Exception as e:
        logger.error("Fehler beim Setzen des Betreffs: %s", e)
        raise HTTPException(status_code=500, detail="Betreff-Änderung fehlgeschlagen") 