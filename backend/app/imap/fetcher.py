# fetcher.py
# Holt E-Mails via IMAP 
import imaplib
import email
from email.header import decode_header
from typing import List, Tuple
from app.core.config import IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD, logger


def fetch_latest_emails(limit: int = 5) -> List[Tuple[bytes, email.message.Message]]:
    """
    Holt die letzten N E-Mails aus dem Posteingang per IMAP.
    Gibt eine Liste von (UID, Message) zurück.
    """
    emails = []
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(IMAP_USER, IMAP_PASSWORD)
        mail.select('INBOX')
        result, data = mail.search(None, 'ALL')
        if result != 'OK':
            logger.warning("IMAP search failed: %s", result)
            mail.logout()
            return []
        mail_ids = data[0].split()
        latest_ids = mail_ids[-limit:]
        for num in latest_ids:
            result, msg_data = mail.fetch(num, '(RFC822)')
            if result != 'OK':
                logger.warning("IMAP fetch failed for UID %s: %s", num, result)
                continue
            msg = email.message_from_bytes(msg_data[0][1])
            emails.append((num, msg))
        mail.logout()
    except Exception as e:
        logger.error("Fehler beim Abrufen der E-Mails: %s", e)
    return emails 