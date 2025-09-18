import React, { useState } from 'react';
import { Upload, FileText, Trash2, Download, Plus, X } from 'lucide-react';
import { useDocuments } from '../../contexts/DocumentContext';
import { DocumentService } from '../../services/DocumentService';

interface SurveyFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'excel';
  size: number;
  uploadDate: Date;
  surveyId: string;
  category: string;
}

export default function FileManagement() {
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const { documents, processDocument, getDocumentsBySurvey, deleteDocument } = useDocuments();
  const [documentService] = useState(() => new DocumentService());
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [files, setFiles] = useState<SurveyFile[]>([
    {
      id: '1',
      name: 'Census Procedures Manual.pdf',
      type: 'pdf',
      size: 2048000,
      uploadDate: new Date('2024-01-15'),
      surveyId: 'survey-1',
       category: 'General Questions',
    },
    {
      id: '2',
      name: 'Data Collection Guidelines.docx',
      type: 'doc',
      size: 1024000,
      uploadDate: new Date('2024-01-16'),
      surveyId: 'survey-1',
       category: 'Detail Schedule',
    },
    {
      id: '3',
      name: 'Sample Forms.xlsx',
      type: 'excel',
      size: 512000,
      uploadDate: new Date('2024-01-17'),
      surveyId: 'survey-2',
       category: 'Listing',
    },
  ]);

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
  // Check server status on component mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      checkServerStatus();
    }, 1000); // Delay to ensure component is fully mounted
    
    return () => clearTimeout(timer);
  }, []);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      console.log('Checking server health at:', documentService.getServerUrl() + '/api/health');
      const isHealthy = await documentService.checkServerHealth();
      console.log('Server health check result:', isHealthy);
      setServerStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      console.error('Health check error:', error);
      setServerStatus('offline');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return <FileText className="h-8 w-8 text-blue-600" />;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    if (!selectedSurvey) {
      alert('Please select a survey first');
      return;
    }

    if (!selectedCategory) {
      alert('Please select a category first');
      return;
    }
    setUploading(true);
    
    Array.from(fileList).forEach(async (file) => {
      try {
        // Initialize progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 5, 85)
          }));
        }, 300);
        
        // Process the document
        await processDocument(file, selectedSurvey, selectedCategory);
        
        // Complete progress
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        // Add to files list for UI
        const newFile: SurveyFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.name.endsWith('.pdf') ? 'pdf' : 
                file.name.endsWith('.docx') || file.name.endsWith('.doc') ? 'doc' : 'excel',
          size: file.size,
          uploadDate: new Date(),
          surveyId: selectedSurvey,
          category: selectedCategory,
        };
        setFiles(prev => [...prev, newFile]);
        
        // Clear progress after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 2000);
        
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}: ${error}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    });
    
    setTimeout(() => setUploading(false), 1000);
  };

  const handleDeleteFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    const doc = documents.find(d => d.id === fileId);
    
    if (file) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
    
    if (doc) {
      deleteDocument(doc.id);
    }
  };

  const deleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file? This will also remove it from the chatbot\'s knowledge base.')) {
      handleDeleteFile(fileId);
    }
  };

  const downloadFile = (file: any) => {
    // For processed documents, create a text file with the content
    const doc = documents.find(d => d.id === file.id);
    if (doc) {
      const blob = new Blob([doc.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}_processed.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // For regular files, show a message since we don't store the original file
      alert('Original file download not available. Only processed content can be downloaded.');
    }
  };

  // Get processed documents for the selected survey
  const processedDocs = selectedSurvey ? getDocumentsBySurvey(selectedSurvey, selectedCategory) : [];
  
  // Merge files and processed documents for display
  const allFiles = [
    ...files.filter(f => (!selectedSurvey || f.surveyId === selectedSurvey) && (!selectedCategory || f.category === selectedCategory)),
    ...processedDocs.map(doc => ({
      id: doc.id,
      name: doc.fileName,
      type: doc.metadata.fileType.includes('pdf') ? 'pdf' as const :
            doc.metadata.fileType.includes('word') ? 'doc' as const : 'excel' as const,
      size: doc.metadata.wordCount * 6, // Approximate size
      uploadDate: doc.metadata.uploadDate,
      surveyId: doc.surveyId,
      category: doc.category || 'General Questions',
    }))
  ].filter((file, index, self) => 
    index === self.findIndex(f => f.name === file.name && f.surveyId === file.surveyId && f.category === file.category)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">File Management</h1>
      </div>

      {/* Survey Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Survey</h2>
        
        {/* Server Status Indicator */}
        <div className="mb-4 p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                serverStatus === 'online' ? 'bg-green-500' : 
                serverStatus === 'offline' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                Document Processing: Hybrid Mode (Client + Server)
              </span>
              <button
                onClick={checkServerStatus}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Refresh
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {serverStatus === 'online' 
              ? 'Client-side processing for SLM learning + Server-side processing for enhanced context and better text extraction'
              : serverStatus === 'offline'
              ? 'Server unavailable - Using client-side processing only (SLM will still function normally)'
              : 'Checking server status...'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {surveys.map((survey) => (
            <button
              key={survey.id}
              onClick={() => setSelectedSurvey(survey.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSurvey === survey.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{survey.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection */}
      {selectedSurvey && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === category.name
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{category.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File Upload */}
      {selectedSurvey && selectedCategory && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                Uploading to: {surveys.find(s => s.id === selectedSurvey)?.name} → {selectedCategory}
              </span>
            </div>
          </div>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : uploading
                ? 'border-orange-300 bg-orange-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${uploading ? 'text-orange-500 animate-bounce' : 'text-gray-400'}`} />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {uploading ? 'Processing files...' : 'Drop files here or click to upload'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, DOC, DOCX, XLS, XLSX files up to 50MB<br/>
              Files will be categorized under: <strong>{selectedCategory}</strong>
              • Optimized client-side processing for chatbot integration
            </p>
            
            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mb-4 space-y-2">
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="text-left">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{fileName}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`px-4 py-2 rounded-md cursor-pointer inline-flex items-center space-x-2 transition-colors ${
                uploading 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>{uploading ? 'Processing...' : 'Choose Files'}</span>
            </label>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Files {selectedSurvey && selectedCategory && `for ${surveys.find(s => s.id === selectedSurvey)?.name} → ${selectedCategory}`}
            </h2>
            {selectedSurvey && selectedCategory && (
              <div className="text-sm text-gray-500">
                {processedDocs.length} processed documents
              </div>
            )}
          </div>
          {selectedSurvey && !selectedCategory && (
            <div className="mt-2 text-sm text-amber-600">
              Please select a category to view and upload files
            </div>
          )}
        </div>
        <div className="divide-y divide-gray-200">
          {!selectedSurvey || !selectedCategory ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a survey and category to view files</p>
            </div>
          ) : allFiles.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No files uploaded for this category yet</p>
            </div>
          ) : (
            allFiles.map((file) => {
              const isProcessed = processedDocs.some(doc => doc.fileName === file.name);
              return (
              <div key={file.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getFileIcon(file.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {file.category}
                      </span>
                      {isProcessed && (
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Processed
                          </span>
                          {(() => {
                            const doc = processedDocs.find(d => d.fileName === file.name);
                            return doc && doc.images && doc.images.length > 0 ? (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {doc.images.length} images
                              </span>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • Uploaded {file.uploadDate.toLocaleDateString()}
                      {isProcessed && (
                        <span className="ml-2">• Available to chatbot{(() => {
                          const doc = processedDocs.find(d => d.fileName === file.name);
                          return doc && doc.images && doc.images.length > 0 ? ` with ${doc.images.length} visual references` : '';
                        })()}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => downloadFile(file)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Download processed content"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteFile(file.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}