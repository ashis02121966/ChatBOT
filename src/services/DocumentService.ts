export class DocumentService {
  private baseUrl: string;

  constructor() {
    // Detect WebContainer environment and construct proper server URL
    const currentOrigin = window.location.origin;
    console.log('Current origin:', currentOrigin);
    
    // Check for WebContainer environment
    if (currentOrigin.includes('webcontainer-api.io')) {
      // WebContainer environment - construct server URL
      // URL format: https://something--5173--something.webcontainer-api.io
      // Server URL: https://something--3001--something.webcontainer-api.io
      this.baseUrl = currentOrigin.replace(/--5173--/, '--3001--');
      console.log(`WebContainer server URL: ${this.baseUrl}`);
    } else if (import.meta.env.VITE_SERVER_URL) {
      // Use environment variable if available
      this.baseUrl = import.meta.env.VITE_SERVER_URL;
      console.log(`Using environment server URL: ${this.baseUrl}`);
    } else {
      // Local development - use empty string for relative paths (handled by Vite proxy)
      this.baseUrl = '';
      console.log('Using local development mode with proxy');
    }
  }

  async processDocument(file: File, surveyId: string): Promise<any> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('surveyId', surveyId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    try {
      console.log(`Sending document ${file.name} to server for processing...`);
      
      const response = await fetch(`${this.baseUrl || ''}/api/process-document`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Document processing failed');
      }

      console.log(`Document ${file.name} processed successfully on server`);
      return result.data;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Document service error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Document processing timed out. Please try again or check if the server is running.');
      }
      
      // Check if it's a network error (TypeError is commonly thrown by fetch for network issues)
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'))) {
        throw new Error('Unable to connect to document processing server. Please check if the server is running.');
      }
      
      throw error;
    }
  }

  async processDocuments(files: File[], surveyId: string): Promise<any> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('documents', file);
    });
    formData.append('surveyId', surveyId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout for batch processing

    try {
      console.log(`Sending ${files.length} documents to server for batch processing...`);
      
      const response = await fetch(`${this.baseUrl || ''}/api/process-documents`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Batch document processing failed');
      }

      console.log(`Batch processing completed: ${result.data.summary.successful}/${result.data.summary.total} successful`);
      return result.data;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Batch document service error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Batch processing timed out. Please try again or check if the server is running.');
      }
      
      // Check if it's a network error (TypeError is commonly thrown by fetch for network issues)
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'))) {
        throw new Error('Unable to connect to document processing server. Please check if the server is running.');
      }
      
      throw error;
    }
  }

  async extractText(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('document', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

    try {
      const response = await fetch(`${this.baseUrl || ''}/api/extract-text`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Text extraction failed');
      }

      return result.data.text;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Text extraction service error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Text extraction timed out. Please try again or check if the server is running.');
      }
      
      // Check if it's a network error (TypeError is commonly thrown by fetch for network issues)
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'))) {
        throw new Error('Unable to connect to document processing server. Please check if the server is running.');
      }
      
      throw error;
    }
  }

  async checkServerHealth(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
    
    try {
      const healthUrl = `${this.baseUrl || ''}/api/health`;
      console.log('Making health check request to:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('Health check failed with status:', response.status);
        return false;
      }
      
      const result = await response.json();
      console.log('Health check response:', result);
      return result.success === true || result.status === 'healthy';
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Server health check failed:', error);
      return false;
    }
  }

  async getSurveys(): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${this.baseUrl || ''}/api/surveys`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch surveys');
      }

      return result.data;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Get surveys error:', error);
      throw error;
    }
  }

  async sendChatMessage(message: string, surveyId: string, userId: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(`${this.baseUrl || ''}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          surveyId,
          userId
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Chat request failed');
      }

      return result.data;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Chat message error:', error);
      throw error;
    }
  }

  getServerUrl(): string {
    return this.baseUrl;
  }
}