import { useState, useEffect } from 'react';
import { databaseService } from '../services/DatabaseService';
import type { Database } from '../lib/supabase';

type Tables = Database['public']['Tables'];

// Custom hooks for database operations
export function useUsers() {
  const [users, setUsers] = useState<Tables['users']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Tables['users']['Insert']) => {
    try {
      const newUser = await databaseService.createUser(userData);
      if (newUser) {
        setUsers(prev => [newUser, ...prev]);
      }
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      throw err;
    }
  };

  const updateUser = async (id: string, updates: Tables['users']['Update']) => {
    try {
      const updatedUser = await databaseService.updateUser(id, updates);
      if (updatedUser) {
        setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      }
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await databaseService.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
}

export function useSurveys() {
  const [surveys, setSurveys] = useState<Tables['surveys']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getAllSurveys();
      setSurveys(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch surveys');
    } finally {
      setLoading(false);
    }
  };

  const createSurvey = async (surveyData: Tables['surveys']['Insert']) => {
    try {
      const newSurvey = await databaseService.createSurvey(surveyData);
      if (newSurvey) {
        setSurveys(prev => [newSurvey, ...prev]);
      }
      return newSurvey;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create survey');
      throw err;
    }
  };

  const updateSurvey = async (id: string, updates: Tables['surveys']['Update']) => {
    try {
      const updatedSurvey = await databaseService.updateSurvey(id, updates);
      if (updatedSurvey) {
        setSurveys(prev => prev.map(survey => survey.id === id ? updatedSurvey : survey));
      }
      return updatedSurvey;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update survey');
      throw err;
    }
  };

  const deleteSurvey = async (id: string) => {
    try {
      await databaseService.deleteSurvey(id);
      setSurveys(prev => prev.filter(survey => survey.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete survey');
      throw err;
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  return {
    surveys,
    loading,
    error,
    fetchSurveys,
    createSurvey,
    updateSurvey,
    deleteSurvey
  };
}

export function useDocuments(surveyId?: string, category?: string) {
  const [documents, setDocuments] = useState<Tables['documents']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let data;
      if (surveyId) {
        data = await databaseService.getDocumentsBySurvey(surveyId, category);
      } else {
        // Fetch all documents if no surveyId provided
        const { data: allDocs, error } = await databaseService.supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        data = allDocs || [];
      }
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (documentData: Tables['documents']['Insert']) => {
    try {
      const newDocument = await databaseService.createDocument(documentData);
      if (newDocument) {
        setDocuments(prev => [newDocument, ...prev]);
      }
      return newDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      throw err;
    }
  };

  const updateDocument = async (id: string, updates: Tables['documents']['Update']) => {
    try {
      const updatedDocument = await databaseService.updateDocument(id, updates);
      if (updatedDocument) {
        setDocuments(prev => prev.map(doc => doc.id === id ? updatedDocument : doc));
      }
      return updatedDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await databaseService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [surveyId, category]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument
  };
}

export function useChatSessions(userId?: string) {
  const [sessions, setSessions] = useState<Tables['chat_sessions']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      if (userId) {
        const data = await databaseService.getUserChatSessions(userId);
        setSessions(data);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: Tables['chat_sessions']['Insert']) => {
    try {
      const newSession = await databaseService.createChatSession(sessionData);
      if (newSession) {
        setSessions(prev => [newSession, ...prev]);
      }
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat session');
      throw err;
    }
  };

  const updateSession = async (id: string, updates: Tables['chat_sessions']['Update']) => {
    try {
      const updatedSession = await databaseService.updateChatSession(id, updates);
      if (updatedSession) {
        setSessions(prev => prev.map(session => session.id === id ? updatedSession : session));
      }
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chat session');
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSession
  };
}

export function useUnansweredQueries() {
  const [queries, setQueries] = useState<Tables['unanswered_queries']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueries = async (status: 'pending' | 'answered' | 'dismissed' = 'pending') => {
    try {
      setLoading(true);
      const data = await databaseService.getUnansweredQueries(status);
      setQueries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch unanswered queries');
    } finally {
      setLoading(false);
    }
  };

  const createQuery = async (queryData: Tables['unanswered_queries']['Insert']) => {
    try {
      const newQuery = await databaseService.createUnansweredQuery(queryData);
      if (newQuery) {
        setQueries(prev => [newQuery, ...prev]);
      }
      return newQuery;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create unanswered query');
      throw err;
    }
  };

  const answerQuery = async (
    queryId: string,
    adminResponse: string,
    adminResponseRich?: string,
    adminImages?: any[],
    answeredBy?: string
  ) => {
    try {
      const answeredQuery = await databaseService.answerQuery(
        queryId,
        adminResponse,
        adminResponseRich,
        adminImages,
        answeredBy
      );
      if (answeredQuery) {
        setQueries(prev => prev.filter(query => query.id !== queryId));
      }
      return answeredQuery;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to answer query');
      throw err;
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  return {
    queries,
    loading,
    error,
    fetchQueries,
    createQuery,
    answerQuery
  };
}

export function useAdminKnowledge(surveyId?: string) {
  const [knowledge, setKnowledge] = useState<Tables['admin_knowledge']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getAdminKnowledge(surveyId);
      setKnowledge(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin knowledge');
    } finally {
      setLoading(false);
    }
  };

  const createKnowledge = async (knowledgeData: Tables['admin_knowledge']['Insert']) => {
    try {
      const newKnowledge = await databaseService.createAdminKnowledge(knowledgeData);
      if (newKnowledge) {
        setKnowledge(prev => [newKnowledge, ...prev]);
      }
      return newKnowledge;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin knowledge');
      throw err;
    }
  };

  const updateKnowledge = async (id: string, updates: Tables['admin_knowledge']['Update']) => {
    try {
      const updatedKnowledge = await databaseService.updateAdminKnowledge(id, updates);
      if (updatedKnowledge) {
        setKnowledge(prev => prev.map(item => item.id === id ? updatedKnowledge : item));
      }
      return updatedKnowledge;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin knowledge');
      throw err;
    }
  };

  const searchKnowledge = async (query: string) => {
    try {
      const data = await databaseService.searchAdminKnowledge(query, surveyId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search admin knowledge');
      throw err;
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [surveyId]);

  return {
    knowledge,
    loading,
    error,
    fetchKnowledge,
    createKnowledge,
    updateKnowledge,
    searchKnowledge
  };
}