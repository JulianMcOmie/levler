import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, context, depth = 0, usedTerms = [] } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt;
    if (context && depth > 0) {
      // Build forbidden terms list
      const forbiddenTerms = usedTerms.length > 0 
        ? `\nDo not use these already-explored terms: ${usedTerms.join(', ')}`
        : '';
      
      prompt = `The user is learning about ${context} and wants to understand "${message}" more deeply.

Requirements:
- 10 words maximum
- Go DEEPER - explain the underlying mechanism, cause, or principle
- Don't just rephrase with synonyms - explain WHY or HOW it happens
- No LaTeX, plain English${forbiddenTerms}

Explain what "${message}" actually means at a deeper level.`;
    } else {
      prompt = `Explain at the highest level in EXACTLY 10 words or fewer: ${message}
Use English - NO LaTeX, no math symbols, no special notation.
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
