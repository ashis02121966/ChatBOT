import React, { useState } from 'react';
import { Code, Copy, CheckCircle, Book, Key, Zap } from 'lucide-react';

export default function ApiDocs() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string>('');

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(''), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/chat',
      description: 'Send a message to the chatbot',
      body: {
        message: 'string',
        surveyId: 'string',
        userId: 'string'
      },
      response: {
        response: 'string',
        confidence: 'number',
        isAnswered: 'boolean'
      }
    },
    {
      method: 'GET',
      path: '/api/surveys',
      description: 'Get list of available surveys',
      response: {
        surveys: [
          {
            id: 'string',
            name: 'string',
            description: 'string'
          }
        ]
      }
    },
    {
      method: 'POST',
      path: '/api/surveys/{id}/files',
      description: 'Upload files for a specific survey',
      body: {
        files: 'FormData'
      },
      response: {
        success: 'boolean',
        uploadedFiles: 'array'
      }
    },
    {
      method: 'GET',
      path: '/api/chat/history',
      description: 'Get chat history for a user',
      params: {
        userId: 'string',
        surveyId: 'string (optional)'
      },
      response: {
        sessions: [
          {
            id: 'string',
            messages: 'array',
            createdAt: 'string'
          }
        ]
      }
    }
  ];

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Book className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Integrate the Survey ChatBot into your applications using our RESTful API
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Quick Start
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Base URL</h3>
              <div className="bg-gray-100 rounded-md p-3 font-mono text-sm">
                https://your-domain.com/api
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Authentication</h3>
              <p className="text-gray-600 mb-2">Include your API key in the request headers:</p>
              <div className="bg-gray-100 rounded-md p-3 font-mono text-sm">
                Authorization: Bearer YOUR_API_KEY
              </div>
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Key className="h-5 w-5 mr-2 text-blue-500" />
            API Key Management
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 mb-3">
              <strong>Demo API Key:</strong> sk-demo-1234567890abcdef
            </p>
            <p className="text-blue-700 text-sm">
              Contact your administrator to get a production API key for your integration.
            </p>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">API Endpoints</h2>
          
          {endpoints.map((endpoint, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                </div>
                
                <p className="text-gray-600 mb-4">{endpoint.description}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Request */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Request</h4>
                    
                    {endpoint.body && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Request Body:</h5>
                        <div className="relative">
                          <pre className="bg-gray-100 rounded-md p-3 text-sm overflow-x-auto">
                            <code>{JSON.stringify(endpoint.body, null, 2)}</code>
                          </pre>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(endpoint.body, null, 2), `${endpoint.method}-${index}-body`)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            {copiedEndpoint === `${endpoint.method}-${index}-body` ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {endpoint.params && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Parameters:</h5>
                        <div className="relative">
                          <pre className="bg-gray-100 rounded-md p-3 text-sm overflow-x-auto">
                            <code>{JSON.stringify(endpoint.params, null, 2)}</code>
                          </pre>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(endpoint.params, null, 2), `${endpoint.method}-${index}-params`)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            {copiedEndpoint === `${endpoint.method}-${index}-params` ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* cURL Example */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">cURL Example:</h5>
                      <div className="relative">
                        <pre className="bg-gray-900 text-green-400 rounded-md p-3 text-sm overflow-x-auto">
                          <code>
{`curl -X ${endpoint.method} \\
  https://your-domain.com/api${endpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
{endpoint.body && ` \\
  -d '${JSON.stringify(endpoint.body)}'`}
                          </code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(
                            `curl -X ${endpoint.method} https://your-domain.com/api${endpoint.path} -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json"${endpoint.body ? ` -d '${JSON.stringify(endpoint.body)}'` : ''}`,
                            `${endpoint.method}-${index}-curl`
                          )}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-300"
                        >
                          {copiedEndpoint === `${endpoint.method}-${index}-curl` ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Response */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Response</h4>
                    <div className="relative">
                      <pre className="bg-gray-100 rounded-md p-3 text-sm overflow-x-auto">
                        <code>{JSON.stringify(endpoint.response, null, 2)}</code>
                      </pre>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(endpoint.response, null, 2), `${endpoint.method}-${index}-response`)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedEndpoint === `${endpoint.method}-${index}-response` ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Codes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">HTTP Status Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-semibold rounded">200</span>
                <span className="text-sm text-gray-900">OK - Request successful</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-semibold rounded">201</span>
                <span className="text-sm text-gray-900">Created - Resource created</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold rounded">400</span>
                <span className="text-sm text-gray-900">Bad Request - Invalid request</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold rounded">401</span>
                <span className="text-sm text-gray-900">Unauthorized - Invalid API key</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold rounded">404</span>
                <span className="text-sm text-gray-900">Not Found - Resource not found</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold rounded">500</span>
                <span className="text-sm text-gray-900">Server Error - Internal error</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}