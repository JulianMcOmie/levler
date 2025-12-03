import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, context, depth = 0, pathContext, usedTerms = [] } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt;
    if (context && depth > 0) {
      // Build a list of forbidden terms from the exploration path (only exact terms user queried)
      const forbiddenTerms = usedTerms.length > 0 
        ? `\n5. Do NOT use these exact terms (already explored): ${usedTerms.join(', ')}`
        : '';
      
      prompt = `STRICT RULES:
1. Response MUST be 10 words or fewer - this is critical
2. Explain using MORE FUNDAMENTAL concepts (simpler building blocks)
3. NEVER define using terms that require more advanced knowledge than the term itself
4. Basic vocabulary (molecule, atom, bond, cell, etc.) is ALWAYS allowed${forbiddenTerms}

Original topic: ${context}
${pathContext ? `Exploration path: ${pathContext}` : ''}

Explain "${message}" using simpler, more foundational terms.
Depth ${depth} - use progressively more basic vocabulary. Ground in fundamentals.
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
