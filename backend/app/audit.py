import logging
from datetime import datetime
from typing import Dict, Any
from app.core.config import logger

# Separater Logger für Audit-Logs
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Audit-Log-Handler (separate Datei)
audit_handler = logging.FileHandler("audit.log", encoding='utf-8')
audit_handler.setFormatter(logging.Formatter(
    '%(asctime)s AUDIT %(levelname)s: %(message)s'
))
audit_logger.addHandler(audit_handler)

def log_analysis(uid: str, subject: str, from_addr: str, risk_score: int, risk_level: str):
    """Loggt eine E-Mail-Analyse."""
    audit_logger.info(
        "ANALYSIS uid=%s subject='%s' from='%s' score=%d risk=%s",
        uid, subject, from_addr, risk_score, risk_level
    )

def log_subject_modification(uid: str, old_subject: str, new_subject: str, risk_level: str):
    """Loggt eine Betreff-Änderung."""
    audit_logger.info(
        "SUBJECT_MODIFIED uid=%s old='%s' new='%s' risk=%s",
        uid, old_subject, new_subject, risk_level
    )

def log_api_access(endpoint: str, method: str, status_code: int, user_agent: str = None):
    """Loggt API-Zugriffe."""
    audit_logger.info(
        "API_ACCESS endpoint=%s method=%s status=%d user_agent=%s",
        endpoint, method, status_code, user_agent or "unknown"
    )

def log_security_event(event_type: str, details: Dict[str, Any]):
    """Loggt allgemeine Sicherheitsereignisse."""
    audit_logger.warning(
        "SECURITY_EVENT type=%s details=%s",
        event_type, details
    ) 