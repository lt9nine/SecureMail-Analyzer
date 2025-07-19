import { EmailAnalysis } from '../types/api';

export interface EmailStats {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  averageScore: number;
  topThreats: Array<{ threat: string; count: number }>;
  riskTrend: Array<{ date: string; score: number }>;
}

class StatsService {
  private baseUrl = 'http://localhost:8000';

  async getEmailStats(): Promise<EmailStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching email stats:', error);
      // Return mock data for development
      return this.getMockStats();
    }
  }

  async getStatsFromEmails(emails: EmailAnalysis[]): Promise<EmailStats> {
    if (emails.length === 0) {
      return {
        total: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        averageScore: 0,
        topThreats: [],
        riskTrend: []
      };
    }

    // Calculate risk distribution based on FINAL scores only
    const highRisk = emails.filter(email => 
      email.final.risikostufe === 'hoch'
    ).length;
    
    const mediumRisk = emails.filter(email => 
      email.final.risikostufe === 'mittel'
    ).length;
    
    const lowRisk = emails.filter(email => 
      email.final.risikostufe === 'niedrig'
    ).length;

    // Calculate average score
    const totalScore = emails.reduce((sum, email) => sum + email.final.score, 0);
    const averageScore = totalScore / emails.length;

    // Extract top threats from AI analysis
    const threatCounts: { [key: string]: number } = {};
    emails.forEach(email => {
      email.analysis.gruende.forEach((grund: string) => {
        // Extract threat type from reason
        const threat = this.extractThreatType(grund);
        if (threat) {
          threatCounts[threat] = (threatCounts[threat] || 0) + 1;
        }
      });
    });

    const topThreats = Object.entries(threatCounts)
      .map(([threat, count]) => ({ threat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate mock trend data (7 days)
    const riskTrend = this.generateTrendData(emails);

    return {
      total: emails.length,
      highRisk,
      mediumRisk,
      lowRisk,
      averageScore,
      topThreats,
      riskTrend
    };
  }

  private extractThreatType(grund: string): string {
    const threatPatterns = [
      { pattern: /phishing/i, name: 'Phishing' },
      { pattern: /spam/i, name: 'Spam' },
      { pattern: /malware/i, name: 'Malware' },
      { pattern: /ransomware/i, name: 'Ransomware' },
      { pattern: /betrug/i, name: 'Betrug' },
      { pattern: /datenklau/i, name: 'Datenklau' },
      { pattern: /social engineering/i, name: 'Social Engineering' },
      { pattern: /lookalike/i, name: 'Lookalike Domain' },
      { pattern: /spf/i, name: 'SPF Fehler' },
      { pattern: /dkim/i, name: 'DKIM Fehler' },
      { pattern: /dmarc/i, name: 'DMARC Fehler' },
      { pattern: /anhang/i, name: 'Gefährlicher Anhang' },
      { pattern: /link/i, name: 'Gefährlicher Link' },
      { pattern: /geld/i, name: 'Geldanfrage' },
      { pattern: /druck/i, name: 'Druckausübung' }
    ];

    for (const { pattern, name } of threatPatterns) {
      if (pattern.test(grund)) {
        return name;
      }
    }

    return 'Sonstige Bedrohung';
  }

  private generateTrendData(emails: EmailAnalysis[]): Array<{ date: string; score: number }> {
    const trend = [];
    const today = new Date();
    
    // If we have emails, show actual data
    if (emails.length > 0) {
      // For now, show the same average score for all days since we don't have daily data
      const averageScore = emails.reduce((sum, email) => sum + email.final.score, 0) / emails.length;
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        trend.push({
          date: date.toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          score: Math.round(averageScore)
        });
      }
    } else {
      // If no emails, show empty trend
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        trend.push({
          date: date.toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          score: 0
        });
      }
    }
    
    return trend;
  }

  private getMockStats(): EmailStats {
    return {
      total: 42,
      highRisk: 8,
      mediumRisk: 15,
      lowRisk: 19,
      averageScore: 58,
      topThreats: [
        { threat: 'Phishing', count: 12 },
        { threat: 'Lookalike Domain', count: 8 },
        { threat: 'SPF Fehler', count: 6 },
        { threat: 'Gefährlicher Link', count: 5 },
        { threat: 'Social Engineering', count: 4 },
        { threat: 'Geldanfrage', count: 3 },
        { threat: 'Betrug', count: 2 },
        { threat: 'Malware', count: 2 }
      ],
      riskTrend: [
        { date: '01.12', score: 45 },
        { date: '02.12', score: 52 },
        { date: '03.12', score: 38 },
        { date: '04.12', score: 67 },
        { date: '05.12', score: 41 },
        { date: '06.12', score: 58 },
        { date: '07.12', score: 62 }
      ]
    };
  }
}

export const statsService = new StatsService(); 