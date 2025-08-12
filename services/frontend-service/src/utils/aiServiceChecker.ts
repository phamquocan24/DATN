// AI Service Health Checker Utility

export interface AIServiceStatus {
  isAvailable: boolean;
  status: string;
  message: string;
  lastChecked: Date;
}

class AIServiceChecker {
  private static instance: AIServiceChecker;
  private lastCheck: Date | null = null;
  private lastStatus: AIServiceStatus | null = null;
  private checkInterval = 30000; // 30 seconds cache

  static getInstance(): AIServiceChecker {
    if (!AIServiceChecker.instance) {
      AIServiceChecker.instance = new AIServiceChecker();
    }
    return AIServiceChecker.instance;
  }

  async checkService(force: boolean = false): Promise<AIServiceStatus> {
    // Use cached result if recent and not forced
    if (!force && this.lastStatus && this.lastCheck) {
      const timeSinceCheck = Date.now() - this.lastCheck.getTime();
      if (timeSinceCheck < this.checkInterval) {
        return this.lastStatus;
      }
    }

    const now = new Date();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('http://localhost:8002/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.lastStatus = {
          isAvailable: true,
          status: 'online',
          message: 'AI service is running and healthy',
          lastChecked: now
        };
      } else {
        this.lastStatus = {
          isAvailable: false,
          status: 'error',
          message: `AI service returned ${response.status}: ${response.statusText}`,
          lastChecked: now
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.lastStatus = {
          isAvailable: false,
          status: 'timeout',
          message: 'AI service health check timed out (5s)',
          lastChecked: now
        };
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        this.lastStatus = {
          isAvailable: false,
          status: 'offline',
          message: 'Cannot connect to AI service at localhost:8002',
          lastChecked: now
        };
      } else {
        this.lastStatus = {
          isAvailable: false,
          status: 'error',
          message: `Health check failed: ${error.message}`,
          lastChecked: now
        };
      }
    }

    this.lastCheck = now;
    return this.lastStatus;
  }

  async isServiceAvailable(): Promise<boolean> {
    const status = await this.checkService();
    return status.isAvailable;
  }

  getLastStatus(): AIServiceStatus | null {
    return this.lastStatus;
  }

  // Get user-friendly setup instructions
  getSetupInstructions(): string {
    return `
🔧 AI Service Setup Instructions:

1. Navigate to AI service directory:
   cd services/ai-service/generating-and-evaluating-questions-for-test

2. Install dependencies:
   pip install -r requirements.txt

3. Start the service:
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload

4. Verify service is running:
   Open http://localhost:8002/docs in your browser

Alternative quick start:
   cd services/ai-service/generating-and-evaluating-questions-for-test
   python app/main.py

The service should be accessible at:
• Health check: http://localhost:8002/health
• API docs: http://localhost:8002/docs
• Generate questions: http://localhost:8002/api/v1/ai/generate-interview-questions
`;
  }

  // Create a comprehensive error message with troubleshooting
  createErrorMessage(error: any): string {
    const status = this.getLastStatus();
    
    let message = '❌ AI Question Generation Failed\n\n';
    
    if (status) {
      switch (status.status) {
        case 'offline':
          message += '🔧 AI Service Not Running\n\n';
          message += 'The AI service at localhost:8002 is not accessible.\n\n';
          message += 'Quick Start:\n';
          message += '1. Open terminal in project root\n';
          message += '2. cd services/ai-service/generating-and-evaluating-questions-for-test\n';
          message += '3. python -m uvicorn app.main:app --port 8002 --reload\n\n';
          break;
          
        case 'timeout':
          message += '⏱️ Connection Timeout\n\n';
          message += 'The AI service is taking too long to respond.\n';
          message += 'This might indicate the service is overloaded or starting up.\n\n';
          message += 'Try:\n';
          message += '• Wait a moment and try again\n';
          message += '• Check AI service logs for errors\n';
          message += '• Restart the AI service\n\n';
          break;
          
        case 'error':
          message += '⚠️ AI Service Error\n\n';
          message += `Service Status: ${status.message}\n\n`;
          message += 'The AI service is running but encountered an error.\n';
          message += 'Check the AI service logs for details.\n\n';
          break;
          
        default:
          message += '❓ Unknown Error\n\n';
          message += `Error: ${error.message || 'Unknown error'}\n\n`;
      }
    } else {
      message += `Error: ${error.message || 'Unknown error'}\n\n`;
    }
    
    message += '💡 You can continue creating questions manually.\n';
    message += 'Click "Add New Question" below to add questions by hand.';
    
    return message;
  }
}

export default AIServiceChecker.getInstance();
