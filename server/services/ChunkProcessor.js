import { v4 as uuidv4 } from 'uuid';

export class ChunkProcessor {
  constructor() {
    this.maxChunkSize = 1200; // Increased for better context
    this.overlapSize = 200;   // Increased overlap for better continuity
    this.minChunkSize = 150;  // Minimum chunk size to avoid tiny fragments
  }

  async createChunks(content, fileName) {
    console.log(`Creating comprehensive chunks for ${fileName} (${content.length} characters)`);
    
    try {
      const chunks = [];
      
      // Enhanced section identification with multiple strategies
      const sections = this.identifyDocumentSections(content);
      
      if (sections.length > 1) {
        console.log(`Found ${sections.length} logical sections in document`);
        sections.forEach((section, index) => {
          const sectionChunks = this.processSectionIntoChunks(section, fileName, index);
          chunks.push(...sectionChunks);
        });
      } else {
        // Enhanced content-aware chunking
        console.log('Using enhanced content-aware chunking');
        const contentChunks = this.createContentAwareChunks(content, fileName);
        chunks.push(...contentChunks);
      }

      // Ensure we have at least one chunk
      if (chunks.length === 0) {
        chunks.push(this.createFallbackChunk(content, fileName));
      }

      // Post-process chunks for quality and coherence
      const processedChunks = this.postProcessChunks(chunks, content);

      console.log(`Created ${processedChunks.length} high-quality chunks for ${fileName}`);
      return processedChunks;

    } catch (error) {
      console.error(`Comprehensive chunk creation failed for ${fileName}:`, error);
      return [this.createFallbackChunk(content, fileName)];
    }
  }

  identifyDocumentSections(content) {
    console.log('Identifying document sections with enhanced analysis...');
    
    const strategies = [
      this.identifyByMetadataMarkers,
      this.identifyByHeadings,
      this.identifyByNumberedSections,
      this.identifyByStructuralMarkers,
      this.identifyByContentPatterns
    ];

    let bestSections = [{ title: 'Document', content: content, index: 0, type: 'full' }];
    let bestScore = 0;

    for (const strategy of strategies) {
      try {
        const sections = strategy.call(this, content);
        const score = this.evaluateSectionQuality(sections, content);
        
        if (score > bestScore && sections.length > 1) {
          bestSections = sections;
          bestScore = score;
          console.log(`Using section strategy with score ${score}: found ${sections.length} sections`);
        }
      } catch (error) {
        console.warn('Section identification strategy failed:', error);
      }
    }

    return bestSections;
  }

  identifyByMetadataMarkers(content) {
    const sections = [];
    const metadataPattern = /=== (.+?) ===/g;
    const matches = [...content.matchAll(metadataPattern)];

    if (matches.length > 1) {
      let lastIndex = 0;
      
      matches.forEach((match, index) => {
        if (index > 0) {
          const sectionContent = content.substring(lastIndex, match.index).trim();
          if (sectionContent.length > this.minChunkSize) {
            sections.push({
              title: matches[index - 1][1] || `Section ${index}`,
              content: sectionContent,
              index: index - 1,
              type: 'metadata'
            });
          }
        }
        lastIndex = match.index;
      });

      // Add final section
      const finalSection = content.substring(lastIndex).trim();
      if (finalSection.length > this.minChunkSize) {
        const lastMatch = matches[matches.length - 1];
        sections.push({
          title: lastMatch[1] || `Section ${sections.length + 1}`,
          content: finalSection,
          index: sections.length,
          type: 'metadata'
        });
      }
    }

    return sections;
  }

  identifyByHeadings(content) {
    const sections = [];
    const headingPatterns = [
      // Enhanced heading patterns
      /\n\s*(?:SECTION|CHAPTER|PART|HEADING)\s*[:\-]?\s*([^\n]{5,80})\n/gi,
      /\n\s*([IVX\d]+)\.\s+([A-Z][^\n]{10,60})\n/g,
      /\n\s*(\d+\.\d+)\s+([A-Z][^\n]{5,50})\n/g,
      /\n\s*([A-Z][A-Z\s]{8,50})\n(?=\s*[A-Z])/g,
      /\n\s*={3,}\s*\n\s*([^\n]{10,60})\s*\n\s*={3,}\s*\n/g
    ];

    let bestMatches = [];
    let bestPattern = null;

    for (const pattern of headingPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > bestMatches.length && matches.length > 1) {
        bestMatches = matches;
        bestPattern = pattern;
      }
    }

    if (bestMatches.length > 1) {
      let lastIndex = 0;
      
      bestMatches.forEach((match, index) => {
        if (index > 0) {
          const sectionContent = content.substring(lastIndex, match.index).trim();
          if (sectionContent.length > this.minChunkSize) {
            const title = this.extractSectionTitle(sectionContent) || 
                         bestMatches[index - 1][1] || 
                         bestMatches[index - 1][2] || 
                         `Section ${index}`;
            sections.push({
              title: title,
              content: sectionContent,
              index: index - 1,
              type: 'heading'
            });
          }
        }
        lastIndex = match.index;
      });

      // Add final section
      const finalSection = content.substring(lastIndex).trim();
      if (finalSection.length > this.minChunkSize) {
        const lastMatch = bestMatches[bestMatches.length - 1];
        const title = lastMatch[1] || lastMatch[2] || `Section ${sections.length + 1}`;
        sections.push({
          title: title,
          content: finalSection,
          index: sections.length,
          type: 'heading'
        });
      }
    }

    return sections;
  }

  identifyByNumberedSections(content) {
    const sections = [];
    const numberedPattern = /\n\s*(\d+(?:\.\d+)*)\s+([^\n]{10,80})\n/g;
    const matches = [...content.matchAll(numberedPattern)];

    if (matches.length > 2) {
      let lastIndex = 0;
      
      matches.forEach((match, index) => {
        if (index > 0) {
          const sectionContent = content.substring(lastIndex, match.index).trim();
          if (sectionContent.length > this.minChunkSize) {
            sections.push({
              title: matches[index - 1][2] || `Section ${matches[index - 1][1]}`,
              content: sectionContent,
              index: index - 1,
              type: 'numbered'
            });
          }
        }
        lastIndex = match.index;
      });

      // Add final section
      const finalSection = content.substring(lastIndex).trim();
      if (finalSection.length > this.minChunkSize) {
        const lastMatch = matches[matches.length - 1];
        sections.push({
          title: lastMatch[2] || `Section ${lastMatch[1]}`,
          content: finalSection,
          index: sections.length,
          type: 'numbered'
        });
      }
    }

    return sections;
  }

  identifyByStructuralMarkers(content) {
    const sections = [];
    const structuralPatterns = [
      /\n\s*SHEET:\s*([^\n]+)\n/g,
      /\n\s*TABLE\s*[:\-]?\s*([^\n]*)\n/g,
      /\n\s*SECTION BREAK\s*\n/g
    ];

    for (const pattern of structuralPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 1) {
        let lastIndex = 0;
        
        matches.forEach((match, index) => {
          if (index > 0) {
            const sectionContent = content.substring(lastIndex, match.index).trim();
            if (sectionContent.length > this.minChunkSize) {
              const title = matches[index - 1][1] || `Structural Section ${index}`;
              sections.push({
                title: title,
                content: sectionContent,
                index: index - 1,
                type: 'structural'
              });
            }
          }
          lastIndex = match.index;
        });

        // Add final section
        const finalSection = content.substring(lastIndex).trim();
        if (finalSection.length > this.minChunkSize) {
          const lastMatch = matches[matches.length - 1];
          sections.push({
            title: lastMatch[1] || `Structural Section ${sections.length + 1}`,
            content: finalSection,
            index: sections.length,
            type: 'structural'
          });
        }

        if (sections.length > 1) break;
      }
    }

    return sections;
  }

  identifyByContentPatterns(content) {
    const sections = [];
    const contentPatterns = [
      /\n\s*(?:INTRODUCTION|OVERVIEW|BACKGROUND|METHODOLOGY|PROCEDURE|RESULTS|CONCLUSION|SUMMARY|APPENDIX)\s*\n/gi,
      /\n\s*(?:STEP|PHASE|STAGE)\s+\d+[:\s]/gi,
      /\n\s*(?:Row \d+:|Sheet \d+:)/gi
    ];

    for (const pattern of contentPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 1) {
        let lastIndex = 0;
        
        matches.forEach((match, index) => {
          if (index > 0) {
            const sectionContent = content.substring(lastIndex, match.index).trim();
            if (sectionContent.length > this.minChunkSize) {
              sections.push({
                title: matches[index - 1][0].trim(),
                content: sectionContent,
                index: index - 1,
                type: 'content-pattern'
              });
            }
          }
          lastIndex = match.index;
        });

        // Add final section
        const finalSection = content.substring(lastIndex).trim();
        if (finalSection.length > this.minChunkSize) {
          sections.push({
            title: matches[matches.length - 1][0].trim(),
            content: finalSection,
            index: sections.length,
            type: 'content-pattern'
          });
        }

        if (sections.length > 1) break;
      }
    }

    return sections;
  }

  evaluateSectionQuality(sections, originalContent) {
    if (sections.length <= 1) return 0;

    let score = 0;
    const totalLength = originalContent.length;
    let coveredLength = 0;

    sections.forEach(section => {
      coveredLength += section.content.length;
      
      // Prefer sections of reasonable size
      if (section.content.length >= this.minChunkSize && section.content.length <= this.maxChunkSize * 2) {
        score += 15;
      }
      
      // Bonus for meaningful titles
      if (section.title && section.title.length > 5 && section.title.length < 100) {
        score += 8;
      }
      
      // Bonus for balanced section sizes
      const sizeRatio = section.content.length / (totalLength / sections.length);
      if (sizeRatio >= 0.3 && sizeRatio <= 3.0) {
        score += 5;
      }
      
      // Bonus for specific section types
      if (section.type === 'metadata' || section.type === 'heading') {
        score += 10;
      }
    });

    // Coverage bonus
    const coverage = coveredLength / totalLength;
    if (coverage > 0.8) {
      score += 25;
    }

    return score;
  }

  createContentAwareChunks(content, fileName) {
    const chunks = [];
    
    // Enhanced paragraph detection with structure preservation
    const structuralElements = this.identifyStructuralElements(content);
    const paragraphs = this.splitIntoLogicalParagraphs(content, structuralElements);
    
    let currentChunk = '';
    let chunkIndex = 0;
    let currentStructure = [];

    paragraphs.forEach(paragraph => {
      const trimmedParagraph = paragraph.content.trim();
      
      if (currentChunk.length + trimmedParagraph.length > this.maxChunkSize && currentChunk.length > this.minChunkSize) {
        // Create chunk with current content
        chunks.push(this.createEnhancedChunk(currentChunk, fileName, chunkIndex, currentStructure));
        
        // Start new chunk with intelligent overlap
        const overlap = this.getIntelligentOverlap(currentChunk, trimmedParagraph);
        currentChunk = overlap + trimmedParagraph;
        currentStructure = paragraph.structure ? [paragraph.structure] : [];
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
        if (paragraph.structure) {
          currentStructure.push(paragraph.structure);
        }
      }
    });

    // Add final chunk
    if (currentChunk.trim() && currentChunk.length >= this.minChunkSize) {
      chunks.push(this.createEnhancedChunk(currentChunk, fileName, chunkIndex, currentStructure));
    } else if (currentChunk.trim() && chunks.length > 0) {
      // Merge small final chunk with previous chunk
      const lastChunk = chunks[chunks.length - 1];
      lastChunk.content += '\n\n' + currentChunk.trim();
      lastChunk.metadata.wordCount += currentChunk.split(/\s+/).filter(word => word.length > 0).length;
      lastChunk.metadata.characterCount += currentChunk.length;
    }

    return chunks;
  }

  identifyStructuralElements(content) {
    const elements = [];
    
    // Enhanced list detection
    const listItems = [...content.matchAll(/^[\s]*[•\-\*\d+\.]\s+.+$/gm)];
    listItems.forEach(match => {
      elements.push({
        type: 'list_item',
        start: match.index,
        end: match.index + match[0].length,
        content: match[0]
      });
    });
    
    // Enhanced table detection
    const tableRows = [...content.matchAll(/^.+\t.+\t.+$/gm)];
    tableRows.forEach(match => {
      elements.push({
        type: 'table_row',
        start: match.index,
        end: match.index + match[0].length,
        content: match[0]
      });
    });
    
    // Code blocks and formatted sections
    const codeBlocks = [...content.matchAll(/```[\s\S]*?```/g)];
    codeBlocks.forEach(match => {
      elements.push({
        type: 'code_block',
        start: match.index,
        end: match.index + match[0].length,
        content: match[0]
      });
    });

    // Metadata sections
    const metadataSections = [...content.matchAll(/=== .+? ===/g)];
    metadataSections.forEach(match => {
      elements.push({
        type: 'metadata',
        start: match.index,
        end: match.index + match[0].length,
        content: match[0]
      });
    });

    return elements.sort((a, b) => a.start - b.start);
  }

  splitIntoLogicalParagraphs(content, structuralElements) {
    const paragraphs = [];
    const rawParagraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 30);
    
    rawParagraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      
      // Determine if this paragraph contains structural elements
      const containedElements = structuralElements.filter(element => 
        content.indexOf(trimmed) <= element.start && 
        element.end <= content.indexOf(trimmed) + trimmed.length
      );
      
      let structure = null;
      if (containedElements.length > 0) {
        const types = [...new Set(containedElements.map(e => e.type))];
        structure = {
          types: types,
          count: containedElements.length,
          priority: this.getStructurePriority(types)
        };
      }
      
      paragraphs.push({
        content: trimmed,
        structure: structure,
        length: trimmed.length
      });
    });
    
    return paragraphs;
  }

  getStructurePriority(types) {
    const priorities = {
      'metadata': 12,
      'code_block': 10,
      'table_row': 8,
      'list_item': 6,
      'heading': 9
    };
    
    return Math.max(...types.map(type => priorities[type] || 1));
  }

  getIntelligentOverlap(currentChunk, nextParagraph) {
    if (currentChunk.length <= this.overlapSize) {
      return currentChunk + '\n\n';
    }
    
    // Try to find a good breaking point for overlap
    const sentences = currentChunk.split(/(?<=[.!?])\s+/);
    let overlap = '';
    let i = sentences.length - 1;
    
    while (i >= 0 && overlap.length < this.overlapSize) {
      const sentence = sentences[i].trim();
      if (sentence.length > 15) { // Avoid very short fragments
        overlap = sentence + (overlap ? ' ' + overlap : '');
      }
      i--;
    }
    
    return overlap ? overlap + '\n\n' : '';
  }

  createEnhancedChunk(content, fileName, index, structures = []) {
    const keywords = this.extractEnhancedKeywords(content);
    const entities = this.extractEnhancedEntities(content);
    const contentType = this.determineContentType(content, structures);
    
    return {
      id: `${fileName}-chunk-${index}-${uuidv4()}`,
      content: content.trim(),
      metadata: {
        section: this.generateSectionTitle(content, structures),
        keywords: keywords,
        entities: entities,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: content.length,
        contentType: contentType,
        structures: structures,
        importance: this.calculateImportance(content, keywords, structures),
        hasNumbers: /\d+/.test(content),
        hasProcedures: /\b(?:step|procedure|process|method|instruction|follow|complete|ensure|first|then|next|finally)\b/i.test(content),
        hasDefinitions: /\b(?:is|are|means|refers to|defined as|definition|term|called)\b/i.test(content),
        hasQuestions: /\b(?:question|ask|answer|response|survey|interview|what|how|when|where|why)\b/i.test(content),
        hasFormFields: /\b(?:field|form|block|section|data entry|input|select|choose|checkbox|radio)\b/i.test(content),
        hasLists: /^[\s]*[•\-\*\d+\.]\s+/m.test(content),
        hasTables: /\t.*\t/.test(content) || /\|.*\|/.test(content),
        hasMetadata: /=== .+? ===/.test(content),
        contextQuality: this.assessContextQuality(content)
      }
    };
  }

  extractEnhancedKeywords(text) {
    // Enhanced keyword extraction with domain-specific terms
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
      'from', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'who', 'how', 'why',
      'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
      'same', 'so', 'than', 'too', 'very', 'just', 'now', 'also', 'here', 'then', 'well', 'back'
    ]);
    
    const surveyTerms = new Set([
      'capi', 'cati', 'cawi', 'papi', 'survey', 'questionnaire', 'enumeration', 'enumerator',
      'supervisor', 'respondent', 'household', 'interview', 'data', 'collection', 'field',
      'sampling', 'population', 'census', 'block', 'form', 'procedure', 'instruction',
      'validation', 'quality', 'control', 'training', 'manual', 'guide', 'protocol',
      'methodology', 'analysis', 'reporting', 'documentation', 'sheet', 'row', 'column'
    ]);

    const lowerText = text.toLowerCase();
    const words = lowerText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const wordCount = {};
    const totalWords = words.length;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!commonWords.has(word) || surveyTerms.has(word)) {
        let weight = 1;
        
        // Higher weight for survey-specific terms
        if (surveyTerms.has(word)) {
          weight = 4;
        }
        
        // Higher weight for words appearing early in the text
        if (i < totalWords * 0.1) {
          weight *= 1.5;
        }
        
        // Higher weight for capitalized terms in original text
        const originalWord = text.split(/\s+/)[i];
        if (originalWord && /^[A-Z]/.test(originalWord)) {
          weight *= 1.3;
        }
        
        wordCount[word] = (wordCount[word] || 0) + weight;
      }
    }

    const keywords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 25)
      .map(([word]) => word);

    // Ensure important survey terms are included
    surveyTerms.forEach(term => {
      if (lowerText.includes(term) && !keywords.includes(term) && keywords.length < 30) {
        keywords.push(term);
      }
    });

    return keywords.slice(0, 30);
  }

  extractEnhancedEntities(text) {
    if (!text || text.length < 50) return [];
    
    const entities = [];
    
    const patterns = [
      { regex: /\b\d+(?:\.\d+)?(?:\s*%|\s*percent)?\b/g, limit: 10 },
      { regex: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, limit: 8 },
      { regex: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, limit: 15 },
      { regex: /\b[A-Z]{2,}\b/g, limit: 10 },
      { regex: /\b[A-Z]\d+\b|\b\d+[A-Z]\b/g, limit: 8 },
      { regex: /Sheet:\s*([^\n]+)/g, limit: 5 },
      { regex: /Row \d+:/g, limit: 8 }
    ];
    
    patterns.forEach(({ regex, limit }) => {
      const matches = text.match(regex) || [];
      entities.push(...matches.slice(0, limit));
    });

    return [...new Set(entities)].slice(0, 25);
  }

  determineContentType(content, structures) {
    const contentLower = content.toLowerCase();
    
    if (structures && structures.some(s => s.types.includes('metadata'))) {
      return 'metadata';
    }
    
    if (structures && structures.some(s => s.types.includes('table_row'))) {
      return 'table';
    }
    
    if (structures && structures.some(s => s.types.includes('list_item'))) {
      return 'list';
    }
    
    if (structures && structures.some(s => s.types.includes('code_block'))) {
      return 'code';
    }
    
    if (/\b(?:step|procedure|process|method|instruction)\b/i.test(content)) {
      return 'procedure';
    }
    
    if (/\b(?:definition|means|refers to|defined as)\b/i.test(content)) {
      return 'definition';
    }
    
    if (/\b(?:form|field|questionnaire|survey)\b/i.test(content)) {
      return 'form';
    }
    
    if (/\b(?:example|instance|case|sample)\b/i.test(content)) {
      return 'example';
    }
    
    if (/sheet:|row \d+:/i.test(content)) {
      return 'data';
    }
    
    return 'general';
  }

  generateSectionTitle(content, structures) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      
      // Check if first line looks like a title
      if (firstLine.length < 100 && firstLine.length > 5 && 
          !firstLine.endsWith('.') && 
          /^[A-Z]/.test(firstLine)) {
        return firstLine;
      }
      
      // Check for metadata markers
      const metadataMatch = firstLine.match(/=== (.+?) ===/);
      if (metadataMatch) {
        return metadataMatch[1];
      }
    }
    
    // Generate title based on content type
    if (structures && structures.length > 0) {
      const primaryType = structures[0].types[0];
      switch (primaryType) {
        case 'metadata': return 'Document Metadata';
        case 'table_row': return 'Data Table';
        case 'list_item': return 'List Items';
        case 'code_block': return 'Code Section';
        default: return 'Structured Content';
      }
    }
    
    // Generate title based on keywords
    const keywords = this.extractEnhancedKeywords(content);
    if (keywords.length > 0) {
      return `Section: ${keywords.slice(0, 3).join(', ')}`;
    }
    
    return 'Document Section';
  }

  calculateImportance(content, keywords, structures) {
    let importance = 1.0;
    
    // Higher importance for structured content
    if (structures && structures.length > 0) {
      const maxPriority = Math.max(...structures.map(s => s.priority || 1));
      importance += maxPriority * 0.15;
    }
    
    // Higher importance for content with many keywords
    importance += Math.min(keywords.length * 0.08, 0.8);
    
    // Higher importance for procedural content
    if (/\b(?:step|procedure|process|method|instruction)\b/i.test(content)) {
      importance += 0.4;
    }
    
    // Higher importance for definitions
    if (/\b(?:definition|means|refers to|defined as)\b/i.test(content)) {
      importance += 0.3;
    }
    
    // Higher importance for content with numbers/data
    if (/\d+/.test(content)) {
      importance += 0.15;
    }
    
    // Higher importance for metadata sections
    if (/=== .+? ===/.test(content)) {
      importance += 0.25;
    }
    
    return Math.min(importance, 4.0);
  }

  assessContextQuality(content) {
    let quality = 0;
    
    // Length quality
    if (content.length >= 200 && content.length <= 1000) {
      quality += 2;
    } else if (content.length > 100) {
      quality += 1;
    }
    
    // Structure quality
    if (/=== .+? ===/.test(content)) quality += 2;
    if (/\n\s*[•\-\*\d+\.]\s+/.test(content)) quality += 1;
    if (/\t.*\t/.test(content)) quality += 1;
    
    // Content richness
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length >= 3) quality += 1;
    if (sentences.length >= 6) quality += 1;
    
    // Domain relevance
    const surveyTerms = ['survey', 'data', 'form', 'field', 'procedure', 'instruction'];
    const termCount = surveyTerms.filter(term => content.toLowerCase().includes(term)).length;
    quality += Math.min(termCount, 3);
    
    return Math.min(quality, 10);
  }

  postProcessChunks(chunks, originalContent) {
    // Enhanced post-processing for better quality
    const filteredChunks = chunks.filter(chunk => {
      const wordCount = chunk.metadata.wordCount;
      const hasSubstantialContent = wordCount >= 25;
      const notJustNumbers = !/^\s*[\d\s\.\-\+\(\)]+\s*$/.test(chunk.content);
      const notJustPunctuation = !/^[\s\W]+$/.test(chunk.content);
      const hasMinimumQuality = chunk.metadata.contextQuality >= 2;
      
      return hasSubstantialContent && notJustNumbers && notJustPunctuation && hasMinimumQuality;
    });
    
    // Enhanced merging logic
    const mergedChunks = [];
    for (let i = 0; i < filteredChunks.length; i++) {
      const chunk = filteredChunks[i];
      
      if (chunk.metadata.wordCount < 75 && i > 0) {
        const prevChunk = mergedChunks[mergedChunks.length - 1];
        if (prevChunk.metadata.wordCount + chunk.metadata.wordCount <= this.maxChunkSize * 1.3) {
          // Merge chunks
          prevChunk.content += '\n\n' + chunk.content;
          prevChunk.metadata.wordCount += chunk.metadata.wordCount;
          prevChunk.metadata.characterCount += chunk.metadata.characterCount;
          prevChunk.metadata.keywords = [...new Set([...prevChunk.metadata.keywords, ...chunk.metadata.keywords])].slice(0, 30);
          prevChunk.metadata.entities = [...new Set([...prevChunk.metadata.entities, ...chunk.metadata.entities])].slice(0, 25);
          prevChunk.metadata.importance = Math.max(prevChunk.metadata.importance, chunk.metadata.importance);
          continue;
        }
      }
      
      mergedChunks.push(chunk);
    }
    
    return mergedChunks;
  }

  processSectionIntoChunks(section, fileName, sectionIndex) {
    const chunks = [];
    const content = section.content;

    if (content.length <= this.maxChunkSize) {
      chunks.push(this.createEnhancedChunk(content, fileName, `${sectionIndex}`, [{ types: [section.type || 'section'] }]));
    } else {
      const subChunks = this.splitLargeContent(content, fileName, sectionIndex, section.title);
      chunks.push(...subChunks);
    }

    return chunks;
  }

  splitLargeContent(content, fileName, sectionIndex, sectionTitle) {
    const chunks = [];
    
    // Enhanced sentence-based splitting
    const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15);
    
    let currentChunk = '';
    let subChunkIndex = 0;

    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      
      if (currentChunk.length + trimmedSentence.length > this.maxChunkSize && currentChunk.length > this.minChunkSize) {
        chunks.push(this.createEnhancedChunk(currentChunk, fileName, `${sectionIndex}-${subChunkIndex}`, [{ types: ['section'] }]));
        
        const overlap = this.getIntelligentOverlap(currentChunk, trimmedSentence);
        currentChunk = overlap + trimmedSentence;
        subChunkIndex++;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    });

    if (currentChunk.trim() && currentChunk.length >= this.minChunkSize) {
      chunks.push(this.createEnhancedChunk(currentChunk, fileName, `${sectionIndex}-${subChunkIndex}`, [{ types: ['section'] }]));
    } else if (currentChunk.trim() && chunks.length > 0) {
      const lastChunk = chunks[chunks.length - 1];
      lastChunk.content += ' ' + currentChunk.trim();
      lastChunk.metadata.wordCount += currentChunk.split(/\s+/).filter(word => word.length > 0).length;
      lastChunk.metadata.characterCount += currentChunk.length;
    }

    return chunks;
  }

  extractSectionTitle(sectionContent) {
    const lines = sectionContent.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100 && firstLine.length > 5) {
        return firstLine;
      }
    }
    return 'Section';
  }

  createFallbackChunk(content, fileName) {
    return this.createEnhancedChunk(
      content.substring(0, this.maxChunkSize * 2),
      fileName,
      'fallback',
      [{ types: ['fallback'] }]
    );
  }
}