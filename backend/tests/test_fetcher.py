from app.imap.fetcher import fetch_latest_emails

def test_fetch_latest_emails():
    emails = fetch_latest_emails(limit=1)
    assert isinstance(emails, list) 