# fetcher.py
# Holt E-Mails via IMAP 
import imaplib
import email
from email.header import decode_header
from app.core import config


def fetch_latest_emails(limit=5):
    mail = imaplib.IMAP4_SSL(config.IMAP_HOST, config.IMAP_PORT)
    mail.login(config.IMAP_USER, config.IMAP_PASSWORD)
    mail.select('INBOX')
    result, data = mail.search(None, 'ALL')
    if result != 'OK':
        return []
    mail_ids = data[0].split()
    latest_ids = mail_ids[-limit:]
    emails = []
    for num in latest_ids:
        result, msg_data = mail.fetch(num, '(RFC822)')
        if result != 'OK':
            continue
        msg = email.message_from_bytes(msg_data[0][1])
        emails.append((num, msg))  # num ist die UID
    mail.logout()
    return emails 