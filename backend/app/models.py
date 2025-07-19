from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class HeaderAnalysis(BaseModel):
    spf: str
    dkim: str
    dmarc: str
    from_domain: str
    from_lookalike: str
    reply_to: str
    return_path: str
    reply_path_warning: str
    attachments: List[str]
    dangerous_attachments: List[str]
    encrypted_attachments: List[str]
    to_count: int
    cc_count: int
    bcc_count: int
    recipient_warning: str
    header_anomalies: List[str]
    external_images: List[str]
    tracking_pixels: List[str]

class LinkAnalysis(BaseModel):
    url: str
    punycode: bool

class AIAnalysis(BaseModel):
    bewertung: str
    risikostufe: str
    score: int
    gruende: List[str]

class FinalScore(BaseModel):
    score: int
    risikostufe: str

class EmailAnalysis(BaseModel):
    uid: str
    subject: str
    from_addr: str  # Direktes Feld ohne Alias
    headers: HeaderAnalysis
    links: List[LinkAnalysis]
    analysis: AIAnalysis
    final: FinalScore

class AnalysisResponse(BaseModel):
    results: List[EmailAnalysis]

class ModifySubjectRequest(BaseModel):
    uid: str = Field(..., description="UID der zu ändernden E-Mail")
    risk: str = Field(..., description="Risikostufe: hoch, mittel, niedrig")

class ModifySubjectResponse(BaseModel):
    success: bool
    new_subject: Optional[str] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    services: Dict[str, str]

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None 