import time
from typing import Dict, Tuple
from collections import defaultdict
from app.core.config import logger

class RateLimiter:
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = defaultdict(list)
    
    def is_allowed(self, client_id: str) -> bool:
        """Prüft, ob ein Client noch Anfragen senden darf."""
        now = time.time()
        # Entferne alte Anfragen außerhalb des Zeitfensters
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if now - req_time < self.window_seconds
        ]
        
        # Prüfe, ob das Limit überschritten wurde
        if len(self.requests[client_id]) >= self.max_requests:
            logger.warning("Rate limit exceeded for client %s", client_id)
            return False
        
        # Füge aktuelle Anfrage hinzu
        self.requests[client_id].append(now)
        return True
    
    def get_remaining_requests(self, client_id: str) -> int:
        """Gibt die verbleibenden Anfragen für einen Client zurück."""
        now = time.time()
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if now - req_time < self.window_seconds
        ]
        return max(0, self.max_requests - len(self.requests[client_id]))

# Globale Rate-Limiter-Instanz
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

def get_client_id(request) -> str:
    """Extrahiert eine Client-ID aus der Request."""
    # Verwende IP-Adresse als Client-ID (vereinfacht)
    return request.client.host if request.client else "unknown" 