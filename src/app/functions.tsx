import { OpenAIApi, Configuration } from "openai-edge";
import type { PineconeRecord } from "@pinecone-database/pinecone";
import { getMatchesFromEmbeddings } from "./getMatchesFromEmbeddings";

const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);
const embedding_model = "text-embedding-3-small";

export async function getEmbeddings(input: string) {
  try {
    const response = await openai.createEmbedding({
      model: embedding_model,
      input: input.replace(/\n/g, ' ')
    })

    const result = await response.json();
    return result.data[0].embedding as number[];

  } catch (e) {
    console.log("Error calling OpenAI embedding API: ", e);
    throw new Error(`Error calling OpenAI embedding API: ${e}`);
  }
}

export type Metadata = {
  source: string,
  text: string,
}

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (message: string, namespace: string, maxTokens = 3000, minScore = 0.2, getOnlyText = true): Promise<PineconeRecord[]> => {

  // Get the embeddings of the input message
  const embedding = await getEmbeddings(message);

  // Retrieve the matches for the embeddings from the specified namespace
  const matches = await getMatchesFromEmbeddings(embedding, 10, namespace);

  // Filter out the matches that have a score lower than the minimum score
  const m = matches.filter(m => m.score && m.score > minScore);
  return m;
}

/**
  * Splits a given text into chunks of 1 to many paragraphs.
  *
  * @param text - The input text to be chunked.
  * @param maxChunkSize - The maximum size (in characters) allowed for each chunk. Default is 1000.
  * @param minChunkSize - The minimum size (in characters) required for each chunk. Default is 100.
  * @returns An array of chunked text, where each chunk contains 1 or multiple "paragraphs"
  */
export const chunkTextByMultiParagraphs = (text: string, maxChunkSize = 1500, minChunkSize = 500): string[] => {
  const chunks: string[] = [];
  let currentChunk = "";

  let startIndex = 0;
  while (startIndex < text.length) {
      let endIndex = startIndex + maxChunkSize;
      if (endIndex >= text.length) {
      endIndex = text.length;
      } else {
      // Just using this to find the nearest paragraph boundary
      const paragraphBoundary = text.indexOf("\n\n", endIndex);
      if (paragraphBoundary !== -1) {
          endIndex = paragraphBoundary;
      }
      }
  
      const chunk = text.slice(startIndex, endIndex).trim();
      if (chunk.length >= minChunkSize) {
      chunks.push(chunk);
      currentChunk = "";
      } else {
      currentChunk += chunk + "\n\n";
      }
  
      startIndex = endIndex + 1;
  }
  
  if (currentChunk.length >= minChunkSize) {
      chunks.push(currentChunk.trim());
  } else if (chunks.length > 0) {
      chunks[chunks.length - 1] += "\n\n" + currentChunk.trim();
  } else {
      chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
  
  
/**
  * Embed a piece of text using an embedding model or service.
  * This is a placeholder and needs to be implemented based on your embedding solution.
  *
  * @param text The text to embed.
  * @returns The embedded representation of the text.
  */
export async function embedChunks(chunks: string[]): Promise<any> {
  try {
    const response = await openai.createEmbedding({
      model: embedding_model,
      input: chunks,
    });
    const result = await response.json();
    return result.data;//[0].embedding as number[]
  } catch (error) {
      console.error("Error embedding text with OpenAI:", error);
      throw error;
  }
}