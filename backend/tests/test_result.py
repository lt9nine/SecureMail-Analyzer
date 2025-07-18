from app.analysis.result import parse_analysis_result

def test_parse_analysis_result_valid():
    gpt_json = '{"bewertung": "Phishing", "risikostufe": "hoch", "score": 99, "gruende": ["Test"]}'
    result = parse_analysis_result(gpt_json)
    assert result["bewertung"] == "Phishing"
    assert result["risikostufe"] == "hoch"
    assert result["score"] == 99
    assert isinstance(result["gruende"], list)

def test_parse_analysis_result_invalid():
    gpt_json = 'Ungültiges JSON'
    result = parse_analysis_result(gpt_json)
    assert "error" in result 