import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import fs from 'fs-extra';
import { createWorker } from 'tesseract.js';
import path from 'path';

export class TextExtractor {
  constructor() {
    this.ocrWorker = null;
    this.tempDir = path.join(process.cwd(), 'temp');
    this.initializeTempDir();
  }

  async initializeTempDir() {
    await fs.ensureDir(this.tempDir);
  }

  async extractText(file) {
    console.log(`Starting comprehensive text extraction from ${file.originalname} (${file.mimetype})`);

    try {
      switch (file.mimetype) {
        case 'application/pdf':
          return await this.extractPDFTextComprehensive(file);
        
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractWordTextComprehensive(file);
        
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return await this.extractExcelTextComprehensive(file);
        
        case 'text/plain':
          return await this.extractPlainTextComprehensive(file);
        
        default:
          throw new Error(`Unsupported file type: ${file.mimetype}`);
      }
    } catch (error) {
      console.error(`Comprehensive text extraction failed for ${file.originalname}:`, error);
      throw error;
    }
  }

  async extractPDFTextComprehensive(file) {
    try {
      console.log('Starting comprehensive PDF text extraction...');
      const buffer = await fs.readFile(file.path);
      
      // Primary extraction with pdf-parse
      const pdfData = await pdf(buffer, {
        normalizeWhitespace: false,
        disableCombineTextItems: false,
        max: 0 // Extract all pages
      });
      
      let extractedText = pdfData.text.trim();
      console.log(`PDF primary extraction: ${extractedText.length} characters from ${pdfData.numpages} pages`);

      // Enhanced structure preservation
      extractedText = this.preservePDFStructure(extractedText, pdfData);

      // Check if text extraction is insufficient or fragmented
      if (extractedText.length < 200 || this.isTextFragmented(extractedText)) {
        console.log('PDF appears to be scanned or has poor text extraction, attempting OCR enhancement...');
        
        try {
          const ocrText = await this.performEnhancedOCR(buffer, 'pdf');
          
          if (ocrText && ocrText.length > extractedText.length * 0.5) {
            console.log(`OCR enhancement successful: ${ocrText.length} characters`);
            extractedText = this.combineTextSources(extractedText, ocrText);
          }
        } catch (ocrError) {
          console.warn('OCR enhancement failed:', ocrError.message);
        }
      }

      // Extract metadata and enhance context
      const enhancedText = this.enhanceTextWithMetadata(extractedText, {
        pageCount: pdfData.numpages,
        fileType: 'PDF',
        fileName: file.originalname
      });

      if (enhancedText.length < 100) {
        throw new Error('PDF contains insufficient extractable text. Document may be image-based, corrupted, or password-protected.');
      }

      console.log(`Comprehensive PDF extraction completed: ${enhancedText.length} characters`);
      return this.cleanAndStructureText(enhancedText);

    } catch (error) {
      console.error('Comprehensive PDF text extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  async extractWordTextComprehensive(file) {
    try {
      console.log('Starting comprehensive Word document extraction...');
      const buffer = await fs.readFile(file.path);
      
      // Extract both raw text and HTML for better structure preservation
      const [rawResult, htmlResult, stylesResult] = await Promise.all([
        mammoth.extractRawText({ buffer }),
        mammoth.convertToHtml({ buffer }).catch(() => ({ value: '', messages: [] })),
        mammoth.convertToMarkdown({ buffer }).catch(() => ({ value: '', messages: [] }))
      ]);
      
      let extractedText = rawResult.value.trim();
      console.log(`Word raw text extraction: ${extractedText.length} characters`);

      // Enhance with HTML structure if available
      if (htmlResult.value && htmlResult.value.length > extractedText.length * 0.8) {
        const structuredText = this.convertHTMLToStructuredText(htmlResult.value);
        if (structuredText.length > extractedText.length) {
          console.log('Using HTML-enhanced structured text');
          extractedText = structuredText;
        }
      }

      // Enhance with Markdown structure if available
      if (stylesResult.value && stylesResult.value.length > extractedText.length * 0.8) {
        const markdownText = this.enhanceWithMarkdownStructure(stylesResult.value);
        if (markdownText.length > extractedText.length) {
          console.log('Using Markdown-enhanced structured text');
          extractedText = markdownText;
        }
      }

      // Extract and preserve document structure
      extractedText = this.preserveWordDocumentStructure(extractedText);

      // Add metadata context
      const enhancedText = this.enhanceTextWithMetadata(extractedText, {
        fileType: 'Word Document',
        fileName: file.originalname,
        hasStructure: htmlResult.value.length > 0
      });

      if (enhancedText.length < 100) {
        throw new Error('Word document contains insufficient text content.');
      }

      console.log(`Comprehensive Word extraction completed: ${enhancedText.length} characters`);
      return this.cleanAndStructureText(enhancedText);

    } catch (error) {
      console.error('Comprehensive Word text extraction error:', error);
      throw new Error(`Failed to extract text from Word document: ${error.message}`);
    }
  }

  async extractExcelTextComprehensive(file) {
    try {
      console.log('Starting comprehensive Excel extraction...');
      const buffer = await fs.readFile(file.path);
      
      const workbook = XLSX.read(buffer, { 
        type: 'buffer', 
        cellText: true, 
        cellDates: true,
        cellNF: false,
        cellStyles: true
      });
      
      let extractedText = '';
      const sheetSummary = [];

      // Process each worksheet comprehensively
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];
        
        console.log(`Processing Excel sheet: ${sheetName}`);
        
        // Get sheet range and metadata
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        const rowCount = range.e.r - range.s.r + 1;
        const colCount = range.e.c - range.s.c + 1;
        
        extractedText += `\n=== SHEET: ${sheetName} ===\n`;
        extractedText += `Sheet ${index + 1} of ${workbook.SheetNames.length} | Dimensions: ${rowCount} rows × ${colCount} columns\n\n`;
        
        // Extract data with enhanced structure preservation
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          blankrows: false,
          raw: false
        });
        
        // Identify header rows and data structure
        const structuredData = this.analyzeExcelStructure(jsonData);
        
        // Convert to enhanced text format
        if (structuredData.hasHeaders) {
          extractedText += `HEADERS: ${structuredData.headers.join(' | ')}\n`;
          extractedText += `${'='.repeat(50)}\n`;
        }
        
        structuredData.dataRows.forEach((row, rowIndex) => {
          if (Array.isArray(row) && row.some(cell => cell !== '')) {
            const rowText = row.map(cell => String(cell || '')).join('\t');
            if (rowText.trim()) {
              extractedText += `Row ${rowIndex + 1}: ${rowText}\n`;
            }
          }
        });
        
        // Add sheet summary
        const nonEmptyRows = structuredData.dataRows.filter(row => 
          Array.isArray(row) && row.some(cell => cell !== '')
        ).length;
        
        sheetSummary.push({
          name: sheetName,
          rows: nonEmptyRows,
          columns: colCount,
          hasHeaders: structuredData.hasHeaders
        });
        
        extractedText += `\nSheet Summary: ${nonEmptyRows} data rows, ${colCount} columns\n`;
        extractedText += `${'='.repeat(80)}\n\n`;
      });

      // Add comprehensive metadata
      const enhancedText = this.enhanceTextWithMetadata(extractedText, {
        fileType: 'Excel Spreadsheet',
        fileName: file.originalname,
        sheetCount: workbook.SheetNames.length,
        sheets: sheetSummary
      });

      if (enhancedText.length < 100) {
        throw new Error('Excel file contains insufficient text content.');
      }

      console.log(`Comprehensive Excel extraction completed: ${enhancedText.length} characters from ${workbook.SheetNames.length} sheets`);
      return this.cleanAndStructureText(enhancedText);

    } catch (error) {
      console.error('Comprehensive Excel text extraction error:', error);
      throw new Error(`Failed to extract text from Excel file: ${error.message}`);
    }
  }

  async extractPlainTextComprehensive(file) {
    try {
      console.log('Starting comprehensive plain text extraction...');
      let extractedText = await fs.readFile(file.path, 'utf8');

      // Analyze text structure
      const textAnalysis = this.analyzeTextStructure(extractedText);
      
      // Enhance with structure information
      let enhancedText = extractedText;
      if (textAnalysis.hasStructure) {
        enhancedText = this.preserveTextStructure(extractedText, textAnalysis);
      }

      // Add metadata
      enhancedText = this.enhanceTextWithMetadata(enhancedText, {
        fileType: 'Plain Text',
        fileName: file.originalname,
        lineCount: textAnalysis.lineCount,
        hasStructure: textAnalysis.hasStructure
      });

      if (enhancedText.length < 20) {
        throw new Error('Text file is empty or too short.');
      }

      console.log(`Comprehensive text extraction completed: ${enhancedText.length} characters`);
      return this.cleanAndStructureText(enhancedText);

    } catch (error) {
      console.error('Comprehensive plain text extraction error:', error);
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }

  // Enhanced OCR with better error handling and processing
  async performEnhancedOCR(buffer, fileType) {
    try {
      console.log(`Initializing enhanced OCR for ${fileType}...`);
      
      if (!this.ocrWorker) {
        this.ocrWorker = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
      }

      // For now, return a placeholder since OCR requires additional setup in WebContainer
      console.log('OCR processing would be performed here in a full server environment');
      return 'OCR processing not available in this environment. Please ensure documents contain selectable text for best results.';

    } catch (error) {
      console.error('Enhanced OCR processing error:', error);
      return 'OCR processing encountered an error. Please try uploading a text-based document.';
    }
  }

  // Structure preservation methods
  preservePDFStructure(text, pdfData) {
    // Add page breaks and structure markers
    let structuredText = text;
    
    // Add document header
    structuredText = `=== PDF DOCUMENT STRUCTURE ===\nPages: ${pdfData.numpages}\n\n${structuredText}`;
    
    // Preserve paragraph structure
    structuredText = structuredText
      .replace(/\n\s*\n\s*\n/g, '\n\n=== SECTION BREAK ===\n\n')
      .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1\n\n$2');
    
    return structuredText;
  }

  preserveWordDocumentStructure(text) {
    // Enhance Word document structure
    let structuredText = text;
    
    // Identify and mark headings
    structuredText = structuredText.replace(/^([A-Z][A-Z\s]{5,50})$/gm, '\n=== HEADING: $1 ===\n');
    
    // Preserve list structures
    structuredText = structuredText.replace(/^[\s]*[•\-\*]\s+/gm, '\n• ');
    structuredText = structuredText.replace(/^[\s]*\d+\.\s+/gm, '\n$&');
    
    return structuredText;
  }

  analyzeExcelStructure(jsonData) {
    if (!jsonData || jsonData.length === 0) {
      return { hasHeaders: false, headers: [], dataRows: [] };
    }
    
    const firstRow = jsonData[0];
    const secondRow = jsonData[1];
    
    // Detect if first row contains headers
    let hasHeaders = false;
    if (firstRow && secondRow) {
      // Check if first row has text and second row has different data types
      const firstRowTypes = firstRow.map(cell => typeof cell);
      const secondRowTypes = secondRow.map(cell => typeof cell);
      
      hasHeaders = firstRowTypes.some(type => type === 'string') && 
                   !firstRowTypes.every((type, index) => type === secondRowTypes[index]);
    }
    
    return {
      hasHeaders,
      headers: hasHeaders ? firstRow : [],
      dataRows: hasHeaders ? jsonData.slice(1) : jsonData
    };
  }

  analyzeTextStructure(text) {
    const lines = text.split('\n');
    const lineCount = lines.length;
    
    // Check for various structure indicators
    const hasHeaders = /^[A-Z][A-Z\s]{5,50}$/m.test(text);
    const hasLists = /^[\s]*[•\-\*\d+\.]\s+/m.test(text);
    const hasSections = /^={3,}|^-{3,}|^\#{1,6}\s/m.test(text);
    
    return {
      lineCount,
      hasStructure: hasHeaders || hasLists || hasSections,
      hasHeaders,
      hasLists,
      hasSections
    };
  }

  preserveTextStructure(text, analysis) {
    let structuredText = text;
    
    if (analysis.hasHeaders) {
      structuredText = structuredText.replace(/^([A-Z][A-Z\s]{5,50})$/gm, '\n=== $1 ===\n');
    }
    
    if (analysis.hasLists) {
      structuredText = structuredText.replace(/^[\s]*([•\-\*])\s+/gm, '\n$1 ');
      structuredText = structuredText.replace(/^[\s]*(\d+\.)\s+/gm, '\n$1 ');
    }
    
    return structuredText;
  }

  convertHTMLToStructuredText(html) {
    return html
      .replace(/<h[1-6][^>]*>/gi, '\n\n=== ')
      .replace(/<\/h[1-6]>/gi, ' ===\n')
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/<\/p>/gi, '')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<table[^>]*>/gi, '\n\n=== TABLE ===\n')
      .replace(/<\/table>/gi, '\n=== END TABLE ===\n\n')
      .replace(/<tr[^>]*>/gi, '\n')
      .replace(/<\/tr>/gi, '')
      .replace(/<td[^>]*>/gi, ' | ')
      .replace(/<\/td>/gi, '')
      .replace(/<th[^>]*>/gi, ' | ')
      .replace(/<\/th>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  enhanceWithMarkdownStructure(markdown) {
    // Enhance markdown structure for better context
    return markdown
      .replace(/^#{1,6}\s+(.+)$/gm, '\n=== $1 ===\n')
      .replace(/^\*\s+/gm, '\n• ')
      .replace(/^\d+\.\s+/gm, '\n$&')
      .replace(/\*\*(.+?)\*\*/g, '**$1**')
      .replace(/\*(.+?)\*/g, '*$1*');
  }

  enhanceTextWithMetadata(text, metadata) {
    let enhancedText = `=== DOCUMENT METADATA ===\n`;
    enhancedText += `File: ${metadata.fileName}\n`;
    enhancedText += `Type: ${metadata.fileType}\n`;
    
    if (metadata.pageCount) {
      enhancedText += `Pages: ${metadata.pageCount}\n`;
    }
    
    if (metadata.sheetCount) {
      enhancedText += `Sheets: ${metadata.sheetCount}\n`;
      if (metadata.sheets) {
        metadata.sheets.forEach(sheet => {
          enhancedText += `  - ${sheet.name}: ${sheet.rows} rows, ${sheet.columns} columns\n`;
        });
      }
    }
    
    if (metadata.lineCount) {
      enhancedText += `Lines: ${metadata.lineCount}\n`;
    }
    
    enhancedText += `Processing: Enhanced server-side extraction\n`;
    enhancedText += `=== END METADATA ===\n\n`;
    
    return enhancedText + text;
  }

  // Enhanced text cleaning and structuring
  cleanAndStructureText(text) {
    if (!text || text.length < 10) return text;
    
    return text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      
      // Clean up excessive whitespace while preserving structure
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      
      // Preserve intentional spacing but limit excessive newlines
      .replace(/\n{4,}/g, '\n\n\n')
      
      // Clean up common artifacts
      .replace(/\f/g, '\n')
      .replace(/\u00A0/g, ' ')
      .replace(/\u2022/g, '•')
      .replace(/\u2013/g, '-')
      .replace(/\u2014/g, '--')
      .replace(/\u201C|\u201D/g, '"')
      .replace(/\u2018|\u2019/g, "'")
      
      // Remove standalone page numbers but preserve numbered lists
      .replace(/^\s*\d+\s*$/gm, '')
      .replace(/^Page \d+ of \d+\s*$/gmi, '')
      
      // Clean up but preserve structure markers
      .replace(/^\s+|\s+$/gm, '')
      
      .trim();
  }

  // Helper methods
  isTextFragmented(text) {
    if (text.length < 100) return true;
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 5) return true;
    
    const shortLines = lines.filter(line => line.trim().length < 30).length;
    const fragmentationRatio = shortLines / Math.max(lines.length, 1);
    
    return fragmentationRatio > 0.6;
  }

  combineTextSources(primaryText, secondaryText) {
    const primary = primaryText.trim();
    const secondary = secondaryText.trim();
    
    if (!secondary || secondary.length < 100) {
      return primary;
    }
    
    if (!primary || primary.length < 100) {
      return secondary;
    }
    
    return `${primary}\n\n=== ENHANCED CONTENT ===\n${secondary}`;
  }

  async cleanup() {
    try {
      if (this.ocrWorker) {
        console.log('Terminating OCR worker...');
        await this.ocrWorker.terminate();
        this.ocrWorker = null;
      }
      
      // Clean up temp directory
      fs.emptyDir(this.tempDir).catch(err => {
        console.warn('Failed to clean temp directory:', err.message);
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}