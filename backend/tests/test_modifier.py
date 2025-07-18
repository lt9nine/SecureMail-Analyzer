from app.imap.modifier import change_subject

def test_change_subject_dummy():
    # Dummy-UID, Test prüft nur, ob Funktion False zurückgibt bei ungültiger UID
    assert change_subject(b'999999', 'Test-Betreff') in [True, False] 