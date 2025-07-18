import pytest
import asyncio
from app.analysis.content import analyze_email_content

@pytest.mark.asyncio
async def test_analyze_email_content():
    dummy_text = "Dies ist eine Testmail."
    result = await analyze_email_content(dummy_text)
    assert isinstance(result, str) 