import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, context, depth = 0, pathContext, usedTerms = [] } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt;
    if (context && depth > 0) {
      // Build forbidden terms list (case-insensitive instruction)
      const forbiddenTerms = usedTerms.length > 0 
        ? `\n6. FORBIDDEN (do not use these terms, any case): ${usedTerms.join(', ')}`
        : '';
      
      prompt = `STRICT RULES:
1. Response MUST be 10 words or fewer - this is critical
2. Explain using MORE FUNDAMENTAL concepts (simpler building blocks)
3. NO LaTeX, no math symbols ($, \\mathbb, \\mathbf, etc.) - use plain text only
4. NO special notation - write "R3" not "ℝ³", write "SE3" not "SE(3)"
5. Basic vocabulary (molecule, atom, point, space, etc.) is ALWAYS allowed${forbiddenTerms}

Original topic: ${context}
${pathContext ? `Exploration path: ${pathContext}` : ''}

Explain "${message}" using simpler, more foundational terms.
Use plain English words only - no mathematical notation.
MAXIMUM 10 WORDS.`;
    } else {
      prompt = `Explain at the highest level in EXACTLY 10 words or fewer: ${message}
Use plain English - NO LaTeX, no math symbols, no special notation.
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
