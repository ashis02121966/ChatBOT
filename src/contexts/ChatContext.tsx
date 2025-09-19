import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useDocuments } from './DocumentContext';
import { SLMService } from '../services/SLMService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper function to convert plain text to HTML format
function convertPlainTextToHTML(text: string): string {
  if (!text) return '';
  
  // Split by double newlines to create paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  if (paragraphs.length <= 1) {
    // Single paragraph - just convert single newlines to <br>
    return text.replace(/\n/g, '<br>');
  }
  
  return paragraphs
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export interface ChatMessage {
  id?: string;
  content: string;
  richContent?: string;
  sender: 'user' | 'bot' | 'admin';
  timestamp: Date;
  images?: Array<{
    id: string;
    fileName: string;
    description: string;
    dataUrl: string;
    type: string;
  }>;
  feedbackProvided?: boolean;
  feedbackType?: 'positive' | 'negative';
  alternativeAttempts?: number;
  originalQuery?: string;
}

export interface ChatSession {
  id: string;
  surveyId: string;
  category?: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface UnansweredQuery {
  id: string;
  content: string;
  surveyId?: string;
  timestamp: Date;
  userId: string;
}

interface ChatContextType {
  currentSession: ChatSession | null;
  unansweredQueries: UnansweredQuery[];
  userSessions: { [userId: string]: ChatSession[] };
  createSession: (surveyId: string, category?: string) => void;
  sendMessage: (content: string) => Promise<void>;
  provideFeedback: (messageId: string, isCorrect: boolean) => void;
  generateAlternativeAnswer: (messageId: string) => Promise<void>;
  answerQuery: (queryId: string, answer: string, images?: Array<{
    id: string;
    fileName: string;
    description: string;
    dataUrl: string;
    type: string;
  }>) => void;
  changeCategory: (category: string) => void;
  clearUserSessions: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [unansweredQueries, setUnansweredQueries] = useState<UnansweredQuery[]>([]);
  const [userSessions, setUserSessions] = useState<{ [userId: string]: ChatSession[] }>({});
  const [slmService] = useState(() => new SLMService());
  const { user } = useAuth();
  const { searchDocuments, searchImages, updateChunkFeedback, updateAdminKnowledgeDocument } = useDocuments();

  // Load global unanswered queries on component mount (independent of user)
  useEffect(() => {
    loadUnansweredQueries();
  }, []);

  const loadUnansweredQueries = async () => {
    if (isSupabaseConfigured()) {
      try {
        console.log('🔄 Loading unanswered queries from Supabase...');
        const { data: queriesData, error } = await supabase!
          .from('unanswered_queries')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error loading unanswered queries from Supabase:', error);
          loadUnansweredQueriesFromLocalStorage();
          return;
        }

        if (queriesData) {
          const queries = queriesData.map(q => ({
            id: q.id,
            content: q.content,
            surveyId: q.survey_id,
            timestamp: new Date(q.created_at),
            userId: q.user_id
          }));
          setUnansweredQueries(queries);
          console.log(`📚 Loaded ${queries.length} unanswered queries from Supabase`);
        }
      } catch (error) {
        console.error('❌ Supabase connection error:', error);
        loadUnansweredQueriesFromLocalStorage();
      }
    } else {
      loadUnansweredQueriesFromLocalStorage();
    }
  };

  const loadUnansweredQueriesFromLocalStorage = () => {
    const savedQueries = localStorage.getItem('globalUnansweredQueries');
    if (savedQueries) {
      try {
        const queries = JSON.parse(savedQueries);
        setUnansweredQueries(queries);
        console.log(`Loaded ${queries.length} global unanswered queries from localStorage`);
      } catch (error) {
        console.error('Error loading global queries:', error);
        setUnansweredQueries([]);
      }
    } else {
      setUnansweredQueries([]);
    }
  };

  // Handle user-specific sessions when user changes
  useEffect(() => {
    if (user) {
      loadUserSessions();
    } else if (user === null) {
      // User logged out, clear only user-specific data (keep global unanswered queries)
      setCurrentSession(null);
    }
  }, [user]);

  const loadUserSessions = async () => {
    if (!user) return;

    if (isSupabaseConfigured()) {
      try {
        console.log('🔄 Loading user sessions from Supabase...');
        const { data: sessionsData, error } = await supabase!
          .from('chat_sessions')
          .select(`
            *,
            chat_messages (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error loading sessions from Supabase:', error);
          loadUserSessionsFromLocalStorage();
          return;
        }

        if (sessionsData) {
          const sessions = sessionsData.map(s => ({
            id: s.id,
            surveyId: s.survey_id,
            category: s.category,
            messages: s.chat_messages.map(m => ({
              id: m.id,
              content: m.content,
              richContent: m.rich_content,
              sender: m.sender,
              timestamp: new Date(m.created_at),
              images: m.images ? JSON.parse(m.images) : undefined,
              feedbackProvided: m.feedback_provided,
              feedbackType: m.feedback_type,
              alternativeAttempts: m.alternative_attempts,
              originalQuery: m.original_query
            })),
            createdAt: new Date(s.created_at)
          }));
          setUserSessions(prev => ({ ...prev, [user.id]: sessions }));
          console.log(`📚 Loaded ${sessions.length} sessions from Supabase`);
        }
      } catch (error) {
        console.error('❌ Supabase connection error:', error);
        loadUserSessionsFromLocalStorage();
      }
    } else {
      loadUserSessionsFromLocalStorage();
    }
  };

  const loadUserSessionsFromLocalStorage = () => {
    if (!user) return;
    
    const savedSessions = localStorage.getItem(`chatSessions_${user.id}`);
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          messages: session.messages.map((message: any) => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }))
        }));
        setUserSessions(prev => ({ ...prev, [user.id]: sessions }));
      } catch (error) {
        console.error('Error loading user sessions:', error);
      }
    }
  };

  // Save user sessions to Supabase/localStorage when they change
  useEffect(() => {
    if (user && userSessions[user.id]) {
      if (isSupabaseConfigured()) {
        saveUserSessionsToSupabase();
      } else {
        localStorage.setItem(`chatSessions_${user.id}`, JSON.stringify(userSessions[user.id]));
      }
    }
  }, [userSessions, user?.id]);

  const saveUserSessionsToSupabase = async () => {
    if (!user || !userSessions[user.id]) return;

    try {
      const sessions = userSessions[user.id];
      
      for (const session of sessions) {
        try {
          // Upsert session
          const { error: sessionError } = await supabase!
            .from('chat_sessions')
            .upsert({
              id: session.id,
              user_id: user.id,
              survey_id: session.surveyId,
              category: session.category,
              message_count: session.messages.length,
              created_at: session.createdAt.toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          if (sessionError) {
            console.error('❌ Error saving session to Supabase:', sessionError);
            continue;
          }

          // Upsert messages
          for (const message of session.messages) {
            const { error: messageError } = await supabase!
              .from('chat_messages')
              .upsert({
                id: message.id,
                session_id: session.id,
                content: message.content,
                rich_content: message.richContent,
                sender: message.sender,
                feedback_type: message.feedbackType,
                feedback_provided: message.feedbackProvided,
                alternative_attempts: message.alternativeAttempts,
                original_query: message.originalQuery,
                images: message.images ? JSON.stringify(message.images) : null,
                created_at: message.timestamp.toISOString()
              }, { onConflict: 'id' });

            if (messageError) {
              console.error('❌ Error saving message to Supabase:', messageError);
            }
          }
        } catch (error) {
          console.error('❌ Error processing session:', error);
        }
      }
    } catch (error) {
      console.error('❌ Supabase sessions save error:', error);
      // Fallback to localStorage
      localStorage.setItem(`chatSessions_${user.id}`, JSON.stringify(userSessions[user.id]));
    }
  };

  // Save global queries to localStorage when they change (independent of user)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      saveUnansweredQueriesToSupabase();
    } else {
      localStorage.setItem('globalUnansweredQueries', JSON.stringify(unansweredQueries));
      console.log(`Saved ${unansweredQueries.length} global unanswered queries to localStorage`);
    }
  }, [unansweredQueries]);

  const saveUnansweredQueriesToSupabase = async () => {
    // Only save new queries, not update existing ones
    // This is handled when queries are added
  };

  const createSession = (surveyId: string, category?: string) => {
    if (!user) return;
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      surveyId,
      category,
      messages: [],
      createdAt: new Date(),
    };
    setCurrentSession(newSession);
    
    // Add to user's sessions
    setUserSessions(prev => ({
      ...prev,
      [user.id]: [...(prev[user.id] || []), newSession]
    }));
  };

  const changeCategory = (category: string) => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        category: category
      } : null);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentSession || !user) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setCurrentSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);
    
    // Update in user sessions
    if (user && currentSession) {
      setUserSessions(prev => ({
        ...prev,
        [user.id]: (prev[user.id] || []).map(session => 
          session.id === currentSession.id 
            ? { ...session, messages: [...session.messages, userMessage] }
            : session
        )
      }));
    }

    try {
      // Search for relevant documents and images with enhanced ranking
      const allRelevantChunks = searchDocuments(content, currentSession.surveyId, currentSession.category);
      const relevantImages = searchImages(content, currentSession.surveyId, currentSession.category);
      
      console.log(`🔍 Found ${allRelevantChunks.length} total chunks for query: "${content}"`);
      console.log(`📂 Category filter: ${currentSession.category || 'All categories'}`);
      
      // Implement comprehensive relevance ranking
      const rankedResults = rankContextByRelevance(content, allRelevantChunks, currentSession.category);
      
      console.log(`📊 Relevance ranking results:`);
      rankedResults.slice(0, 5).forEach((result, index) => {
        console.log(`  ${index + 1}. Score: ${result.score.toFixed(2)} | Type: ${result.type} | Category: ${result.category || 'N/A'} | Source: ${result.source} | Preview: "${result.content.substring(0, 100)}..."`);
      });
      
      // Get the best answer based on ranking
      const bestResult = rankedResults[0];
      let botResponse: string = '';
      let responseImages: any[] = [];
      let responseType: 'admin' | 'bot' = 'bot';
      
      if (bestResult && bestResult.score > 20) {
        if (bestResult.type === 'admin') {
          // Use admin answer directly
          botResponse = bestResult.richContent || bestResult.content;
          responseImages = bestResult.images || [];
          responseType = 'admin';
          console.log(`✅ Using admin answer (score: ${bestResult.score.toFixed(2)}) with ${responseImages.length} images`);
        } else {
          // Use document context for SLM generation
          const contextChunks = rankedResults
            .filter(result => result.type === 'document' && result.score > 15)
            .slice(0, 3);
          
          const context = contextChunks.map(result => result.content).join('\n\n');
          
          if (context.length > 100) {
            botResponse = await slmService.generateResponse(content, context);
            botResponse = convertPlainTextToHTML(botResponse);
            responseImages = relevantImages;
            console.log(`✅ Generated SLM response from document context (score: ${bestResult.score.toFixed(2)})`);
          } else {
            // Fallback to general response
            botResponse = await slmService.generateGeneralResponse(content);
            botResponse = convertPlainTextToHTML(botResponse);
            console.log(`⚠️ Using general response - insufficient context`);
          }
        }
      } else {
        // No relevant context found - use general response
        botResponse = await slmService.generateGeneralResponse(content);
        botResponse = convertPlainTextToHTML(botResponse);
        console.log(`⚠️ No relevant context found - using general response`);
        
        // Add to unanswered queries
        const unansweredQuery: UnansweredQuery = {
          id: `query-${Date.now()}`,
          content,
          surveyId: currentSession.surveyId,
          timestamp: new Date(),
          userId: user.id,
        };
        await addUnansweredQueryToSupabase(unansweredQuery);
        setUnansweredQueries(prev => [...prev, unansweredQuery]);
        console.log(`Added unanswered query to global list: "${content}" from user ${user.id}`);
      }

      // Update SLM with current document knowledge
      const allDocuments = searchDocuments('', currentSession.surveyId, currentSession.category);
      const documentsByFile = new Map();
      
      allDocuments.forEach(chunk => {
        const fileName = chunk.metadata.fileName || 'Unknown';
        if (!documentsByFile.has(fileName)) {
          documentsByFile.set(fileName, {
            id: fileName,
            fileName: fileName,
            content: '',
            chunks: [],
            images: relevantImages.filter(img => img.fileName.includes(fileName))
          });
        }
        const doc = documentsByFile.get(fileName);
        doc.content += chunk.content + '\n';
        doc.chunks.push(chunk);
      });

      slmService.updateDocumentKnowledge(Array.from(documentsByFile.values()));

      if (!botResponse) {
        botResponse = convertPlainTextToHTML("I apologize, but I couldn't generate a response at the moment. Could you please rephrase your question or provide more context?");
      }

      // Create bot message
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        content: '', // Always use richContent
        richContent: botResponse, // Always display as rich content
        sender: responseType,
        timestamp: new Date(),
        images: responseImages.length > 0 ? responseImages : undefined,
      };

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, botMessage]
      } : null);
      
      // Update in user sessions
      if (user && currentSession) {
        setUserSessions(prev => ({
          ...prev,
          [user.id]: (prev[user.id] || []).map(session => 
            session.id === currentSession.id 
              ? { ...session, messages: [...session.messages, botMessage] }
              : session
          )
        }));
      }

    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        content: "I apologize, but I encountered an error while processing your question. Please try again or contact support if the issue persists.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage]
      } : null);
      
      // Update in user sessions  
      if (user && currentSession) {
        setUserSessions(prev => ({
          ...prev,
          [user.id]: (prev[user.id] || []).map(session => 
            session.id === currentSession.id 
              ? { ...session, messages: [...session.messages, errorMessage] }
              : session
          )
        }));
      }
    }
  };

  const addUnansweredQueryToSupabase = async (query: UnansweredQuery) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { error } = await supabase!
        .from('unanswered_queries')
        .insert({
          id: query.id,
          content: query.content,
          survey_id: query.surveyId,
          user_id: query.userId,
          status: 'pending',
          created_at: query.timestamp.toISOString()
        });

      if (error) {
        console.error('❌ Error saving unanswered query to Supabase:', error);
      } else {
        console.log('✅ Unanswered query saved to Supabase');
      }
    } catch (error) {
      console.error('❌ Supabase unanswered query save error:', error);
    }
  };

  const provideFeedback = (messageId: string, isCorrect: boolean) => {
    if (!currentSession) return;

    const message = currentSession.messages.find(msg => msg.id === messageId);
    if (!message) return;

    // If feedback is negative and we haven't reached max attempts, generate alternative
    if (!isCorrect && (message.alternativeAttempts || 0) < 3) {
      generateAlternativeAnswer(messageId);
      return;
    }

    // If feedback is negative and we've reached max attempts, add to unanswered queries
    if (!isCorrect && (message.alternativeAttempts || 0) >= 3 && message.originalQuery) {
      const unansweredQuery: UnansweredQuery = {
        id: `query-${Date.now()}`,
        content: message.originalQuery,
        surveyId: currentSession.surveyId,
        timestamp: new Date(),
        userId: user?.id || 'unknown',
      };
      addUnansweredQueryToSupabase(unansweredQuery);
      setUnansweredQueries(prev => [...prev, unansweredQuery]);
      console.log(`Added unanswered query after max attempts: "${message.originalQuery}" from user ${user?.id || 'unknown'}`);
    }

    // Update the message with feedback
    setCurrentSession(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              feedbackProvided: true,
              feedbackType: isCorrect ? 'positive' : 'negative'
            };
          }
          return msg;
        })
      };
    });
    
    // Update in user sessions
    if (user && currentSession) {
      setUserSessions(prev => ({
        ...prev,
        [user.id]: (prev[user.id] || []).map(session => 
          session.id === currentSession.id 
            ? {
                ...session,
                messages: session.messages.map(msg => 
                  msg.id === messageId 
                    ? { ...msg, feedbackProvided: true, feedbackType: isCorrect ? 'positive' : 'negative' }
                    : msg
                )
              }
            : session
        )
      }));
    }

    // Log the feedback
    console.log(`Feedback provided for message "${message.content}": ${isCorrect ? 'positive' : 'negative'}`);
  };

  const answerQuery = (queryId: string, answer: string, images: Array<{
    id: string;
    fileName: string;
    description: string;
    dataUrl: string;
    type: string;
  }> = []) => {
    answerQueryInSupabase(queryId, answer, images);
    const query = unansweredQueries.find(q => q.id === queryId);
    if (!query) return;

    console.log(`📝 Admin answering query: "${query.content}"`);
    console.log(`🖼️ Admin provided ${images.length} images with the answer`);

    // Add the admin answer to the knowledge base
    updateAdminKnowledgeDocument(query.content, answer, query.surveyId, images);

    // Remove from unanswered queries
    setUnansweredQueries(prev => prev.filter(q => q.id !== queryId));

    console.log(`✅ Query answered and added to knowledge base with ${images.length} images`);
  };

  const answerQueryInSupabase = async (queryId: string, answer: string, images: any[]) => {
    if (!isSupabaseConfigured()) return;

    try {
      // Update the query status to answered
      const { error: updateError } = await supabase!
        .from('unanswered_queries')
        .update({
          status: 'answered',
          answered_at: new Date().toISOString(),
          answered_by: user?.id,
          answer_content: answer,
          answer_rich_content: answer,
          answer_images: JSON.stringify(images)
        })
        .eq('id', queryId);

      if (updateError) {
        console.error('❌ Error updating answered query in Supabase:', updateError);
      } else {
        console.log('✅ Query marked as answered in Supabase');
      }
    } catch (error) {
      console.error('❌ Supabase answer query error:', error);
    }
  };

  // Enhanced relevance ranking function
  const rankContextByRelevance = (query: string, chunks: any[], selectedCategory?: string) => {
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    console.log(`🔍 Ranking ${chunks.length} chunks for query: "${query}"`);
    console.log(`📝 Query words: [${queryWords.join(', ')}]`);
    console.log(`📂 Selected category: ${selectedCategory || 'All categories'}`);
    
    const rankedResults = chunks.map(chunk => {
      let score = 0;
      let type = 'document';
      let content = chunk.content;
      let richContent = '';
      let images: any[] = [];
      let source = chunk.metadata.fileName || 'Unknown';
      let category = chunk.metadata.category || chunk.category || 'General Questions';
      
      // Determine chunk type and extract content
      if (chunk.metadata.isAdminAnswer) {
        type = 'admin';
        content = chunk.metadata.adminAnswerText || chunk.content;
        richContent = chunk.metadata.adminAnswerRich || chunk.metadata.adminAnswer || content;
        images = chunk.metadata.adminImages || [];
        source = 'Admin Knowledge Base';
        category = chunk.metadata.surveyId === 'general' ? 'General Questions' : category;
        
        // Admin answer scoring
        score += calculateAdminAnswerScore(queryLower, queryWords, chunk);
      } else {
        type = 'document';
        
        // Document chunk scoring
        score += calculateDocumentScore(queryLower, queryWords, chunk);
        
        // Server-processed content bonus
        if (chunk.metadata.processingMethod?.includes('server')) {
          score += 50;
        }
      }
      
      // Category-based scoring priority
      if (selectedCategory) {
        if (category === selectedCategory) {
          // Same category gets significant bonus
          score *= 1.5;
          console.log(`📂 Same category bonus applied: ${category} (+50%)`);
        } else {
          // Different category gets penalty but still searchable
          score *= 0.7;
          console.log(`📂 Different category penalty: ${category} (-30%)`);
        }
      }
      
      // Content quality bonuses
      if (chunk.metadata.importance && chunk.metadata.importance > 1.0) {
        score *= chunk.metadata.importance;
      }
      
      // Keyword matching bonus
      if (chunk.metadata.keywords) {
        const keywordMatches = chunk.metadata.keywords.filter(keyword => 
          queryWords.some(word => keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase()))
        ).length;
        score += keywordMatches * 15;
      }
      
      // Content type relevance
      const queryType = getQuestionType(queryLower);
      if (chunk.metadata.contentType === queryType) {
        score += 25;
      }
      
      return {
        chunk,
        score,
        type,
        content,
        richContent,
        images,
        source,
        category,
        queryType,
        hasImages: images.length > 0
      };
    });
    
    // Sort by score (highest first)
    const sorted = rankedResults
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
    
    console.log(`📊 Ranking complete: ${sorted.length} relevant results found`);
    if (selectedCategory) {
      const sameCategory = sorted.filter(r => r.category === selectedCategory).length;
      const otherCategory = sorted.length - sameCategory;
      console.log(`📂 Category breakdown: ${sameCategory} from "${selectedCategory}", ${otherCategory} from other categories`);
    }
    
    return sorted;
  };
  
  // Calculate admin answer relevance score
  const calculateAdminAnswerScore = (queryLower: string, queryWords: string[], chunk: any): number => {
    let score = 0;
    
    if (!chunk.metadata.originalQuestion || !chunk.metadata.adminAnswer) {
      return 0;
    }
    
    const originalQuestion = chunk.metadata.originalQuestion.toLowerCase();
    const adminAnswer = (chunk.metadata.adminAnswer || '').toLowerCase();
    
    // Exact phrase matching in original question (highest priority)
    if (originalQuestion.includes(queryLower)) {
      score += 200;
    }
    
    // Semantic similarity calculation
    const originalWords = originalQuestion.split(/\s+/).filter(word => word.length > 2);
    const commonWords = queryWords.filter(word => originalWords.includes(word));
    const semanticSimilarity = commonWords.length / Math.max(queryWords.length, originalWords.length);
    
    // Question type similarity
    const queryType = getQuestionType(queryLower);
    const originalType = getQuestionType(originalQuestion);
    const typeMatch = queryType === originalType && queryType !== 'general';
    
    // Semantic similarity scoring
    if (semanticSimilarity > 0.7) {
      score += typeMatch ? 150 : 120;
    } else if (semanticSimilarity > 0.5) {
      score += typeMatch ? 100 : 80;
    } else if (semanticSimilarity > 0.3) {
      score += typeMatch ? 70 : 50;
    } else if (semanticSimilarity > 0.1) {
      score += typeMatch ? 40 : 25;
    }
    
    // Individual word matches in original question
    queryWords.forEach(word => {
      if (originalQuestion.includes(word)) {
        const wordIndex = originalQuestion.indexOf(word);
        const positionBonus = wordIndex < originalQuestion.length * 0.3 ? 10 : 0;
        score += 20 + positionBonus;
      }
    });
    
    // Answer content relevance
    if (adminAnswer.includes(queryLower)) {
      score += 80;
    }
    
    queryWords.forEach(word => {
      if (adminAnswer.includes(word)) {
        score += 12;
      }
    });
    
    // Multi-word phrases in answer
    if (queryWords.length > 1) {
      for (let i = 0; i < queryWords.length - 1; i++) {
        const phrase = queryWords.slice(i, i + 2).join(' ');
        if (adminAnswer.includes(phrase)) {
          score += 30;
        }
      }
    }
    
    // Quality indicators
    if (adminAnswer.length > 50 && adminAnswer.length < 1000) {
      score += 15;
    }
    
    // Rich content bonus
    if (chunk.metadata.hasRichContent) {
      score += 20;
    }
    
    // Images bonus
    if (chunk.metadata.adminImages && chunk.metadata.adminImages.length > 0) {
      score += 25;
    }
    
    return score;
  };
  
  // Calculate document chunk relevance score
  const calculateDocumentScore = (queryLower: string, queryWords: string[], chunk: any): number => {
    let score = 0;
    const chunkText = chunk.content.toLowerCase();
    
    // Exact phrase matching
    if (chunkText.includes(queryLower)) {
      score += 100;
    }
    
    // Multi-word phrase matching
    if (queryWords.length > 1) {
      for (let i = 0; i < queryWords.length - 1; i++) {
        const phrase = queryWords.slice(i, i + 2).join(' ');
        if (chunkText.includes(phrase)) {
          score += 50;
        }
      }
    }
    
    // Individual word matches with frequency
    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = (chunkText.match(regex) || []).length;
      score += matches * 15;
    });
    
    // Content length quality
    if (chunk.content.length > 200 && chunk.content.length < 1500) {
      score += 20;
    }
    
    // Survey-specific terms bonus
    const surveyTerms = ['capi', 'cati', 'cawi', 'survey', 'enumeration', 'questionnaire', 'respondent', 'interview', 'data', 'collection'];
    surveyTerms.forEach(term => {
      if (chunkText.includes(term) && queryWords.includes(term)) {
        score += 25;
      }
    });
    
    return score;
  };
  
  // Helper function to determine question type
  const getQuestionType = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('what is') || q.includes('what are') || q.includes('define') || q.includes('meaning')) {
      return 'definition';
    } else if (q.includes('how to') || q.includes('how do') || q.includes('how can') || q.includes('procedure')) {
      return 'procedure';
    } else if (q.includes('when') || q.includes('what time') || q.includes('timing')) {
      return 'timing';
    } else if (q.includes('where') || q.includes('which location') || q.includes('location')) {
      return 'location';
    } else if (q.includes('why') || q.includes('what reason') || q.includes('reason')) {
      return 'explanation';
    } else if (q.includes('who') || q.includes('which person') || q.includes('responsible')) {
      return 'person';
    } else if (q.includes('can i') || q.includes('should i') || q.includes('may i')) {
      return 'permission';
    } else if (q.includes('list') || q.includes('types') || q.includes('categories')) {
      return 'list';
    }
    return 'general';
  };

  const generateAlternativeAnswer = async (messageId: string) => {
    if (!currentSession || !user) return;

    const message = currentSession.messages.find(msg => msg.id === messageId);
    if (!message) return;

    // Find the original user query
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageId);
    let originalQuery = message.originalQuery;
    
    if (!originalQuery && messageIndex > 0) {
      const previousMessage = currentSession.messages[messageIndex - 1];
      if (previousMessage.sender === 'user') {
        originalQuery = previousMessage.content;
      }
    }

    if (!originalQuery) return;

    const attemptCount = (message.alternativeAttempts || 0) + 1;

    try {
      // Use ranking system for alternative answers too
      const allRelevantChunks = searchDocuments(originalQuery, currentSession.surveyId, currentSession.category);
      const relevantImages = searchImages(originalQuery, currentSession.surveyId, currentSession.category);
      
      const rankedResults = rankContextByRelevance(originalQuery, allRelevantChunks, currentSession.category);
      
      // Skip results that were likely used in previous attempts
      const skipCount = attemptCount - 1;
      const alternativeResult = rankedResults[skipCount] || rankedResults[rankedResults.length - 1];
      
      let botResponse: string = '';
      let responseImages: any[] = [];
      let responseType: 'admin' | 'bot' = 'bot';
      
      if (alternativeResult && alternativeResult.score > 15) {
        if (alternativeResult.type === 'admin') {
          botResponse = alternativeResult.richContent || alternativeResult.content;
          responseImages = alternativeResult.images || [];
          responseType = 'admin';
        } else {
          // Generate alternative response with different context
          const alternativePrompt = `Please provide an alternative explanation for: ${originalQuery}`;
          botResponse = await slmService.generateResponse(alternativePrompt, alternativeResult.content);
          botResponse = convertPlainTextToHTML(botResponse);
          responseImages = relevantImages;
        }
      } else {
        // Fallback to general alternative response
        const alternativePrompt = `Please provide an alternative explanation for: ${originalQuery}`;
        botResponse = await slmService.generateGeneralResponse(alternativePrompt);
        botResponse = convertPlainTextToHTML(botResponse);
      }

      if (!botResponse) {
        botResponse = convertPlainTextToHTML("I apologize, but I'm having trouble generating an alternative response. Let me try a different approach to your question.");
      }

      // Create alternative bot message
      const alternativeBotMessage: ChatMessage = {
        id: `bot-alt-${Date.now()}`,
        content: '', // Always use richContent
        richContent: botResponse, // Always display as rich content
        sender: responseType,
        timestamp: new Date(),
        images: responseImages.length > 0 ? responseImages : undefined,
        alternativeAttempts: attemptCount,
        originalQuery: originalQuery,
      };

      // Add the alternative message to the session
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, alternativeBotMessage]
      } : null);
      
      // Update in user sessions
      if (user && currentSession) {
        setUserSessions(prev => ({
          ...prev,
          [user.id]: (prev[user.id] || []).map(session => 
            session.id === currentSession.id 
              ? { ...session, messages: [...session.messages, alternativeBotMessage] }
              : session
          )
        }));
      }

    } catch (error) {
      console.error('Error generating alternative answer:', error);
      
      // If we can't generate an alternative, add to unanswered queries
      const unansweredQuery: UnansweredQuery = {
        id: `query-${Date.now()}`,
        content: originalQuery,
        surveyId: currentSession.surveyId,
        timestamp: new Date(),
        userId: user.id,
      };
      setUnansweredQueries(prev => [...prev, unansweredQuery]);
      console.log(`Added unanswered query from alternative generation failure: "${originalQuery}" from user ${user.id}`);
      console.log(`Added unanswered query from error: "${originalQuery}" from user ${user.id}`);
    }
  };

  const clearUserSessions = () => {
    if (user) {
      localStorage.removeItem(`chatSessions_${user.id}`);
      setUserSessions(prev => ({ ...prev, [user.id]: [] }));
      setCurrentSession(null);
      console.log(`Cleared user sessions for user ${user.id}, but kept global unanswered queries`);
    }
  };

  return (
    <ChatContext.Provider value={{
      currentSession,
      unansweredQueries,
      userSessions,
      createSession,
      sendMessage,
      provideFeedback,
      generateAlternativeAnswer,
      answerQuery,
      changeCategory,
      clearUserSessions,
    }}>
      {children}
    </ChatContext.Provider>
  );
}