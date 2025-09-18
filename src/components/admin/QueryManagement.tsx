import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { MessageSquare, Send, Clock, CheckCircle, User, Image, Upload, X, Eye, Bold, Italic, Link, Type } from 'lucide-react';

export default function QueryManagement() {
  const { unansweredQueries, answerQuery } = useChat();
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [response, setResponse] = useState('');
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [isRichTextMode, setIsRichTextMode] = useState(true);
  const [richTextContent, setRichTextContent] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const richEditorRef = React.useRef<HTMLDivElement>(null);

  const handleSubmitResponse = async (queryId: string) => {
    const contentToSubmit = isRichTextMode ? richTextContent : response;
    if (!contentToSubmit.trim()) return;
    
    // Extract images from rich text content
    const processedImages = extractImagesFromRichText(contentToSubmit);
    
    answerQuery(queryId, contentToSubmit, processedImages);
    setResponse('');
    setRichTextContent('');
    setSelectedQuery('');
  };

  const extractImagesFromRichText = (richText: string) => {
    const images: any[] = [];
    
    // Extract images from various HTML formats
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/g;
    const base64Regex = /data:image\/[^;]+;base64,([^"]+)/g;
    let match;
    
    while ((match = imgRegex.exec(richText)) !== null) {
      images.push({
        id: Date.now().toString() + Math.random(),
        fileName: match[2] || 'Admin Response Image',
        description: match[2] || 'Image provided by admin in response',
        dataUrl: match[1],
        type: 'admin-response'
      });
    }
    
    // Also extract any base64 images that might not be in img tags
    while ((match = base64Regex.exec(richText)) !== null) {
      if (!images.some(img => img.dataUrl === match[0])) {
        images.push({
          id: Date.now().toString() + Math.random(),
          fileName: 'Admin Response Image',
          description: 'Image provided by admin in response',
          dataUrl: match[0],
          type: 'admin-response'
        });
      }
    }
    
    return images;
  };

  const handleImagePaste = (event: React.ClipboardEvent) => {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target?.result as string;
          const imageHtml = `<img src="${imageDataUrl}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
          if (isRichTextMode) {
            setRichTextContent(prev => prev + imageHtml);
            if (richEditorRef.current) {
              richEditorRef.current.innerHTML = richTextContent + imageHtml;
            }
          } else {
            setResponse(prev => prev + `[IMAGE: ${file.name}]`);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset file input
    (event.target as HTMLInputElement).value = '';
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageDataUrl = e.target?.result as string;
            const imageHtml = `<img src="${imageDataUrl}" alt="Pasted Image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
            if (isRichTextMode) {
              setRichTextContent(prev => prev + imageHtml);
              if (richEditorRef.current) {
                richEditorRef.current.innerHTML = richTextContent + imageHtml;
              }
            } else {
              setResponse(prev => prev + `[IMAGE: Pasted Image]`);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const insertImageFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageDataUrl = e.target?.result as string;
            const imageHtml = `<img src="${imageDataUrl}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
            if (isRichTextMode) {
              setRichTextContent(prev => prev + imageHtml);
              if (richEditorRef.current) {
                richEditorRef.current.innerHTML = richTextContent + imageHtml;
              }
            } else {
              setResponse(prev => prev + `[IMAGE: ${file.name}]`);
            }
          };
          reader.readAsDataURL(file);
        });
      }
    };
    input.click();
  };

  const formatText = (command: string) => {
    document.execCommand(command, false, '');
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Enter link text:') || url;
      const linkHtml = `<a href="${url}" target="_blank">${text}</a>`;
      if (isRichTextMode) {
        setRichTextContent(prev => prev + linkHtml);
        if (richEditorRef.current) {
          richEditorRef.current.innerHTML = richTextContent + linkHtml;
        }
      } else {
        setResponse(prev => prev + `${text} (${url})`);
      }
    }
  };

  const handleRichTextChange = () => {
    if (richEditorRef.current) {
      setRichTextContent(richEditorRef.current.innerHTML);
    }
  };

  const toggleRichTextMode = () => {
    if (isRichTextMode) {
      // Converting from rich to plain
      const plainText = richEditorRef.current?.innerText || '';
      setResponse(plainText);
    } else {
      // Converting from plain to rich
      const htmlContent = response.replace(/\n/g, '<br>');
      setRichTextContent(htmlContent);
    }
    setIsRichTextMode(!isRichTextMode);
  };

  const surveys = [
    { id: 'survey-1', name: 'Population Census Survey' },
    { id: 'survey-2', name: 'Economic Household Survey' },
    { id: 'survey-3', name: 'Health and Nutrition Survey' },
    { id: 'survey-4', name: 'Education Access Survey' },
    { id: 'survey-5', name: 'ASUSE Industry Survey' },
  ];

  const getSurveyName = (surveyId: string) => {
    return surveys.find(s => s.id === surveyId)?.name || 'Unknown Survey';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Unanswered Queries</h1>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            📚 Answers enhance AI knowledge
          </div>
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {unansweredQueries.length} Pending
          </div>
        </div>
      </div>

      {unansweredQueries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h2>
          <p className="text-gray-600">No unanswered queries at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queries List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending Queries</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {unansweredQueries.map((query) => (
                <div
                  key={query.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedQuery === query.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedQuery(query.id)}
                >
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {getSurveyName(query.surveyId || '')}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">{query.content}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {query.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Respond to Query</h2>
            </div>
            <div className="p-6">
              {selectedQuery ? (
                <>
                  {/* Selected Query */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">User Query:</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">
                        {unansweredQueries.find(q => q.id === selectedQuery)?.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Survey: {getSurveyName(unansweredQueries.find(q => q.id === selectedQuery)?.surveyId || '')}
                      </p>
                    </div>
                  </div>

                  {/* Response Textarea */}
                  <div className="mb-4">
                    <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Response: 
                      <span className="text-xs text-gray-500 ml-2">
                        ({isRichTextMode ? 'Rich text with embedded images' : 'Plain text'})
                      </span>
                    </label>
                    
                    {/* Rich Text Toolbar */}
                    <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={toggleRichTextMode}
                        className={`p-1 rounded ${isRichTextMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
                        title={isRichTextMode ? 'Switch to Plain Text' : 'Switch to Rich Text'}
                      >
                        <Type className="h-4 w-4" />
                      </button>
                      <div className="w-px h-6 bg-gray-300"></div>
                      <button
                        type="button"
                        onClick={() => formatText('bold')}
                        className={`p-1 rounded ${isRichTextMode ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!isRichTextMode}
                        title="Bold"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => formatText('italic')}
                        className={`p-1 rounded ${isRichTextMode ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!isRichTextMode}
                        title="Italic"
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={insertLink}
                        className={`p-1 rounded ${isRichTextMode ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!isRichTextMode}
                        title="Insert Link"
                      >
                        <Link className="h-4 w-4" />
                      </button>
                      <div className="w-px h-6 bg-gray-300"></div>
                      <button
                        type="button"
                        onClick={insertImageFromFile}
                        className={`p-1 rounded flex items-center space-x-1 ${isRichTextMode ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!isRichTextMode}
                        title="Insert Image"
                      >
                        <Image className="h-4 w-4" />
                        <span className="text-xs">Image</span>
                      </button>
                    </div>
                    
                    {/* Editor Container */}
                    {isRichTextMode ? (
                      <div
                        ref={richEditorRef}
                        contentEditable
                        onInput={handleRichTextChange}
                        onPaste={handlePaste}
                        className="w-full min-h-[200px] border border-gray-300 border-t-0 rounded-b-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-vertical overflow-y-auto"
                        style={{ 
                          direction: 'ltr',
                          textAlign: 'left',
                          unicodeBidi: 'normal'
                        }}
                        data-placeholder="Type your detailed response here. You can paste images directly (Ctrl+V), use the toolbar buttons, or type HTML directly. Rich formatting and embedded images are fully supported."
                        suppressContentEditableWarning={true}
                      />
                    ) : (
                      <textarea
                        ref={textareaRef}
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        className="w-full min-h-[200px] border border-gray-300 border-t-0 rounded-b-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-vertical"
                        style={{ 
                          direction: 'ltr',
                          textAlign: 'left',
                          unicodeBidi: 'normal'
                        }}
                        placeholder="Type your response here in plain text format."
                        dir="ltr"
                      />
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="mb-4">
                    <div className={`text-xs text-gray-500 p-3 rounded-lg border ${isRichTextMode ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="font-medium text-blue-800 mb-1">💡 How to add images:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        {isRichTextMode ? (
                          <>
                            <li>Copy and paste images directly into the rich text editor (Ctrl+V)</li>
                            <li>Use the "Image" button in the toolbar to select files</li>
                            <li>Type HTML directly for advanced formatting</li>
                            <li>Images will be embedded inline with full rich text formatting</li>
                            <li>Use Bold, Italic, and Link buttons for text formatting</li>
                          </>
                        ) : (
                          <>
                            <li>Plain text mode - images will be referenced as [IMAGE: filename]</li>
                            <li>Switch to Rich Text mode for full image embedding</li>
                            <li>Use the toggle button in the toolbar to switch modes</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={() => handleSubmitResponse(selectedQuery)}
                    disabled={isRichTextMode ? !richTextContent.trim() : !response.trim()}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send {isRichTextMode ? 'Rich' : 'Plain'} Response & Enhance AI</span>
                  </button>
                  
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Knowledge Enhancement</p>
                        <p>Your rich text response with embedded images will be immediately added to the AI's knowledge base with high priority, making the chatbot smarter for future similar questions across all surveys. Visual content will be available to users when relevant.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a query to respond to</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImagePreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕
            </button>
            <img
              src={showImagePreview}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}