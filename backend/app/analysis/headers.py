# headers.py
# SPF/DKIM/DMARC etc. 

import re
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from app.core.config import DANGEROUS_EXTENSIONS, MAX_RECIPIENTS, HEADER_ANOMALY_DAYS, logger

def extract_domain(email_addr: str) -> str:
    """Extrahiert die Domain aus einer E-Mail-Adresse."""
    match = re.search(r'@([\w\.-]+)', email_addr or "")
    return match.group(1).lower() if match else ""

def extract_addr(addr: str) -> str:
    """Extrahiert die reine E-Mail-Adresse aus einem Header."""
    match = re.search(r'<?([\w\.-]+@[\w\.-]+)>?', addr or "")
    return match.group(1).lower() if match else (addr or "").lower()

KNOWN_BRANDS = [
    "paypal.com", "amazon.de", "amazon.com", "sparkasse.de", "postbank.de", "deutsche-bank.de",
    "apple.com", "microsoft.com", "google.com", "dhl.de", "ups.com", "t-online.de"
]

def is_lookalike(domain: str) -> Tuple[bool, str]:
    for brand in KNOWN_BRANDS:
        if domain.startswith("xn--"):
            return True, f"Punycode-Domain: {domain}"
        if brand.replace('.', '') in domain.replace('.', '') and domain != brand:
            return True, f"Lookalike zu {brand}: {domain}"
    return False, ""

def analyze_attachments(msg) -> Dict[str, List[str]]:
    """Analysiert Anhänge auf gefährliche und verschlüsselte Dateien."""
    attachments = []
    dangerous = []
    encrypted = []
    for part in msg.walk():
        if part.get_content_disposition() == 'attachment':
            filename = part.get_filename() or ""
            attachments.append(filename)
            ext = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
            if ext in DANGEROUS_EXTENSIONS:
                dangerous.append(filename)
            if 'encrypted' in filename.lower() or 'passwort' in filename.lower() or 'password' in filename.lower():
                encrypted.append(filename)
    return {
        "attachments": attachments,
        "dangerous_attachments": dangerous,
        "encrypted_attachments": encrypted
    }

def count_addresses(header_val: str) -> int:
    if not header_val:
        return 0
    return len([addr for addr in re.split(r',|;', header_val) if '@' in addr])

def analyze_headers(msg) -> Dict[str, Any]:
    """
    Führt alle Header-basierten Analysen durch und gibt ein dict mit den Ergebnissen zurück.
    """
    results: Dict[str, Any] = {}
    try:
        # SPF
        spf = msg.get("Received-SPF")
        results["spf"] = spf if spf else "unbekannt"
        # DKIM
        dkim = msg.get("DKIM-Signature")
        results["dkim"] = "vorhanden" if dkim else "fehlt"
        # DMARC
        auth_results = msg.get("Authentication-Results")
        if auth_results:
            if "dmarc=pass" in auth_results:
                results["dmarc"] = "pass"
            elif "dmarc=fail" in auth_results:
                results["dmarc"] = "fail"
            else:
                results["dmarc"] = "unbekannt"
        else:
            results["dmarc"] = "unbekannt"
        # Absender-Domain-Check
        from_addr = msg.get("from", "")
        domain = extract_domain(from_addr)
        lookalike, reason = is_lookalike(domain)
        results["from_domain"] = domain
        results["from_lookalike"] = reason if lookalike else "ok"
        # Reply-To/Return-Path-Check
        reply_to = msg.get("reply-to", "")
        return_path = msg.get("return-path", "")
        from_addr_clean = extract_addr(from_addr)
        reply_to_clean = extract_addr(reply_to)
        return_path_clean = extract_addr(return_path)
        reply_warning = "ok"
        if reply_to_clean and reply_to_clean != from_addr_clean:
            reply_warning = f"Reply-To unterscheidet sich von From: {reply_to_clean}"
        if return_path_clean and return_path_clean != from_addr_clean:
            if reply_warning == "ok":
                reply_warning = f"Return-Path unterscheidet sich von From: {return_path_clean}"
            else:
                reply_warning += f"; Return-Path unterscheidet sich von From: {return_path_clean}"
        results["reply_to"] = reply_to
        results["return_path"] = return_path
        results["reply_path_warning"] = reply_warning
        # Anhangsanalyse
        attach_result = analyze_attachments(msg)
        results["attachments"] = attach_result["attachments"]
        results["dangerous_attachments"] = attach_result["dangerous_attachments"]
        results["encrypted_attachments"] = attach_result["encrypted_attachments"]
        # BCC/CC-Check
        to_count = count_addresses(msg.get("to", ""))
        cc_count = count_addresses(msg.get("cc", ""))
        bcc_count = count_addresses(msg.get("bcc", ""))
        total_recipients = to_count + cc_count + bcc_count
        recipient_warning = "ok"
        if total_recipients > MAX_RECIPIENTS:
            recipient_warning = f"Viele Empfänger: {total_recipients} (To: {to_count}, CC: {cc_count}, BCC: {bcc_count})"
        results["to_count"] = to_count
        results["cc_count"] = cc_count
        results["bcc_count"] = bcc_count
        results["recipient_warning"] = recipient_warning
        # Header-Anomalien
        anomalies = []
        if not msg.get("Message-ID"):
            anomalies.append("Kein Message-ID-Header")
        if not msg.get("Date"):
            anomalies.append("Kein Date-Header")
        else:
            try:
                date_val = parsedate_to_datetime(msg.get("Date"))
                now = datetime.now(timezone.utc)
                if date_val > now:
                    anomalies.append(f"Date liegt in der Zukunft: {date_val}")
                elif (now - date_val).days > HEADER_ANOMALY_DAYS:
                    anomalies.append(f"Date liegt weit in der Vergangenheit: {date_val}")
            except Exception:
                anomalies.append("Date-Header konnte nicht geparst werden")
        results["header_anomalies"] = anomalies
        # Externe Bilder/Tracking-Pixel
        ext_imgs, tracking = analyze_external_images(msg)
        results["external_images"] = ext_imgs
        results["tracking_pixels"] = tracking
    except Exception as e:
        logger.error("Fehler bei der Header-Analyse: %s", e)
    return results

def analyze_external_images(msg) -> Tuple[List[str], List[str]]:
    external_images = []
    tracking_pixels = []
    for part in msg.walk():
        if part.get_content_type() == 'text/html':
            html = part.get_payload(decode=True).decode(errors="ignore")
            for match in re.findall(r'<img[^>]+src=["\\\']([^"\\\']+)["\\\']', html, re.IGNORECASE):
                if match.startswith('http'):
                    external_images.append(match)
            for match in re.findall(r'<img[^>]+width=["\\\']1["\\\'][^>]+height=["\\\']1["\\\'][^>]*src=["\\\']([^"\\\']+)["\\\']', html, re.IGNORECASE):
                tracking_pixels.append(match)
    return external_images, tracking_pixels 