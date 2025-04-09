import JSZip from 'jszip';
import { DOMParser } from 'xmldom';
import { JSDOM } from 'jsdom';

/**
 * Extracts plain text content from an Apple Pages (.pages) file buffer
 * @param buffer - The buffer containing the .pages file data
 * @returns A promise that resolves with the extracted text content
 */
export async function extractTextFromPagesFile(buffer: Buffer): Promise<string> {
  try {
    // Load the .pages file (which is actually a zip archive)
    const zip = new JSZip();
    const contents = await zip.loadAsync(buffer);
    
    // Find the main content file (typically in a predictable location)
    // Most Pages files store their content in "index.xml" inside the QuickLook directory
    // or in "document.xml" inside the document content directory
    
    let textContent = '';
    
    // Try to find the content in the QuickLook preview first
    const quickLookPath = 'QuickLook/Preview.html';
    if (contents.files[quickLookPath]) {
      const htmlContent = await contents.files[quickLookPath].async('text');
      const dom = new JSDOM(htmlContent);
      textContent = dom.window.document.body.textContent || '';
    } 
    // If that doesn't work, try to find the main XML document content
    else {
      // Search for document.xml or index.xml in various possible locations
      const possiblePaths = [
        'index.xml',
        'document.xml',
        'document-content.xml',
        'preview-web.html',
        'preview.html'
      ];
      
      for (const path of possiblePaths) {
        if (contents.files[path]) {
          const xmlContent = await contents.files[path].async('text');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
          
          // Extract text nodes from the XML
          const extractTextNodes = (node: Node): string => {
            let text = '';
            if (node.nodeType === 3) { // TEXT_NODE
              text += node.nodeValue;
            } else if (node.nodeType === 1) { // ELEMENT_NODE
              for (let i = 0; i < node.childNodes.length; i++) {
                text += extractTextNodes(node.childNodes[i]) + ' ';
              }
            }
            return text;
          };
          
          textContent = extractTextNodes(xmlDoc);
          break;
        }
      }
      
      // If still no content, try to search the entire archive for any XML or HTML files
      if (!textContent) {
        for (const filePath in contents.files) {
          if (filePath.endsWith('.xml') || filePath.endsWith('.html')) {
            const content = await contents.files[filePath].async('text');
            
            if (filePath.endsWith('.html')) {
              const dom = new JSDOM(content);
              textContent += (dom.window.document.body.textContent || '') + '\n';
            } else {
              const parser = new DOMParser();
              try {
                const xmlDoc = parser.parseFromString(content, 'text/xml');
                textContent += xmlDoc.documentElement.textContent + '\n';
              } catch (e) {
                // If XML parsing fails, just extract text nodes manually
                const dom = new JSDOM(`<div>${content}</div>`);
                textContent += (dom.window.document.body.textContent || '') + '\n';
              }
            }
          }
        }
      }
    }
    
    // Clean up the text content (remove excessive whitespace, etc.)
    textContent = textContent
      .replace(/\s+/g, ' ')      // Replace multiple whitespace with single space
      .replace(/^\s+|\s+$/g, '') // Trim whitespace from beginning and end
      .trim();
    
    return textContent;
  } catch (error) {
    throw new Error(`Failed to extract text from Pages file: ${error.message}`);
  }
}
