import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ImageExtractor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
  }

  async init() {
    try {
      await this.initializeTempDir();
      console.log('✅ ImageExtractor initialized');
    } catch (error) {
      console.warn('⚠️ ImageExtractor initialization warning:', error.message);
    }
  }

  async initializeTempDir() {
    try {
      await fs.ensureDir(this.tempDir);
    } catch (error) {
      console.warn('Could not create temp directory for images:', error.message);
    }
  }

  async extractImages(file) {
    console.log(`Starting image extraction from ${file.originalname} (${file.mimetype})`);
    
    try {
      const images = [];
      
      // For now, create a document preview image as a placeholder
      // In a full implementation, this would extract actual images from the document
      const previewImage = {
        id: uuidv4(),
        fileName: `${file.originalname} - Document Preview`,
        description: `Visual preview of ${file.originalname} showing document structure and content`,
        dataUrl: this.generateDocumentPreview(file),
        type: 'document'
      };
      
      images.push(previewImage);
      
      // Add additional mock images based on file type for demonstration
      if (file.mimetype === 'application/pdf') {
        images.push({
          id: uuidv4(),
          fileName: `${file.originalname} - Page Structure`,
          description: 'Document page layout and formatting structure',
          dataUrl: this.generateStructurePreview(),
          type: 'structure'
        });
      } else if (file.mimetype.includes('sheet')) {
        images.push({
          id: uuidv4(),
          fileName: `${file.originalname} - Data Layout`,
          description: 'Spreadsheet data structure and organization',
          dataUrl: this.generateDataPreview(),
          type: 'data'
        });
      }
      
      console.log(`Image extraction completed: ${images.length} images generated for ${file.originalname}`);
      return images;
      
    } catch (error) {
      console.error(`Image extraction failed for ${file.originalname}:`, error);
      return [];
    }
  }

  generateDocumentPreview(file) {
    // Generate a simple SVG preview as base64
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <rect x="20" y="20" width="360" height="40" fill="#e9ecef" rx="4"/>
        <text x="30" y="45" font-family="Arial, sans-serif" font-size="14" fill="#495057">
          ${file.originalname}
        </text>
        <rect x="20" y="80" width="360" height="200" fill="white" stroke="#dee2e6" stroke-width="1"/>
        <line x1="30" y1="100" x2="370" y2="100" stroke="#dee2e6" stroke-width="1"/>
        <line x1="30" y1="120" x2="320" y2="120" stroke="#dee2e6" stroke-width="1"/>
        <line x1="30" y1="140" x2="350" y2="140" stroke="#dee2e6" stroke-width="1"/>
        <line x1="30" y1="160" x2="280" y2="160" stroke="#dee2e6" stroke-width="1"/>
        <line x1="30" y1="180" x2="340" y2="180" stroke="#dee2e6" stroke-width="1"/>
        <text x="30" y="220" font-family="Arial, sans-serif" font-size="12" fill="#6c757d">
          Document Type: ${this.getFileTypeDescription(file.mimetype)}
        </text>
        <text x="30" y="240" font-family="Arial, sans-serif" font-size="12" fill="#6c757d">
          Size: ${this.formatFileSize(file.size)}
        </text>
        <text x="30" y="260" font-family="Arial, sans-serif" font-size="12" fill="#6c757d">
          Status: Processed Successfully
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  generateStructurePreview() {
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <text x="20" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#495057">
          Document Structure
        </text>
        <rect x="20" y="50" width="360" height="30" fill="#e3f2fd" stroke="#2196f3" stroke-width="1"/>
        <text x="30" y="70" font-family="Arial, sans-serif" font-size="12" fill="#1976d2">
          Header Section
        </text>
        <rect x="20" y="90" width="360" height="80" fill="#f3e5f5" stroke="#9c27b0" stroke-width="1"/>
        <text x="30" y="110" font-family="Arial, sans-serif" font-size="12" fill="#7b1fa2">
          Main Content Area
        </text>
        <rect x="20" y="180" width="170" height="60" fill="#e8f5e8" stroke="#4caf50" stroke-width="1"/>
        <text x="30" y="200" font-family="Arial, sans-serif" font-size="12" fill="#388e3c">
          Data Section 1
        </text>
        <rect x="210" y="180" width="170" height="60" fill="#fff3e0" stroke="#ff9800" stroke-width="1"/>
        <text x="220" y="200" font-family="Arial, sans-serif" font-size="12" fill="#f57c00">
          Data Section 2
        </text>
        <rect x="20" y="250" width="360" height="30" fill="#fce4ec" stroke="#e91e63" stroke-width="1"/>
        <text x="30" y="270" font-family="Arial, sans-serif" font-size="12" fill="#c2185b">
          Footer Information
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  generateDataPreview() {
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <text x="20" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#495057">
          Data Structure
        </text>
        <!-- Table header -->
        <rect x="20" y="50" width="360" height="25" fill="#e3f2fd" stroke="#2196f3" stroke-width="1"/>
        <line x1="120" y1="50" x2="120" y2="75" stroke="#2196f3" stroke-width="1"/>
        <line x1="220" y1="50" x2="220" y2="75" stroke="#2196f3" stroke-width="1"/>
        <line x1="320" y1="50" x2="320" y2="75" stroke="#2196f3" stroke-width="1"/>
        <text x="30" y="67" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1976d2">Column A</text>
        <text x="130" y="67" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1976d2">Column B</text>
        <text x="230" y="67" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1976d2">Column C</text>
        <text x="330" y="67" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#1976d2">Column D</text>
        
        <!-- Table rows -->
        ${Array.from({length: 8}, (_, i) => {
          const y = 75 + (i * 25);
          const fillColor = i % 2 === 0 ? 'white' : '#f8f9fa';
          return `
            <rect x="20" y="${y}" width="360" height="25" fill="${fillColor}" stroke="#dee2e6" stroke-width="1"/>
            <line x1="120" y1="${y}" x2="120" y2="${y + 25}" stroke="#dee2e6" stroke-width="1"/>
            <line x1="220" y1="${y}" x2="220" y2="${y + 25}" stroke="#dee2e6" stroke-width="1"/>
            <line x1="320" y1="${y}" x2="320" y2="${y + 25}" stroke="#dee2e6" stroke-width="1"/>
            <text x="30" y="${y + 17}" font-family="Arial, sans-serif" font-size="10" fill="#495057">Data ${i + 1}</text>
            <text x="130" y="${y + 17}" font-family="Arial, sans-serif" font-size="10" fill="#495057">Value ${i + 1}</text>
            <text x="230" y="${y + 17}" font-family="Arial, sans-serif" font-size="10" fill="#495057">Info ${i + 1}</text>
            <text x="330" y="${y + 17}" font-family="Arial, sans-serif" font-size="10" fill="#495057">Result ${i + 1}</text>
          `;
        }).join('')}
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  getFileTypeDescription(mimetype) {
    const types = {
      'application/pdf': 'PDF Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'text/plain': 'Text File'
    };
    
    return types[mimetype] || 'Unknown';
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async cleanup() {
    try {
      // Clean up temp directory
      await fs.emptyDir(this.tempDir);
      console.log('Image extractor cleanup completed');
    } catch (error) {
      console.error('Image extractor cleanup error:', error);
    }
  }
}