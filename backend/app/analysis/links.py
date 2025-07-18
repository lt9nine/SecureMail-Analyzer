import re
from urllib.parse import urlparse
from typing import List, Dict
from app.core.config import logger

def extract_links(email_text: str) -> List[str]:
    """
    Extrahiert alle URLs aus dem E-Mail-Text.
    """
    url_regex = r"https?://[\w\.-/?&=%#]+"
    try:
        links = re.findall(url_regex, email_text)
        return links
    except Exception as e:
        logger.error("Fehler beim Extrahieren von Links: %s", e)
        return []

def analyze_links(links: List[str]) -> List[Dict[str, object]]:
    """
    Analysiert Links auf Punycode und gibt eine Liste von Link-Infos zurück.
    """
    results = []
    for link in links:
        try:
            parsed = urlparse(link)
            is_punycode = parsed.hostname and parsed.hostname.startswith('xn--')
            results.append({
                "url": link,
                "punycode": is_punycode
            })
        except Exception as e:
            logger.warning("Fehler bei der Link-Analyse für %s: %s", link, e)
    return results 