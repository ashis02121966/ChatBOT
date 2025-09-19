# Survey ChatBot Application

An intelligent survey assistant powered by Small Language Models (SLM) with document processing capabilities and Supabase integration.

## Features

- **SLM-Powered Chat**: Intelligent responses using @xenova/transformers
- **Document Processing**: Upload and process PDF, Word, Excel, and text files
- **Image Extraction**: Extract and display images from documents
- **Admin Knowledge Base**: Admin-provided Q&A with rich text and images
- **Multi-Role Support**: Admin, Enumerator, Supervisor, ZO, RO roles
- **Real-time Data**: Supabase integration for persistent data storage
- **Hybrid Processing**: Client-side + server-side document processing

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration (optional - will fallback to localStorage)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration (optional)
VITE_SERVER_URL=http://localhost:3001
```

### 2. Supabase Setup (Optional)

If you want to use Supabase for data persistence:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to the `.env` file
3. Run the migration file in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of supabase/migrations/create_survey_chatbot_schema.sql
   ```
4. The application will automatically detect Supabase configuration and use it for data storage

### 3. Installation and Development

```bash
# Install dependencies
npm install

# Start development server (client + server)
npm run dev

# Or start only the client (if you don't need server-side processing)
npm run dev:client
```

### 4. Demo Credentials

The application includes demo users for testing:

- **Admin**: admin@example.com / password123
- **Enumerator**: enum@example.com / password123
- **Supervisor**: super@example.com / password123
- **ZO**: zo@example.com / password123
- **RO**: ro@example.com / password123

## Architecture

### Data Storage Options

1. **Supabase (Recommended)**: Real-time database with authentication
2. **localStorage (Fallback)**: Browser-based storage for development

### Document Processing

1. **Client-side**: Uses browser libraries for immediate SLM integration
2. **Server-side**: Enhanced processing with better text extraction (optional)

### Error Handling

Enhanced error logging for document processing issues:
- Detailed Word document extraction errors
- File validation and corruption detection
- Network connectivity diagnostics

## Troubleshooting

### Word Document Upload Issues

If you encounter "Failed to extract text from Word document" errors:

1. **Check file format**: Use `.docx` format (recommended over `.doc`)
2. **Remove password protection**: Ensure the document is not password-protected
3. **Verify file integrity**: Try opening the file in Microsoft Word
4. **Check file size**: Ensure the file is under 50MB
5. **Review console logs**: Check browser developer tools for detailed error messages

### Supabase Connection Issues

1. **Verify environment variables**: Check `.env` file configuration
2. **Check network connectivity**: Ensure you can reach supabase.com
3. **Review RLS policies**: Ensure Row Level Security policies allow your operations
4. **Fallback behavior**: The app will automatically fall back to localStorage if Supabase is unavailable

### SLM Model Loading Issues

1. **Network connectivity**: Models are downloaded from Hugging Face
2. **Browser compatibility**: Ensure your browser supports WebAssembly
3. **Memory limitations**: Large models may require sufficient RAM
4. **Fallback responses**: The system provides intelligent fallbacks if models fail to load

## Development

### Adding New File Types

1. Update `DocumentService.ts` for server-side processing
2. Add extraction methods in `DocumentContext.tsx`
3. Update file type validation in both client and server

### Extending SLM Capabilities

1. Modify `SLMService.ts` to add new model types
2. Update knowledge base in `initializeKnowledgeBase()`
3. Enhance response generation logic

### Database Schema Changes

1. Create new migration files in `supabase/migrations/`
2. Update TypeScript interfaces in context files
3. Test with both Supabase and localStorage fallback

## Production Deployment

1. **Environment Variables**: Set production Supabase credentials
2. **Build Optimization**: Run `npm run build` for optimized production build
3. **Server Deployment**: Deploy the server component for enhanced document processing
4. **CDN Configuration**: Configure CDN for static assets and model files
5. **Monitoring**: Set up error tracking and performance monitoring
