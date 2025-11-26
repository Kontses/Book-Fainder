// @ts-ignore
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  description: z.string().min(1, "Description is required").max(5000, "Description too long"),
  targetLanguage: z.enum(['en', 'el', 'es', 'fr', 'de', 'it'], {
    errorMap: () => ({ message: "Invalid target language" })
  })
});

const languageMap: Record<string, string> = {
  'en': 'English',
  'el': 'Greek',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian'
};

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return new Response(
        JSON.stringify({ error: firstError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { description, targetLanguage } = validation.data;

    // If target language is English, return the original description
    if (targetLanguage === 'en') {
      return new Response(
        JSON.stringify({ translatedDescription: description }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // @ts-ignore
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const targetLanguageName = languageMap[targetLanguage] || 'English';

    console.log(`Translating description to ${targetLanguageName}`);

    // Use Gemini to translate the description
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: {
            text: `You are a professional translator. Translate the book description to ${targetLanguageName}. Maintain the original tone and meaning. IMPORTANT: Remove all HTML tags (like <b>, <i>, <br>, etc.) from the text and return only plain text without any HTML formatting. Do not add any additional comments or explanations.`
          }
        },
        contents: [
          {
            role: 'user',
            parts: {
              text: description
            }
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to translate description' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('Gemini translation response received');

    const translatedDescription = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translatedDescription) {
      console.error('No translation in response');
      return new Response(
        JSON.stringify({ error: 'Failed to get translation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ translatedDescription }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in translate-description function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
