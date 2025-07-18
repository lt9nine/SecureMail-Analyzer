# result.py
# Risikobewertung & Scoring 
import json

def parse_analysis_result(gpt_response: str):
    try:
        result = json.loads(gpt_response)
        return result
    except Exception as e:
        return {"error": "Invalid JSON from GPT", "raw": gpt_response, "exception": str(e)} 

def combine_results(header_result, link_result, ai_result):
    """
    Kombiniert die Ergebnisse zu einem Gesamtscore und einer Risikostufe.
    Einfache Gewichtung:
      - KI-Score: 60%
      - Header: 20%
      - Links: 20%
    Zusätzliche Abzüge für gefährliche Anhänge, Anomalien, viele Empfänger, Tracking-Pixel.
    """
    # KI-Score
    ai_score = ai_result.get("score", 0)
    # Header-Checks
    header_score = 0
    if header_result.get("spf", "").lower().startswith("pass"):
        header_score += 10
    if header_result.get("dkim", "") == "vorhanden":
        header_score += 5
    if header_result.get("dmarc", "") == "pass":
        header_score += 5
    # Links: Punycode oder viele Links = Risiko
    link_score = 0
    if any(l.get("punycode") for l in link_result):
        link_score -= 10
    if len(link_result) > 3:
        link_score -= 5
    # Zusätzliche Checks
    penalty = 0
    # Gefährliche Anhänge
    if header_result.get("dangerous_attachments"):
        penalty -= 20 * len(header_result["dangerous_attachments"])
    # Verschlüsselte Anhänge
    if header_result.get("encrypted_attachments"):
        penalty -= 10 * len(header_result["encrypted_attachments"])
    # Header-Anomalien
    if header_result.get("header_anomalies"):
        penalty -= 10 * len(header_result["header_anomalies"])
    # Viele Empfänger
    if header_result.get("recipient_warning") and header_result["recipient_warning"] != "ok":
        penalty -= 10
    # Tracking-Pixel
    if header_result.get("tracking_pixels"):
        penalty -= 5 * len(header_result["tracking_pixels"])
    # Kombiniere
    final_score = int(0.6 * ai_score + 0.2 * header_score + 0.2 * (100 + link_score) + penalty)
    # Clamp
    final_score = max(0, min(100, final_score))
    # Risikostufe
    if final_score >= 80:
        risk = "hoch"
    elif final_score >= 50:
        risk = "mittel"
    else:
        risk = "niedrig"
    return {"score": final_score, "risikostufe": risk} 