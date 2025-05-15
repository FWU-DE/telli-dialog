import { dbCreateManyTextChunks } from "@/db/functions/text-chunk";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";

const embeddingModel = openai.embedding('BAAI/bge-m3');

export async function embedBatchAndSave({values, fileId}: {values: string[], fileId: string}) {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values,
  });
  await dbCreateManyTextChunks({
    chunks: embeddings.map((embedding, index) => ({
      content: values[index] ?? '',
      embedding,
      fileId,
      orderIndex: index
    })),
  });
}

