import { pipeline, Pipeline, env } from '@xenova/transformers';

// Configure transformers environment
env.allowRemoteModels = true;
env.workerSrc = '/node_modules/@xenova/transformers/dist/worker.min.js';

export class SLMService {
  private textGenerator: Pipeline | null = null;
  private questionAnswerer: Pipeline | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void>;
  private initializationError: string | null = null;
  private networkError = false;
  private knowledgeBase: Map<string, string>;
  private documentKnowledge: Map<string, string> = new Map();
  private documentChunks: Array<{id: string, content: string, metadata: any}> = [];

  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.initializationPromise = this.initialize();
  }

  private async initialize() {
    try {
      console.log('Initializing SLM models...');
      
      // Test network connectivity first
      try {
        const testResponse = await fetch('https://huggingface.co/api/models/distilbert-base-uncased', {
          method: 'HEAD',
          mode: 'no-cors'
        });
      } catch (networkError) {
        console.warn('Network connectivity issue detected:', networkError);
        this.networkError = true;
        this.initializationError = 'Network connectivity issue - unable to reach Hugging Face servers';
        this.isInitialized = false;
        return;
      }

      // Set a shorter timeout for model loading
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model loading timeout - this may be due to network issues')), 20000)
      );

      // Initialize question-answering model first (more reliable)
      try {
        this.questionAnswerer = await Promise.race([
          pipeline(
            'question-answering',
            'Xenova/distilbert-base-uncased-distilled-squad',
            { 
              revision: 'main',
              quantized: true,
              cache_dir: './.cache/transformers',
              progress_callback: (progress) => {
                if (progress.status === 'downloading') {
                  console.log(`Downloading QA model: ${Math.round(progress.progress || 0)}%`);
                } else if (progress.status === 'loading') {
                  console.log('Loading QA model into memory...');
                }
              }
            }
          ),
          timeout
        ]);
        console.log('Question-answering model loaded successfully');
      } catch (qaError) {
        console.warn('Failed to load question-answering model:', qaError);
        if (qaError.message.includes('<!doctype') || qaError.message.includes('Unexpected token')) {
          this.networkError = true;
          this.initializationError = 'Network error: Unable to download AI models from Hugging Face';
        } else {
          this.initializationError = `QA model failed: ${qaError.message}`;
        }
      }

      // Try a smaller, more reliable text generation model
      try {
        this.textGenerator = await Promise.race([
          pipeline(
            'text-generation',
            'Xenova/gpt2',
            { 
              revision: 'main',
              quantized: true,
              cache_dir: './.cache/transformers',
              progress_callback: (progress) => {
                if (progress.status === 'downloading') {
                  console.log(`Downloading text model: ${Math.round(progress.progress || 0)}%`);
                } else if (progress.status === 'loading') {
                  console.log('Loading text generation model into memory...');
                }
              }
            }
          ),
          timeout
        ]);
        console.log('Text generation model loaded successfully');
      } catch (tgError) {
        console.warn('Failed to load text generation model:', tgError);
        if (tgError.message.includes('<!doctype') || tgError.message.includes('Unexpected token')) {
          this.networkError = true;
          if (!this.initializationError) {
            this.initializationError = 'Network error: Unable to download AI models from Hugging Face';
          }
        } else {
          if (this.initializationError) {
            this.initializationError += ` | Text model failed: ${tgError.message}`;
          } else {
            this.initializationError = `Text model failed: ${tgError.message}`;
          }
        }
      }

      // If we have network errors, don't try to initialize
      if (this.networkError) {
        this.isInitialized = false;
        console.log('SLM initialization failed due to network connectivity issues');
        return;
      }

      // Consider initialized if at least one model loaded
      this.isInitialized = this.questionAnswerer !== null || this.textGenerator !== null;
      
      if (!this.isInitialized) {
        console.error(`All models failed to load. ${this.initializationError}`);
        // Don't throw error, just log it and continue with fallback
      }
      
      if (this.isInitialized) {
        console.log('SLM models initialized successfully');
      } else {
        console.log('SLM models failed to initialize, using intelligent fallback system');
      }
    } catch (error) {
      console.error('Failed to initialize SLM models:', error);
      this.isInitialized = false;
      if (error.message.includes('<!doctype') || error.message.includes('Unexpected token')) {
        this.networkError = true;
        this.initializationError = 'Network error: Unable to download AI models from Hugging Face';
      } else {
        this.initializationError = error.message;
      }
    }
  }

  // Method to update SLM with uploaded document content
  updateDocumentKnowledge(documents: Array<{id: string, fileName: string, content: string, chunks: any[]}>) {
    console.log(`🧠 Updating SLM knowledge base with ${documents.length} documents and visual context`);
    
    // Clear existing document knowledge
    this.documentKnowledge.clear();
    this.documentChunks = [];
    
    let totalImages = 0;
    
    documents.forEach(doc => {
      // Store full document content
      this.documentKnowledge.set(doc.fileName.toLowerCase(), doc.content);
      
      // Count images for this document
      const docImages = doc.images || [];
      totalImages += docImages.length;
      
      // Store document chunks for detailed search
      doc.chunks.forEach(chunk => {
        this.documentChunks.push({
          id: chunk.id,
          content: chunk.content,
          metadata: {
            ...chunk.metadata,
            fileName: doc.fileName,
            documentId: doc.id,
            hasVisualContext: docImages.length > 0,
            imageCount: docImages.length,
            visualTypes: docImages.map(img => img.type)
          }
        });
      });
    });
    
    console.log(`🧠 SLM knowledge updated: ${this.documentKnowledge.size} documents, ${this.documentChunks.length} chunks, ${totalImages} visual references`);
    console.log(`📊 Visual context available: ${this.documentChunks.filter(chunk => chunk.metadata.hasVisualContext).length} chunks with images`);
  }

  // Enhanced search within uploaded documents
  private searchDocumentKnowledge(query: string): { content: string; type: string; score: number } | null {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    // Score all chunks and categorize them
    const allMatches: Array<{ content: string; score: number; type: string; source: string }> = [];
    
    this.documentChunks.forEach(chunk => {
      const score = this.calculateUnifiedScore(chunk, queryWords, queryLower);
      
      if (score > 10) { // Minimum threshold
        let content = '';
        let type = '';
        
        if (chunk.metadata.isAdminAnswer && chunk.metadata.adminAnswer) {
          content = chunk.metadata.adminAnswer;
          type = 'admin-answer';
        } else {
          content = this.extractRelevantContent(chunk.content, queryWords, queryLower);
          type = 'document-context';
        }
        
        allMatches.push({
          content,
          score,
          type,
          source: chunk.metadata.fileName || 'Unknown'
        });
      }
    });
    
    if (allMatches.length === 0) {
      return null;
    }
    
    // Sort by score and return the best match
    allMatches.sort((a, b) => b.score - a.score);
    const bestMatch = allMatches[0];
    
    console.log(`SLM best match: ${bestMatch.type} from ${bestMatch.source} with score ${bestMatch.score}`);
    
    return {
      content: bestMatch.content,
      type: bestMatch.type,
      score: bestMatch.score
    };
  };
  
  // New unified scoring method for SLM
  private calculateUnifiedScore(chunk: any, queryWords: string[], fullQuery: string): number {
    let score = 0;
    const chunkText = chunk.content.toLowerCase();
    
    // Admin answer specific scoring
    if (chunk.metadata.isAdminAnswer) {
      let adminScore = 0;
      
      if (chunk.metadata.originalQuestion) {
        const originalQ = chunk.metadata.originalQuestion.toLowerCase();
        
        // Exact phrase matching
        if (originalQ.includes(fullQuery)) {
          adminScore += 300;
        }
        
        // Semantic similarity
        const originalWords = originalQ.split(/\s+/).filter(word => word.length > 2);
        const commonWords = queryWords.filter(word => originalWords.includes(word));
        const similarity = commonWords.length / Math.max(queryWords.length, originalWords.length);
        
        if (similarity > 0.7) {
          adminScore += 200;
        } else if (similarity > 0.5) {
          adminScore += 150;
        } else if (similarity > 0.3) {
          adminScore += 100;
        }
        
        // Question type matching
        const queryType = this.getQuestionType(fullQuery);
        const originalType = this.getQuestionType(originalQ);
        if (queryType === originalType && queryType !== 'general') {
          adminScore += 80;
        }
        
        // Individual word matches
        queryWords.forEach(word => {
          if (originalQ.includes(word)) {
            adminScore += 40;
          }
        });
      }
      
      // Answer content scoring
      if (chunk.metadata.adminAnswer) {
        const adminAnswer = chunk.metadata.adminAnswer.toLowerCase();
        
        if (adminAnswer.includes(fullQuery)) {
          adminScore += 150;
        }
        
        queryWords.forEach(word => {
          if (adminAnswer.includes(word)) {
            adminScore += 25;
          }
        });
      }
      
      score += adminScore;
    }
    
    // General content scoring
    if (chunkText.includes(fullQuery)) {
      score += 100;
    }
    
    // Multi-word phrases
    if (queryWords.length > 1) {
      for (let i = 0; i < queryWords.length - 1; i++) {
        const phrase = queryWords.slice(i, i + 2).join(' ');
        if (chunkText.includes(phrase)) {
          score += 50;
        }
      }
    }
    
    // Individual words
    queryWords.forEach(word => {
      const matches = (chunkText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      score += matches * 15;
    });
    
    // Keywords
    if (chunk.metadata.keywords) {
      chunk.metadata.keywords.forEach(keyword => {
        if (queryWords.some(word => keyword.includes(word))) {
          score += 20;
        }
      });
    }
    
    return score;
  };
  
  // Extract relevant content from document chunks
  private extractRelevantContent(content: string, queryWords: string[], fullQuery: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Score sentences by relevance
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      const sentenceLower = sentence.toLowerCase();
      
      if (sentenceLower.includes(fullQuery)) {
        score += 100;
      }
      
      queryWords.forEach(word => {
        if (sentenceLower.includes(word)) {
          score += 20;
        }
      });
      
      return { sentence: sentence.trim(), score };
    }).filter(item => item.score > 0);
    
    if (scoredSentences.length === 0) {
      return content.substring(0, 200) + '...';
    }
    
    // Return top 2 most relevant sentences
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(item => item.sentence)
      .join('. ') + '.';
  }

  // New method to calculate admin answer relevance more precisely
  private calculateAdminAnswerRelevance(queryLower: string, queryWords: string[], chunk: any): number {
    let score = 0;
    
    if (!chunk.metadata.originalQuestion || !chunk.metadata.adminAnswer) {
      return 0;
    }
    
    const originalQuestion = chunk.metadata.originalQuestion.toLowerCase();
    const adminAnswer = chunk.metadata.adminAnswer.toLowerCase();
    
    // EXACT PHRASE MATCHING (highest priority)
    if (originalQuestion.includes(queryLower)) {
      score += 200; // Very high score for exact phrase match
    }
    
    // SEMANTIC SIMILARITY - check if questions are asking about the same thing
    const questionWords = originalQuestion.split(/\s+/).filter(word => word.length > 2);
    const commonWords = queryWords.filter(word => questionWords.includes(word));
    const semanticSimilarity = commonWords.length / Math.max(queryWords.length, questionWords.length);
    
    if (semanticSimilarity > 0.6) {
      score += 150; // High score for semantic similarity
    } else if (semanticSimilarity > 0.4) {
      score += 100; // Medium score for partial similarity
    } else if (semanticSimilarity > 0.2) {
      score += 50; // Low score for minimal similarity
    }
    
    // QUESTION TYPE MATCHING - ensure similar question types
    const queryType = this.getQuestionType(queryLower);
    const originalType = this.getQuestionType(originalQuestion);
    
    if (queryType === originalType && queryType !== 'general') {
      score += 75; // Bonus for same question type
    }
    
    // KEYWORD DENSITY - check how many query words appear in original question
    let keywordMatches = 0;
    queryWords.forEach(word => {
      if (originalQuestion.includes(word)) {
        keywordMatches++;
        score += 25;
      }
    });
    
    // CONTEXT RELEVANCE - check if the admin answer contains relevant terms
    const contextRelevance = queryWords.filter(word => adminAnswer.includes(word)).length;
    score += contextRelevance * 10;
    
    // PENALTY for very different question lengths (might indicate different contexts)
    const lengthDifference = Math.abs(queryWords.length - questionWords.length);
    if (lengthDifference > 5) {
      score -= 20;
    }
    
    console.log(`Admin answer relevance for "${originalQuestion}" vs "${queryLower}": ${score} (semantic: ${semanticSimilarity.toFixed(2)}, type match: ${queryType === originalType})`);
    
    return Math.max(0, score);
  }
  
  // Helper method to determine question type
  private getQuestionType(question: string): string {
    if (question.includes('what is') || question.includes('what are') || question.includes('define')) {
      return 'definition';
    } else if (question.includes('how to') || question.includes('how do') || question.includes('how can')) {
      return 'procedure';
    } else if (question.includes('when') || question.includes('what time')) {
      return 'timing';
    } else if (question.includes('where') || question.includes('which location')) {
      return 'location';
    } else if (question.includes('why') || question.includes('what reason')) {
      return 'explanation';
    } else if (question.includes('who') || question.includes('which person')) {
      return 'person';
    } else if (question.includes('can i') || question.includes('should i') || question.includes('may i')) {
      return 'permission';
    }
    return 'general';
  }
  async generateResponse(query: string, context: string): Promise<string> {
    await this.initializationPromise;
    
    // First, search in uploaded document knowledge
    const documentMatch = this.searchDocumentKnowledge(query);
    if (documentMatch) {
      console.log(`Found relevant content in uploaded documents for: "${query}" (${documentMatch.type})`);
      
      // Format response based on type
      if (documentMatch.type === 'admin-answer') {
        return `${documentMatch.content}`;
      } else {
        return `Based on the survey documentation: ${documentMatch.content}`;
      }
    }
    
    // First check knowledge base for direct answers
    const directAnswer = this.searchKnowledgeBase(query);
    if (directAnswer) {
      return directAnswer;
    }

    // Then try to extract from context
    const contextualAnswer = this.generateIntelligentResponse(query, context);
    if (contextualAnswer) {
      return contextualAnswer;
    }

    // Final fallback
    return this.generateHelpfulFallback(query);
  }

  private generateDocumentBasedResponse(query: string, documentContext: string): string | null {
    if (!documentContext || documentContext.length < 50) {
      return null;
    }
    
    // Check if this is an admin answer response
    if (documentContext.startsWith('Admin Answer:')) {
      return documentContext;
    }
    
    const queryLower = query.toLowerCase();
    const sentences = documentContext.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Find most relevant sentences
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    const relevantSentences = sentences
      .map(sentence => ({
        text: sentence.trim(),
        score: this.calculateDocumentSentenceScore(sentence.toLowerCase(), queryWords, queryLower)
      }))
      .filter(item => item.score > 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    if (relevantSentences.length === 0) {
      return null;
    }
    
    // Create response based on query type
    const responseText = relevantSentences.map(item => item.text).join('. ');
    
    // Format response based on query type
    if (queryLower.includes('what is') || queryLower.includes('define')) {
      return `Based on the uploaded survey documents: ${responseText}.`;
    } else if (queryLower.includes('how to') || queryLower.includes('procedure')) {
      return `According to the survey procedures: ${responseText}.`;
    } else if (queryLower.includes('when') || queryLower.includes('timing')) {
      return `Regarding timing and scheduling: ${responseText}.`;
    } else if (queryLower.includes('where') || queryLower.includes('location')) {
      return `Location information from the documents: ${responseText}.`;
    } else if (queryLower.includes('why') || queryLower.includes('reason')) {
      return `The explanation provided in the documents: ${responseText}.`;
    } else {
      return `From the survey documentation: ${responseText}.`;
    }
  }
  
  private calculateDocumentSentenceScore(sentence: string, queryWords: string[], fullQuery: string): number {
    let score = 0;
    
    // Exact query match (highest priority)
    if (sentence.includes(fullQuery)) {
      score += 50;
    }
    
    // Individual word matches
    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = (sentence.match(regex) || []).length;
      score += matches * 8;
    });
    
    // Survey-specific term bonus
    const surveyTerms = ['capi', 'cati', 'cawi', 'survey', 'enumeration', 'questionnaire', 'respondent', 'interview'];
    surveyTerms.forEach(term => {
      if (sentence.includes(term) && queryWords.includes(term)) {
        score += 15;
      }
    });
    
    // Definition indicators
    if (/\b(is|are|means|refers to|defined as)\b/i.test(sentence)) {
      if (queryWords.some(word => ['what', 'define', 'meaning'].includes(word))) {
        score += 20;
      }
    }
    
    // Procedure indicators
    if (/\b(step|procedure|process|method|first|then|next)\b/i.test(sentence)) {
      if (queryWords.some(word => ['how', 'procedure', 'process', 'step'].includes(word))) {
        score += 20;
      }
    }
    
    return score;
  }

  async generateGeneralResponse(query: string): Promise<string | null> {
    // First check document knowledge
    const documentMatch = this.searchDocumentKnowledge(query);
    if (documentMatch) {
      if (documentMatch.type === 'admin-answer') {
        return documentMatch.content;
      } else {
        return `Based on the survey documentation: ${documentMatch.content}`;
      }
    }
    
    // Check knowledge base first
    const directAnswer = this.searchKnowledgeBase(query);
    if (directAnswer) {
      return directAnswer;
    }
    
    return this.generateHelpfulFallback(query);
  }

  private initializeKnowledgeBase(): Map<string, string> {
    const kb = new Map<string, string>();
    
    // Survey terminology
    kb.set('capi', 'CAPI stands for Computer Assisted Personal Interview. It is a data collection method where trained interviewers use electronic devices (tablets, laptops, or smartphones) to conduct face-to-face interviews with respondents. The system guides interviewers through the questionnaire, validates responses in real-time, and reduces data entry errors.');
    
    kb.set('cati', 'CATI stands for Computer Assisted Telephone Interview. It is a survey data collection method where interviewers conduct telephone interviews using specialized computer software. The system automatically dials phone numbers, presents questions to interviewers, and records responses directly into a database.');
    
    kb.set('cawi', 'CAWI stands for Computer Assisted Web Interview. It is a self-administered survey method where respondents complete questionnaires online through web browsers. This method allows for automated skip patterns, real-time validation, and multimedia content integration.');
    
    kb.set('papi', 'PAPI stands for Paper and Pencil Interview. It is a traditional data collection method where interviewers use printed questionnaires to record responses during face-to-face interviews. Data must be manually entered into computers later for analysis.');
    
    kb.set('enumeration', 'Enumeration is the systematic process of collecting data from all units in a survey sample. It involves visiting households or establishments, conducting interviews, and recording information according to survey protocols and procedures.');
    
    kb.set('enumerator', 'An enumerator is a trained field worker responsible for collecting survey data by conducting interviews with respondents. They follow standardized procedures, use survey instruments, and ensure data quality during the collection process.');
    
    kb.set('supervisor', 'A supervisor is a senior field staff member who oversees enumerators, monitors data collection quality, resolves field issues, and ensures adherence to survey protocols. They typically manage a team of enumerators in a specific geographic area.');
    
    kb.set('sampling frame', 'A sampling frame is a complete list of all units in the target population from which a sample can be drawn. It serves as the basis for selecting survey respondents and should ideally cover the entire population of interest.');
    
    kb.set('response rate', 'Response rate is the percentage of eligible sample units that participate in a survey. It is calculated by dividing the number of completed interviews by the total number of eligible units contacted, expressed as a percentage.');
    
    kb.set('non-response', 'Non-response occurs when selected sample units do not participate in the survey. This can be due to refusal, inability to contact, or other reasons. High non-response rates can introduce bias into survey results.');
    
    kb.set('data quality', 'Data quality refers to the accuracy, completeness, consistency, and reliability of collected survey data. It is ensured through proper training, standardized procedures, validation checks, and quality control measures.');
    
    kb.set('field work', 'Field work refers to the data collection phase of a survey where enumerators visit respondents to conduct interviews. It includes activities like locating households, conducting interviews, and completing survey forms.');
    
    kb.set('questionnaire', 'A questionnaire is a structured set of questions designed to collect specific information from survey respondents. It includes instructions for interviewers and may contain skip patterns, validation rules, and response options.');
    
    kb.set('skip pattern', 'A skip pattern is a logical sequence in a questionnaire that directs interviewers to different questions based on previous responses. It ensures that respondents only answer relevant questions and improves interview efficiency.');
    
    kb.set('validation', 'Validation refers to checks performed on survey data to ensure accuracy and consistency. This includes range checks, consistency checks, and logical validation rules applied during data collection or processing.');
    
    return kb;
  }

  private searchKnowledgeBase(query: string): string | null {
    const queryLower = query.toLowerCase().trim();
    
    // Direct term matching
    for (const [term, definition] of this.knowledgeBase.entries()) {
      if (queryLower.includes(term)) {
        return definition;
      }
    }
    
    // Question pattern matching
    if (queryLower.includes('what is') || queryLower.includes('define') || queryLower.includes('meaning of')) {
      const extractedTerm = this.extractTermFromQuestion(queryLower);
      if (extractedTerm && this.knowledgeBase.has(extractedTerm)) {
        return this.knowledgeBase.get(extractedTerm)!;
      }
    }
    
    return null;
  }

  private extractTermFromQuestion(query: string): string | null {
    // Extract term from "what is X" or "define X" patterns
    const patterns = [
      /what\s+is\s+([a-zA-Z\s]+)[\?]?/,
      /define\s+([a-zA-Z\s]+)[\?]?/,
      /meaning\s+of\s+([a-zA-Z\s]+)[\?]?/,
      /explain\s+([a-zA-Z\s]+)[\?]?/
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim().toLowerCase();
      }
    }
    
    return null;
  }

  private generateIntelligentResponse(query: string, context: string): string | null {
    const cleanContext = this.cleanDocumentContext(context);
    if (cleanContext.length < 50) {
      return null;
    }
    
    const queryLower = query.toLowerCase();
    const sentences = cleanContext.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Find most relevant sentences
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    const relevantSentences = sentences
      .map(sentence => ({
        text: sentence.trim(),
        score: this.calculateRelevanceScore(sentence.toLowerCase(), queryWords)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    
    if (relevantSentences.length > 0) {
      const response = relevantSentences.map(item => item.text).join('. ');
      return this.formatContextualResponse(response);
    }
    
    return null;
  }

  private calculateRelevanceScore(sentence: string, queryWords: string[]): number {
    let score = 0;
    queryWords.forEach(word => {
      const matches = (sentence.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    });
    return score;
  }

  private formatContextualResponse(response: string): string {
    let formatted = response.trim();
    
    // Ensure proper capitalization
    if (formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    
    // Ensure proper ending
    if (!formatted.match(/[.!?]$/)) {
      formatted += '.';
    }
    
    return `Based on the survey documentation: ${formatted}`;
  }

  private generateHelpfulFallback(query: string): string {
    const queryLower = query.toLowerCase();
    
    // Greeting responses
    if (queryLower.includes('hello') || queryLower.includes('hi')) {
      return "Hello! I'm your survey assistant. I can help you with survey terminology, data collection methods, procedures, and best practices. What would you like to know?";
    }
    
    if (queryLower.includes('help')) {
      return "I can help you with:\n• Survey terminology (CAPI, CATI, CAWI, etc.)\n• Data collection procedures\n• Field work guidelines\n• Quality control measures\n• Sampling methods\n• Interview techniques\n\nWhat specific topic interests you?";
    }
    
    if (queryLower.includes('thank')) {
      return "You're welcome! I'm here whenever you need help with survey-related questions.";
    }
    
    // Topic-specific guidance
    if (queryLower.includes('procedure') || queryLower.includes('process')) {
      return "I can help explain survey procedures. Are you interested in:\n• Data collection procedures\n• Interview procedures\n• Quality control procedures\n• Sampling procedures\n\nPlease be more specific about which procedure you'd like to know about.";
    }
    
    if (queryLower.includes('form') || queryLower.includes('questionnaire')) {
      return "I can help with questionnaire and form-related topics such as:\n• Form design principles\n• Question types and formats\n• Skip patterns and logic\n• Data validation rules\n\nWhat specific aspect would you like to know about?";
    }
    
    if (queryLower.includes('training')) {
      return "Survey training typically covers:\n• Interview techniques\n• Use of survey instruments\n• Data quality standards\n• Field procedures\n• Ethics and confidentiality\n\nWhat aspect of training are you interested in?";
    }
    
    return "I'm here to help with survey-related questions. I have knowledge about survey terminology, data collection methods, field procedures, and quality control. Could you please be more specific about what you'd like to know?";
  }

  private formatQAResponse(query: string, answer: string, confidence: number): string {
    const cleanAnswer = answer.trim();
    
    if (confidence > 0.8) {
      return `Based on the survey documentation: ${cleanAnswer}`;
    } else if (confidence > 0.5) {
      return `According to the available information: ${cleanAnswer}. Please note that this answer has moderate confidence, so you may want to verify with additional sources.`;
    } else {
      return `I found some relevant information: ${cleanAnswer}. However, I'm not entirely confident about this answer. Could you provide more context or rephrase your question?`;
    }
  }

  private async generateContextualText(query: string, context: string): Promise<string> {
    if (!this.textGenerator) {
      throw new Error('Text generator not available');
    }

    // Create a more focused prompt with context
    const prompt = `Survey Documentation Context: ${context.substring(0, 500)}...\n\nQuestion: ${query}\n\nAnswer:`;
    
    const result = await this.textGenerator(prompt, {
      max_new_tokens: 80,
      temperature: 0.6,
      do_sample: true,
      pad_token_id: 50256
    });

    if (result && result[0] && result[0].generated_text) {
      const generatedText = result[0].generated_text;
      const answerStart = generatedText.indexOf('Answer:') + 7;
      const response = generatedText.substring(answerStart).trim();
      
      if (response.length > 10) {
        return `Based on the survey documentation: ${this.cleanGeneratedResponse(response)}`;
      }
    }

    throw new Error('Failed to generate contextual response');
  }

  private createSurveyPrompt(query: string): string {
    const surveyContext = "As a survey data collection assistant, I help with questions about survey procedures, data collection methods, and reporting requirements.";
    
    if (query.toLowerCase().includes('hello') || query.toLowerCase().includes('hi')) {
      return `${surveyContext}\n\nUser: ${query}\nAssistant: Hello! I'm here to help you with survey-related questions.`;
    }
    
    if (query.toLowerCase().includes('help')) {
      return `${surveyContext}\n\nUser: ${query}\nAssistant: I can assist you with survey procedures, data collection methods, form completion, and reporting requirements.`;
    }
    
    return `${surveyContext}\n\nUser: ${query}\nAssistant: Regarding your survey question,`;
  }

  private isRelevantResponse(response: string): boolean {
    const irrelevantPatterns = [
      /^[^a-zA-Z]*$/,  // Only punctuation or numbers
      /^\s*$/,         // Only whitespace
      /^(.)\1{3,}/,    // Repeated characters
      /^[^.!?]*[.!?]\s*$/  // Single sentence ending with punctuation only
    ];

    return !irrelevantPatterns.some(pattern => pattern.test(response)) && 
           response.length > 10 && 
           response.length < 300;
  }

  private cleanGeneratedResponse(response: string): string {
    // Clean up the generated response
    let cleaned = response
      .replace(/\n+/g, ' ')           // Replace newlines with spaces
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '')   // Remove special characters except basic punctuation
      .trim();

    // Ensure it ends with proper punctuation
    if (cleaned && !cleaned.match(/[.!?]$/)) {
      cleaned += '.';
    }

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  private cleanDocumentContext(context: string): string {
    return context
      .replace(/\[.*?\]/g, '') // Remove bracketed placeholders
      .replace(/This is simulated.*?content\./g, '') // Remove simulation text
      .replace(/In a real implementation.*?\./g, '') // Remove implementation notes
      .replace(/Document ".*?" has been.*?\./g, '') // Remove upload messages
      .replace(/Figure - Block.*?\n/g, '') // Remove figure references
      .replace(/Option No\. Sub Qn\. No\. Description.*?\n/g, '') // Remove table headers
      .replace(/\d+\s+Switch to.*?\.\.\./g, '') // Remove incomplete sentences
      .trim();
  }

  private extractDefinition(query: string, context: string): string {
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const relevantSentences = sentences.filter(sentence => {
      const queryWords = query.toLowerCase().split(/\s+/);
      return queryWords.some(word => sentence.toLowerCase().includes(word));
    });
    
    if (relevantSentences.length > 0) {
      return relevantSentences[0].trim() + '.';
    }
    
    return "Based on the available documentation, I found relevant information but need more context to provide a clear definition. Could you be more specific?";
  }

  private extractProcedure(query: string, context: string): string {
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const procedureKeywords = ['step', 'process', 'procedure', 'method', 'how to', 'first', 'then', 'next'];
    
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return procedureKeywords.some(keyword => lowerSentence.includes(keyword));
    });
    
    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 2).join('. ').trim() + '.';
    }
    
    return "I can help with procedures and processes. Could you provide more specific details about which procedure you're interested in?";
  }

  private extractFormInformation(query: string, context: string): string {
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const formKeywords = ['form', 'field', 'block', 'section', 'question', 'data entry'];
    
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return formKeywords.some(keyword => lowerSentence.includes(keyword));
    });
    
    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 2).join('. ').trim() + '.';
    }
    
    return "I can help with form-related questions. Could you specify which form or field you need information about?";
  }

  private generateContextualAnswer(query: string, context: string): string {
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    // Find the most relevant sentence
    let bestSentence = '';
    let maxMatches = 0;
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const matches = queryWords.filter(word => lowerSentence.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence.trim();
      }
    });
    
    if (bestSentence && maxMatches > 0) {
      return bestSentence + '.';
    }
    
    return "I found relevant information in the documentation. Could you be more specific about what you'd like to know?";
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  hasNetworkError(): boolean {
    return this.networkError;
  }

  getInitializationError(): string | null {
    return this.initializationError;
  }
}