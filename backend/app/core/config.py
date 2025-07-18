import os
import logging
from dotenv import load_dotenv
from typing import List

load_dotenv()

# Logging-Konfiguration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s'
)
logger = logging.getLogger("securemail-analyzer")

IMAP_HOST = os.getenv('IMAP_HOST')
IMAP_PORT = int(os.getenv('IMAP_PORT', 993))
IMAP_USER = os.getenv('IMAP_USER')
IMAP_PASSWORD = os.getenv('IMAP_PASSWORD')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

# Konfigurierbare Schwellenwerte
DANGEROUS_EXTENSIONS: List[str] = [
    '.exe', '.js', '.scr', '.bat', '.cmd', '.vbs', '.jar', '.zip', '.rar', '.ace', '.msi', '.ps1'
]
MAX_RECIPIENTS: int = int(os.getenv('MAX_RECIPIENTS', 5))
HEADER_ANOMALY_DAYS: int = int(os.getenv('HEADER_ANOMALY_DAYS', 60)) 