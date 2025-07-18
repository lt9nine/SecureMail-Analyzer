# modifier.py
# Ändert Betreff/Label 
import imaplib
import email
from app.core import config


def change_subject(uid: bytes, new_subject: str):
    mail = imaplib.IMAP4_SSL(config.IMAP_HOST, config.IMAP_PORT)
    mail.login(config.IMAP_USER, config.IMAP_PASSWORD)
    mail.select('INBOX')
    # Hole die Originalmail
    result, data = mail.uid('fetch', uid, '(RFC822)')
    if result != 'OK':
        mail.logout()
        return False
    raw_email = data[0][1]
    msg = email.message_from_bytes(raw_email)
    msg.replace_header('Subject', new_subject)
    # Neue Mail mit geändertem Betreff in INBOX kopieren
    mail.append('INBOX', '', None, msg.as_bytes())
    # Originalmail löschen (korrektes Flag)
    mail.uid('store', uid, '+FLAGS', '\\Deleted')
    mail.expunge()
    mail.close()
    mail.logout()
    return True 