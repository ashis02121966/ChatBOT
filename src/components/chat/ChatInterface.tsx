import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { Send, Bot, User, FileText, Plus, Brain, Image, Download, ZoomIn, CheckCircle, XCircle } from 'lucide-react';

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentSession, createSession, sendMessage, provideFeedback, changeCategory } = useChat();
  const { getDocumentsBySurvey } = useDocuments();

  const surveys = [
    { id: 'survey-1', name: 'Population Census Survey' },
    { id: 'survey-2', name: 'Economic Household Survey' },
    { id: 'survey-3', name: 'Health and Nutrition Survey' },
    { id: 'survey-4', name: 'Education Access Survey' },
    { id: 'survey-5', name: 'ASUSE Industry Survey' },
  ];

  const categories = [
    { id: 'general', name: 'General Questions' },
    { id: 'listing', name: 'Listing' },
    { id: 'detail', name: 'Detail Schedule' },
    { id: 'additional', name: 'Additional Schedule' },
  ];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Add global function for image modal
  React.useEffect(() => {
    window.showImageModal = (imageUrl: string) => {
      setSelectedImage(imageUrl);
    };
    
    return () => {
      delete window.showImageModal;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Check if this is a response to pending feedback
    if (pendingFeedback) {
      const response = message.toLowerCase().trim();
      if (response === 'yes' || response === 'no') {
        handleFeedbackResponse(pendingFeedback, response === 'yes');
        setMessage('');
        setPendingFeedback(null);
        return;
      }
    }

    sendMessage(message);
    setMessage('');
  };

  const handleFeedbackResponse = (messageId: string, isCorrect: boolean) => {
    provideFeedback(messageId, isCorrect);
    setPendingFeedback(null);
  };

  const handleBotMessageResponse = (messageId: string) => {
    setPendingFeedback(messageId);
  };

  const handleSurveySelect = (surveyId: string) => {
    setSelectedSurvey(surveyId);
    createSession(surveyId); // Create session immediately after survey selection
  };

  const handleCategoryChange = (categoryName: string) => {
    changeCategory(categoryName);
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <Bot className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Survey Assistant</h1>
            <p className="text-gray-600">
              Select a survey and category to start chatting with your intelligent assistant
            </p>
          </div>

          {/* Survey Selection */}
          {!selectedSurvey && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Step 1: Select Survey</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {surveys.map((survey) => (
                  <button
                    key={survey.id}
                    onClick={() => handleSurveySelect(survey.id)}
                    className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <FileText className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-gray-900 mb-2">{survey.name}</h3>
                    <p className="text-sm text-gray-600">
                      Ask questions about procedures, data collection, and reporting
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          {selectedSurvey && !selectedCategory && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 2: Select Category</h2>
                <p className="text-gray-600">
                  Selected Survey: <span className="font-medium text-blue-600">
                    {surveys.find(s => s.id === selectedSurvey)?.name}
                  </span>
                </p>
                <button
                  onClick={() => setSelectedSurvey('')}
                  className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
                >
                  Change Survey
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.name)}
                    className="p-6 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <FileText className="h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600">
                      Questions and documents related to {category.name.toLowerCase()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
    );
  }

  const currentSurvey = surveys.find(s => s.id === currentSession.surveyId);
  const currentCategory = currentSession.category;
  const availableDocs = currentSession ? getDocumentsBySurvey(currentSession.surveyId, currentSession.category) : [];
  const totalImages = availableDocs.reduce((sum, doc) => sum + doc.images.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto h-screen pt-16 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">
                {currentSurvey?.name}
                {currentCategory && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    {currentCategory}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-600">
                <Brain className="h-3 w-3 inline mr-1" />
                SLM-Powered Assistant • Category: {currentCategory || 'All'} • {availableDocs.length} documents • {totalImages} images loaded
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Category Selection Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Select Category:</span>
            <div className="flex space-x-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    currentCategory === category.name
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            {currentCategory && (
              <button
                onClick={() => handleCategoryChange('')}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear Category
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentSession.messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Start a conversation about {currentSurvey?.name}</p>
              {!currentCategory && (
                <p className="text-sm mt-2 text-amber-600">
                  💡 Select a category above to get more focused responses
                </p>
              )}
              <p className="text-sm mt-2">
                I'm powered by Small Language Models (SLM) and can provide intelligent responses about procedures, data collection, and reporting questions.
                {availableDocs.length > 0 && (
                  <span className="block mt-1 text-green-600">
                    I have access to {availableDocs.length} uploaded document{availableDocs.length !== 1 ? 's' : ''} and {totalImages} visual reference{totalImages !== 1 ? 's' : ''}{currentCategory ? ` for ${currentCategory}` : ''}.
                  </span>
                )}
              </p>
              {currentCategory && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                  <p className="text-xs text-blue-800">
                    <strong>Context Priority:</strong> I'll search for answers in "{currentCategory}" first, then expand to other categories if needed.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentSession.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                msg.sender === 'user' 
                  ? 'bg-blue-600' 
                  : msg.sender === 'admin'
                  ? 'bg-green-600'
                  : 'bg-gray-600'
              }`}>
                {msg.sender === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div className={`max-w-xs lg:max-w-2xl ${
                msg.sender === 'user'
                  ? ''
                  : msg.sender === 'admin'
                  ? ''
                  : ''
              }`}>
                <div className={`px-4 py-2 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.sender === 'admin'
                    ? 'bg-green-100 text-green-900'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                {/* Debug info */}
                
                {/* Always display as rich text content */}
                {msg.sender !== 'user' ? (
                  <>
                    {msg.sender === 'admin' && (
                      <div className="text-xs text-green-600 mb-2 flex items-center space-x-1">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Admin Response</span>
                        <span>Rich content with {msg.images?.length || 0} images</span>
                      </div>
                    )}
                    <div 
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: msg.richContent || msg.content }}
                    />
                  </>
                ) : (
                  /* User messages remain as plain text */
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}
                
                {/* Fallback for any edge cases */}
                {msg.sender !== 'user' && !msg.richContent && !msg.content && (
                  <>
                    <div className="text-sm text-gray-500 italic">
                      [No content available]
                    </div>
                  </>
                )}
                
                {/* Display images if present */}
                {msg.images && msg.images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 mb-2 font-medium">
                      {msg.sender === 'admin' ? 'Admin-Provided Visual References' : 'Visual References'} ({msg.images.length}):
                    </p>
                    {msg.images.map((image) => (
                      <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Image className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-gray-700">{image.fileName}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                image.type === 'diagram' ? 'bg-blue-100 text-blue-800' :
                                image.type === 'flowchart' ? 'bg-green-100 text-green-800' :
                                image.type === 'form' ? 'bg-purple-100 text-purple-800' :
                                image.type === 'chart' ? 'bg-orange-100 text-orange-800' :
                                image.type === 'screenshot' ? 'bg-red-100 text-red-800' :
                                image.type === 'admin-embedded' ? 'bg-green-100 text-green-800' :
                                image.type === 'admin-response' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {image.type === 'admin-embedded' ? 'admin' : 
                                 image.type === 'admin-response' ? 'admin' : 
                                 image.type}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = image.dataUrl;
                                link.download = `${image.fileName}.png`;
                                link.click();
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Download image"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{image.description}</p>
                        </div>
                        <div className="p-2">
                          <img
                            src={image.dataUrl}
                            alt={image.description}
                            className="w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity border rounded"
                            onClick={() => setSelectedImage(image.dataUrl)}
                            onError={(e) => {
                              console.error('Image failed to load:', image.fileName);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${
                  msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.timestamp.toLocaleTimeString()}
                  {msg.sender === 'admin' && (
                    <span className="ml-2 font-medium">(Admin Response)</span>
                  )}
                </p>
                </div>
                
                {/* Feedback buttons for bot messages */}
                {(msg.sender === 'bot' || msg.sender === 'admin') && !msg.feedbackProvided && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      Was this helpful?
                      {msg.alternativeAttempts && msg.alternativeAttempts > 0 && (
                        <span className="ml-1 text-blue-600">
                          (Attempt {msg.alternativeAttempts + 1}/4)
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => handleFeedbackResponse(msg.id, true)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      title="Yes, this was helpful"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Yes</span>
                    </button>
                    <button
                      onClick={() => handleFeedbackResponse(msg.id, false)}
                      className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-colors ${
                        (msg.alternativeAttempts || 0) >= 3
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title={
                        (msg.alternativeAttempts || 0) >= 3
                          ? "Send to admin for review"
                          : "No, this was not helpful"
                      }
                    >
                      <XCircle className="h-3 w-3" />
                      <span>
                        {(msg.alternativeAttempts || 0) >= 3 ? 'Send to Admin' : 'No'}
                      </span>
                    </button>
                  </div>
                )}
                
                {/* Feedback confirmation */}
                {(msg.sender === 'bot' || msg.sender === 'admin') && msg.feedbackProvided && (
                  <div className="mt-2 flex items-center space-x-1">
                    <span className="text-xs text-gray-500">
                      {msg.feedbackType === 'positive' ? (
                        <>
                          <CheckCircle className="h-3 w-3 inline text-green-600 mr-1" />
                          Thank you for your feedback!
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 inline text-red-600 mr-1" />
                          {(msg.alternativeAttempts || 0) >= 3
                            ? 'Question sent to admin for review.'
                            : msg.alternativeAttempts && msg.alternativeAttempts > 0
                            ? `Generating alternative answer (attempt ${msg.alternativeAttempts + 1})...`
                            : 'Generating alternative answer...'}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          {!currentCategory && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-amber-600 text-sm">
                  💡 <strong>Tip:</strong> Select a category above for more focused responses, or ask general questions about the survey.
                </span>
              </div>
            </div>
          )}
          
          {availableDocs.length > 0 && currentCategory && (
            <div className="mb-3 text-xs text-gray-500 flex items-center space-x-2">
              <FileText className="h-3 w-3" />
              <span>
                Chatbot has access to {availableDocs.length} documents in "{currentCategory}": {availableDocs.map(doc => `${doc.fileName} (${doc.images.length} images)`).join(', ')}
                Chatbot has access to {availableDocs.length} documents in "{currentCategory}": {availableDocs.map(doc => `${doc.fileName} (${doc.images.length} images)`).join(', ')}
              </span>
            </div>
          )}
          
          {/* Pending feedback notification */}
          {pendingFeedback && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Was my previous response helpful?</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFeedbackResponse(pendingFeedback, true)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Yes</span>
                  </button>
                  <button
                    onClick={() => handleFeedbackResponse(pendingFeedback, false)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>No</span>
                  </button>
                  <button
                    onClick={() => setPendingFeedback(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Skip feedback"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={pendingFeedback
                ? "Please use the buttons above to provide feedback, or type your next question..."
                : currentCategory
                  ? availableDocs.length > 0 
                    ? `Ask me anything about ${currentCategory} - I can show you relevant diagrams, forms, and visual content...` 
                    : `Ask me anything about ${currentCategory} - I'm powered by AI to help you...`
                  : `Ask me anything about ${currentSurvey?.name} - Select a category above for focused responses...`
              }
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
        
        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold"
              >
                ✕
              </button>
              <img
                src={selectedImage}
                alt="Full size view"
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}