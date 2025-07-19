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
            domain = parsed.hostname or ""
            is_punycode = domain.startswith('xn--')
            
            # Berechne Risk Score basierend auf verschiedenen Faktoren
            risk_score = 0
            if is_punycode:
                risk_score += 50
            if not domain:
                risk_score += 30
            if len(domain) > 50:  # Sehr lange Domains sind verdächtig
                risk_score += 20
            if domain.count('.') > 3:  # Viele Subdomains
                risk_score += 15
                
            results.append({
                "url": link,
                "domain": domain,
                "is_punycode": is_punycode,
                "risk_score": min(100, risk_score)
            })
        except Exception as e:
            logger.warning("Fehler bei der Link-Analyse für %s: %s", link, e)
    return results 