# modifier.py
# Ändert Betreff/Label 
import imaplib
from app.core.config import IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD, logger
import email
from typing import Union


def change_subject(uid: bytes, new_subject: str) -> bool:
    """
    Ändert den Betreff einer E-Mail per IMAP (Kopieren, Original löschen).
    Gibt True bei Erfolg, False bei Fehler.
    """
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(IMAP_USER, IMAP_PASSWORD)
        mail.select('INBOX')
        result, data = mail.uid('fetch', uid, '(RFC822)')
        if result != 'OK':
            logger.warning("IMAP fetch failed for UID %s: %s", uid, result)
            mail.logout()
            return False
        raw_email = data[0][1]
        msg = email.message_from_bytes(raw_email)
        msg.replace_header('Subject', new_subject)
        mail.append('INBOX', '', None, msg.as_bytes())
        mail.uid('store', uid, '+FLAGS', '\\Deleted')
        mail.expunge()
        mail.close()
        mail.logout()
        logger.info("Betreff für UID %s erfolgreich geändert.", uid)
        return True
    except Exception as e:
        logger.error("Fehler beim Ändern des Betreffs für UID %s: %s", uid, e)
        return False 