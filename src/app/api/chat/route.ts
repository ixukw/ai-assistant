
import { openai } from '@ai-sdk/openai';
import { PineconeRecord } from "@pinecone-database/pinecone";
import { StreamingTextResponse, streamText } from 'ai';
import { Metadata, getContext } from '../../functions';

// Allow this serverless function to run for up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the last message
  const lastMessage = messages[messages.length - 1]

  // Get the context from the last message
  const context = await getContext(lastMessage.content, 'default', 3000, 0.3, false)

  // Process contexts from Pinecone
  let docs: string[] = [];
  (context as PineconeRecord[]).forEach(match => {
    docs.push((match.metadata as Metadata).text);
  });

  // Join all the chunks of text together, truncate to the maximum number of tokens, and return the result
  const contextText = docs.join("\n").substring(0, 3000)
  
  // Declare prompt to GPT
  const prompt = `
    Bob's traits include expert knowledge, helpfulness, cleverness, and articulateness.
    Bob is a behaved and well-mannered individual.
    Bob is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
    START CONTEXT BLOCK
    ${contextText}
    END OF CONTEXT BLOCK
    Bob will take into account any CONTEXT BLOCK that is provided in a conversation.
    If the context does not provide the answer to question, Bob will say, "I'm sorry, but I don't know the answer to that question".
    Bob will not apologize for previous responses, but instead will indicated new information was gained.
    Bob will not invent anything that is not drawn directly from the context.
    Bob will not refer to himself by name.
    Bob will not engage in any defamatory, overly negative, controversial, political or potentially offense conversations.
  `;

  const result = await streamText({
    model: openai('gpt-4o'),
    system: prompt,
    prompt: lastMessage.content,
  });

  return new StreamingTextResponse(result.toAIStream(), {
    headers: {
      "x-sources": ""
    }
  });
}