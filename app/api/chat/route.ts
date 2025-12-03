import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, context, depth = 0, pathContext } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt;
    if (context && depth > 0) {
      prompt = `STRICT RULES:
1. Response MUST be 10 words or fewer - this is critical
2. Each level goes ONE step MORE SPECIFIC/TECHNICAL than before
3. Never repeat previous definitions
4. Use progressively more detailed terminology

Context: ${context}
${pathContext ? `Previous path: ${pathContext}` : ''}

Explain "${message}" specifically in the context above.
Level ${depth} depth - be MORE SPECIFIC and TECHNICAL than level ${depth - 1}.
Use precise technical terms.
MAXIMUM 10 WORDS.`;
    } else {
      prompt = `Explain at the highest level in EXACTLY 10 words or fewer: ${message}
Use important key terms naturally.
MAXIMUM 10 WORDS.`;
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error calling Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Gemini' },
      { status: 500 }
    );
  }
}
