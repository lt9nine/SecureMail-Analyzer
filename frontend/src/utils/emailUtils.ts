/**
 * Utility functions for email processing
 */

export function cleanEmailAddress(emailAddr: string): string {
  if (!emailAddr) return "";
  
  try {
    // Remove HTML entities
    let cleaned = emailAddr
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
    
    // Decode Unicode escape sequences
    cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // Remove extra quotes and brackets
    cleaned = cleaned.replace(/^["']+|["']+$/g, ''); // Quotes at start/end
    cleaned = cleaned.replace(/^<+|>+$/g, ''); // Angle brackets at start/end
    
    return cleaned.trim();
  } catch (error) {
    console.warn('Error cleaning email address:', error);
    return emailAddr;
  }
}

export function extractEmailFromString(emailString: string): string {
  if (!emailString) return "";
  
  // Try to extract email from "Name <email@domain.com>" format
  const emailMatch = emailString.match(/<([^>]+)>/);
  if (emailMatch) {
    return cleanEmailAddress(emailMatch[1]);
  }
  
  // If no angle brackets, try to find email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = emailString.match(emailPattern);
  if (match) {
    return cleanEmailAddress(match[0]);
  }
  
  // Fallback: clean the entire string
  return cleanEmailAddress(emailString);
} 