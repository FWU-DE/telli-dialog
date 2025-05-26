import { extractText, getDocumentProxy } from 'unpdf';

/**
 * Extract text from PDF buffer with page-by-page breakdown using unpdf library
 * Returns an array of objects with page number and text content
 */
export async function extractTextFromPdfBuffer(
  pdfBuffer: Buffer,
): Promise<{ totalPages: number; pageElement: { page: number; text: string }[] }> {
  try {
    // Convert Buffer to Uint8Array as required by unpdf
    const uint8Array = new Uint8Array(pdfBuffer);

    // Extract text without merging pages to get individual page content
    const { text, totalPages } = await extractText(uint8Array, { mergePages: false });

    // If text is a string array (one per page), map it to the expected format

    return {
      totalPages,
      pageElement: text.map((pageText, index) => ({
        page: index + 1,
        text: pageText.replace(/-\n/g, '').trim(),
      })),
    };
  } catch (error) {
    console.error('Error parsing PDF with unpdf (pages):', error);
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Extract table of contents (TOC) from PDF buffer using unpdf library
 * This function extracts the PDF outline/bookmarks and returns them as a flat list
 * with page numbers and text content
 */
export async function extractTOC(
  pdfBuffer: Buffer,
): Promise<{ page: number; title: string; fullPath: string; level: number }[]> {
  try {
    // Convert Buffer to Uint8Array as required by unpdf
    const uint8Array = new Uint8Array(pdfBuffer);

    // Get the PDF document proxy to access the outline
    const pdf = await getDocumentProxy(uint8Array);

    // Get the outline from the PDF
    const outline = await pdf.getOutline();

    if (!outline || outline.length === 0) {
      // No outline/TOC found in the PDF
      return [];
    }

    const tocItems: { page: number; title: string; fullPath: string; level: number }[] = [];

    // Recursive function to process outline items
    const processOutlineItems = async (
      items: any[],
      level = 0,
      parentTitle: string = '',
    ): Promise<void> => {
      for (const item of items) {
        try {
          let pageNumber = 1; // Default page number

          // Try to get the page number from the destination
          if (item.dest) {
            try {
              let destination;
              if (typeof item.dest === 'string') {
                // If dest is a string, get the destination reference
                destination = await pdf.getDestination(item.dest);
              } else {
                // If dest is already an array/object, use it directly
                destination = item.dest;
              }

              if (destination && Array.isArray(destination) && destination[0]) {
                // Get page index from the destination reference
                const pageIndex = await pdf.getPageIndex(destination[0]);
                pageNumber = pageIndex + 1; // Page numbers are 1-based
              }
            } catch (destError) {
              console.warn(
                'Failed to resolve destination for outline item:',
                item.title,
                destError,
              );
              // Continue with default page number
            }
          }

          // Add the outline item to our TOC list
          // Add indentation to show hierarchy level

          tocItems.push({
            page: pageNumber,
            level,
            title: item.title,
            fullPath: parentTitle ? `${parentTitle} / ${item.title}` : item.title,
          });
          // Recursively process child items if they exist
          if (item.items && Array.isArray(item.items) && item.items.length > 0) {
            await processOutlineItems(item.items, level + 1, item.title);
          }
        } catch (itemError) {
          console.warn('Failed to process outline item:', item.title, itemError);
          // Continue with other items
        }
      }
    };

    // Process all outline items
    await processOutlineItems(outline);

    return tocItems;
  } catch (error) {
    console.error('Error extracting TOC from PDF with unpdf:', error);
    throw new Error(
      `Failed to extract TOC from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Create a mapping from page numbers to chapter paths
 * This inverts the TOC to provide easy lookup of which chapter/section each page belongs to.
 * The index is 1-based, so the first page has index 1, the second page has index 2, etc.
 * Some pages might not have a chapter, e.g. the table of contents itself or the cover page.
 */
export async function createPageToChapterMapping(
  tocData: { page: number; title: string; fullPath: string; level: number }[],
  totalPages: number,
): Promise<Record<number, string>> {
  try {
    if (tocData.length === 0) {
      return {};
    }

    // Sort TOC items by page number to ensure proper ordering
    const sortedToc = [...tocData].sort((a, b) => a.page - b.page);

    const pageToChapterMapping: Record<number, string> = {};

    // For each page, find the most specific chapter/section it belongs to
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      let currentChapter = '';
      let maxLevel = -1;

      // Find all TOC items that start at or before this page
      const applicableItems = sortedToc.filter((item) => item.page <= pageNum);

      if (applicableItems.length === 0) {
        continue; // No chapter found for this page
      }

      // For each applicable item, check if it's the most specific one for this page
      for (const item of applicableItems) {
        // Find the next item at the same or higher level to determine the range
        const nextItemIndex = sortedToc.findIndex(
          (nextItem, index) => index > sortedToc.indexOf(item) && nextItem.level <= item.level,
        );

        const nextItem = nextItemIndex >= 0 ? sortedToc[nextItemIndex] : null;
        const itemEndPage = nextItem ? nextItem.page - 1 : totalPages;

        // Check if this page falls within this item's range
        if (pageNum >= item.page && pageNum <= itemEndPage) {
          // Use the most specific (deepest level) chapter for this page
          if (item.level > maxLevel) {
            maxLevel = item.level;
            currentChapter = item.fullPath;
          }
        }
      }

      if (currentChapter) {
        pageToChapterMapping[pageNum] = currentChapter;
      }
    }

    return pageToChapterMapping;
  } catch (error) {
    console.error('Error creating page to chapter mapping:', error);
    throw new Error(
      `Failed to create page to chapter mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
