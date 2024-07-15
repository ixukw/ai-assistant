import { Pinecone, PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone'
import { chunkTextByMultiParagraphs, embedChunks } from '../../functions';
import { randomUUID } from 'crypto';
import pdfParse from 'pdf-parse';

// Allow this serverless function to run for up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { data, name } = await req.json();
  let pdfData = await pdfParse(data, {
    /*pagerender: function (page: any) {
      return page
        .getTextContent({
          normalizeWhitespace: true,
        })
        .then(function (textContent: { items: any[] }) {
          return textContent.items
            .map(function (item) {
              return item.str;
            })
            .join(" ");
        });
    },*/
  });

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  const index = pc.index("aiclone");

  const max_chunk_count = 2000;

  // chunk and embed with OpenAI
  const chunks = chunkTextByMultiParagraphs(pdfData.text);
  const embeddings = await embedChunks(chunks.slice(0, max_chunk_count));

  let zipped = []
  for (let i = 0; i < chunks.length && i < embeddings.length; i++) {
    zipped.push({
        id: name + randomUUID(),
        values: embeddings[i].embedding,
        text: chunks[i],
    });
  }

  // Declare Pinecone namespace and vectorize chunk+embed
  const namespace = index.namespace('default');
  const vectors: PineconeRecord<RecordMetadata>[] = zipped.map(
    (chunk: any) => ({
        id: chunk.id,
        values: chunk.values,
        metadata: {
        text: chunk.text,
        referenceURL: name,
        },
    })
  );

  // Batch the upsert operation with Pinecone
  const batchSize = 200;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await namespace.upsert(batch);
  }

  // TODO: add proper response handling
  return new Response();
}