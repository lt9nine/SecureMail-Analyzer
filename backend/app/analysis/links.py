import re
from urllib.parse import urlparse

def extract_links(email_text):
    # Finde alle URLs im Text
    url_regex = r"https?://[\w\.-/?&=%#]+"
    links = re.findall(url_regex, email_text)
    return links

def analyze_links(links):
    results = []
    for link in links:
        parsed = urlparse(link)
        # Prüfe auf Punycode (xn--)
        is_punycode = parsed.hostname and parsed.hostname.startswith('xn--')
        results.append({
            "url": link,
            "punycode": is_punycode
        })
    return results 