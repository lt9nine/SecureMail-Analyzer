# content.py
# GPT-/KI-Analyse 
import httpx
from app.core import config

PROMPT = (
    "Du bist ein E-Mail-Sicherheitsanalyst. Analysiere die folgende E-Mail und gib eine Bewertung zurück, ob es sich um Phishing, Spam oder eine legitime Mail handelt. "
    "Berücksichtige dabei auch die Sprache (z.B. Drohungen, Dringlichkeit, psychologische Tricks), die enthaltenen Links (z.B. Punycode, verdächtige Domains) und die Header-Informationen (SPF, DKIM, DMARC). "
    "Gib die wichtigsten Gründe für deine Einschätzung an. Gib die Ausgabe in JSON zurück: {\"bewertung\": \"Phishing\" | \"Spam\" | \"Legitim\", \"risikostufe\": \"hoch\" | \"mittel\" | \"niedrig\", \"score\": 0–100, \"gruende\": [ ... ]}"
)

def build_context(email_text, headers=None, links=None):
    context = email_text
    if headers:
        context += f"\n\nHeader-Infos: {headers}"
    if links:
        context += f"\n\nLinks: {links}"
    return context

async def analyze_email_content(email_text: str, headers=None, links=None):
    headers_ = {"Authorization": f"Bearer {config.OPENROUTER_API_KEY}"}
    payload = {
        "model": "openai/gpt-3.5-turbo",  # oder ein anderes Modell
        "messages": [
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": build_context(email_text, headers, links)},
        ],
        "max_tokens": 512,
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(base_url="https://openrouter.ai/api/v1/") as client:
        response = await client.post("chat/completions", json=payload, headers=headers_, timeout=30)
        response.raise_for_status()
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        return content 