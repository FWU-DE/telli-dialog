export function truncateFileName ({name, maxLen}: {name:string, maxLen: number}):string {
    if (!name) return '';
    
    // Split the filename and extension
    const lastDotIndex = name.lastIndexOf('.');
    let baseName = name;
    let extension = '';
    
    if (lastDotIndex !== -1) {
        baseName = name.substring(0, lastDotIndex);
    }
    if (baseName.length <= maxLen) return baseName;
    
    // Constants
    const ellipsis = '...';
    const availableChars = maxLen - ellipsis.length;
    
    if (availableChars <= 0) {
        // If we can't even show part of the basename with the ellipsis and extension,
        // truncate the whole thing
        return name.substring(0, maxLen - ellipsis.length) + ellipsis;
    }
    
    // Split the basename into word-like parts using delimiters
    const parts = baseName.split(/([_\-\s])/);
    
    // Parts containing just delimiters and the actual words
    const delimiters = parts.filter((_, i) => i % 2 === 1);
    const words = parts.filter((_, i) => i % 2 === 0);
    if (words.length === 1){
        return words[0]?.slice(0, availableChars) + ellipsis
    }
    // Algorithm to preserve whole words from start and end
    let startPortion = '';
    let endPortion = '';
    let startWords = [];
    let endWords = [];
    
    // Allocate about 60% of space to the start
    const startCharsTarget = Math.ceil(availableChars * 0.6);
    const endCharsTarget = availableChars - startCharsTarget;
    
    // Add words from the beginning until we hit the target char count
    for (let i = 0; i < words.length; i++) {
        const wordWithDelimiter = words[i] + (delimiters[i] || '');
        if ((startPortion + wordWithDelimiter).length <= startCharsTarget) {
            startWords.push(wordWithDelimiter);
            startPortion += wordWithDelimiter;
        } else {
            break;
        }
    }
    
    // Add words from the end until we hit the target char count
    for (let i = words.length - 1; i >= 0; i--) {
        const delimiterBefore = delimiters[i - 1] || '';
        const wordWithDelimiter = delimiterBefore + words[i];
        
        // Avoid duplicating words already in startPortion
        if (i >= startWords.length && (endPortion.length + wordWithDelimiter.length) <= endCharsTarget) {
            endWords.unshift(wordWithDelimiter);
            endPortion = wordWithDelimiter + endPortion;
        } else {
            break;
        }
    }
    console.log(`TEST ${startCharsTarget};${endCharsTarget}`)
    const truncateEnd = startPortion && endPortion
    // Combine the parts
    const truncatedBaseName = startPortion + (truncateEnd ? ellipsis : '') + (!truncateEnd? ellipsis : '') + endPortion;
    
    return truncatedBaseName + extension;
  };