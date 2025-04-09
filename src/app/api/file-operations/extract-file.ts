import { extractTextFromPdfBuffer } from "./parse-pdf"



export async function extractFile({fileContent, type}: {fileContent:Buffer, type: 'pdf'| 'docx' | 'pages' | 'txt' | 'md'}){
    let content: string = ""
    if (type === 'pdf'){
        content = await extractTextFromPdfBuffer(fileContent)
    }
    else if(type === 'docx'){
        // TODO 
    }
    else if(type === 'pages'){
        // TODO 
    }
    else if(type === 'md' || type === 'txt'){
        // TODO 

    }
    return content 
}