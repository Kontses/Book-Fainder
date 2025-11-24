import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(500, "Prompt too long"),
  previousBookIds: z.array(z.string()).optional()
});

interface SearchCriteria {
  title?: string;
  author?: string;
  genres?: string[];
  year_range?: {
    min?: number;
    max?: number;
  };
  language?: string;
  keywords?: string[];
}

Deno.serve(async (req) => {
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
    
    const { prompt, previousBookIds = [] } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const ISBNDB_API_KEY = Deno.env.get('ISBNDB_API_KEY');

    if (!LOVABLE_API_KEY || !ISBNDB_API_KEY) {
      console.error('Missing API keys');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing prompt with Gemini:', prompt);

    // Use Gemini to extract structured search criteria from the prompt
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that extracts book search criteria from user queries. Analyze the query and extract specific fields.

IMPORTANT RULES:
1. Extract TITLE if the user mentions a specific book title or asks for books "like X" (where X is a title)
2. Extract AUTHOR if the user mentions a specific author name or nationality preference
3. Extract GENRES if the user mentions specific book categories (fiction, mystery, sci-fi, etc.)
4. Extract YEAR_RANGE for any time-related queries:
   - "1930s" → min: 1930, max: 1939
   - "1920s" → min: 1920, max: 1929
   - "60s" or "1960s" → min: 1960, max: 1969
   - "before 1950" → max: 1950
   - "after 2000" → min: 2000
   - Any year followed by 's' means the full 10-year range
5. Extract LANGUAGE if specified (Greek, English, French, etc.)
6. Extract KEYWORDS only for thematic terms that don't fit other categories (war, adventure, love, etc.)

PRIORITY: Use specific fields (title, author) over generic keywords whenever possible.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_search_criteria',
              description: 'Extract structured book search criteria from a user query',
              parameters: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'Specific book title mentioned by the user'
                  },
                  author: {
                    type: 'string',
                    description: 'Author name or nationality preference'
                  },
                  genres: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Book genres (e.g., fiction, mystery, science fiction)'
                  },
                  year_range: {
                    type: 'object',
                    properties: {
                      min: { type: 'number', description: 'Minimum publication year' },
                      max: { type: 'number', description: 'Maximum publication year' }
                    }
                  },
                  language: {
                    type: 'string',
                    description: 'Language of the book'
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Thematic keywords (only if not fitting other categories)'
                  }
                },
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_search_criteria' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse search criteria' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('Gemini response:', JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response');
      return new Response(
        JSON.stringify({ error: 'Failed to extract search criteria' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let searchCriteria: SearchCriteria = JSON.parse(toolCall.function.arguments);
    
    // Fallback: Detect decade patterns in the original prompt if Gemini didn't extract them
    const decadeMatch = prompt.match(/\b(\d{2,4})s\b/i);
    if (decadeMatch && !searchCriteria.year_range) {
      let baseYear = parseInt(decadeMatch[1]);
      
      // Handle short form decades like "60s" or "90s"
      if (baseYear < 100) {
        // Assume 1900s for numbers >= 20, 2000s for numbers < 20
        baseYear = baseYear >= 20 ? 1900 + baseYear : 2000 + baseYear;
      }
      
      searchCriteria.year_range = {
        min: baseYear,
        max: baseYear + 9
      };
      
      console.log(`Detected decade pattern: ${decadeMatch[0]} → ${baseYear}-${baseYear + 9}`);
    }
    
    console.log('Extracted search criteria (original):', searchCriteria);

    // Translate non-English search criteria to English for ISBNdb
    const needsTranslation = searchCriteria.language && searchCriteria.language.toLowerCase() !== 'english';
    
    if (needsTranslation) {
      console.log('Translating search criteria to English...');
      
      try {
        const translateResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a translation assistant. Translate the provided search criteria to English. Keep proper nouns (author names, book titles) as they are if they are already in Latin script. Only translate descriptive keywords and genres.'
              },
              {
                role: 'user',
                content: `Translate these book search criteria to English:
Title: ${searchCriteria.title || 'N/A'}
Author: ${searchCriteria.author || 'N/A'}
Keywords: ${searchCriteria.keywords?.join(', ') || 'N/A'}
Genres: ${searchCriteria.genres?.join(', ') || 'N/A'}

Return the translation in the same format.`
              }
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'translate_criteria',
                  description: 'Translate book search criteria to English',
                  parameters: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Translated title (or original if proper noun)' },
                      author: { type: 'string', description: 'Translated author (or original if name)' },
                      keywords: { type: 'array', items: { type: 'string' }, description: 'Translated keywords' },
                      genres: { type: 'array', items: { type: 'string' }, description: 'Translated genres' }
                    },
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'translate_criteria' } }
          }),
        });

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          const translateToolCall = translateData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (translateToolCall) {
            const translatedCriteria = JSON.parse(translateToolCall.function.arguments);
            console.log('Translated criteria:', translatedCriteria);
            
            // Update search criteria with translated values
            if (translatedCriteria.title && searchCriteria.title) {
              searchCriteria.title = translatedCriteria.title;
            }
            if (translatedCriteria.author && searchCriteria.author) {
              searchCriteria.author = translatedCriteria.author;
            }
            if (translatedCriteria.keywords && searchCriteria.keywords) {
              searchCriteria.keywords = translatedCriteria.keywords;
            }
            if (translatedCriteria.genres && searchCriteria.genres) {
              searchCriteria.genres = translatedCriteria.genres;
            }
          }
        } else {
          console.error('Translation failed, using original criteria');
        }
      } catch (translateError) {
        console.error('Error during translation:', translateError);
        // Continue with original criteria
      }
    }
    
    console.log('Final search criteria for ISBNdb:', searchCriteria);

    // Build ISBNdb query with targeted searches
    let searchQuery = '';
    let columnParam = '';
    
    // Priority 1: Search by author if specified
    if (searchCriteria.author) {
      searchQuery = searchCriteria.author;
      columnParam = '&column=author';
      console.log('Searching by AUTHOR:', searchQuery);
    }
    // Priority 2: Search by title if specified
    else if (searchCriteria.title) {
      searchQuery = searchCriteria.title;
      columnParam = '&column=title';
      console.log('Searching by TITLE:', searchQuery);
    }
    // Priority 3: Search by genre/subject
    else if (searchCriteria.genres && searchCriteria.genres.length > 0) {
      searchQuery = searchCriteria.genres[0];
      columnParam = '&column=subjects';
      console.log('Searching by GENRE/SUBJECT:', searchQuery);
    }
    // Priority 4: Use keywords for general search
    else if (searchCriteria.keywords && searchCriteria.keywords.length > 0) {
      searchQuery = searchCriteria.keywords.join(' ');
      // No column param = general search across all fields
      console.log('Searching by KEYWORDS:', searchQuery);
    }
    // Fallback: default to fiction
    else {
      searchQuery = 'fiction';
      console.log('No criteria - using default: fiction');
    }

    console.log('ISBNdb query:', searchQuery, columnParam);

    // Search ISBNdb with targeted column parameter
    const isbndbResponse = await fetch(
      `https://api2.isbndb.com/books/${encodeURIComponent(searchQuery)}?page=1&pageSize=20${columnParam}`,
      {
        headers: {
          'Authorization': ISBNDB_API_KEY,
        },
      }
    );

    if (!isbndbResponse.ok) {
      const errorText = await isbndbResponse.text();
      console.error('ISBNdb API error:', isbndbResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch book data' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isbndbData = await isbndbResponse.json();
    console.log('ISBNdb response:', JSON.stringify(isbndbData, null, 2));

    if (!isbndbData.books || isbndbData.books.length === 0) {
      return new Response(
        JSON.stringify({ book: null }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter books by year range and language if specified
    let filteredBooks = isbndbData.books;
    
    if (searchCriteria.year_range) {
      filteredBooks = filteredBooks.filter((book: any) => {
        if (!book.date_published) return false;
        const year = parseInt(book.date_published.substring(0, 4));
        if (searchCriteria.year_range?.min && year < searchCriteria.year_range.min) return false;
        if (searchCriteria.year_range?.max && year > searchCriteria.year_range.max) return false;
        return true;
      });
    }

    // Filter by language if specified
    if (searchCriteria.language) {
      const languageBooksFiltered = filteredBooks.filter((book: any) => {
        if (!book.language) return false;
        const bookLang = book.language.toLowerCase();
        const searchLang = searchCriteria.language!.toLowerCase();
        
        // Map common language names to their codes and variations
        const languageMap: { [key: string]: string[] } = {
          'greek': ['el', 'gr', 'greek', 'ελληνικά', 'ελληνική'],
          'english': ['en', 'eng', 'english', 'αγγλικά', 'αγγλική'],
          'french': ['fr', 'fra', 'french', 'γαλλικά', 'γαλλική'],
          'german': ['de', 'deu', 'german', 'γερμανικά', 'γερμανική'],
          'spanish': ['es', 'spa', 'spanish', 'ισπανικά', 'ισπανική'],
          'italian': ['it', 'ita', 'italian', 'ιταλικά', 'ιταλική']
        };
        
        // Check if searchLang matches any language mapping
        for (const [key, variations] of Object.entries(languageMap)) {
          if (variations.some(v => searchLang.includes(v) || v.includes(searchLang))) {
            return variations.some(v => bookLang.includes(v) || v.includes(bookLang));
          }
        }
        
        // Fallback: direct comparison
        return bookLang.includes(searchLang) || searchLang.includes(bookLang);
      });
      
      // Only use language-filtered results if we found any, otherwise use all results
      if (languageBooksFiltered.length > 0) {
        filteredBooks = languageBooksFiltered;
      }
    }

    // If no books match after filtering, return all books
    if (filteredBooks.length === 0) {
      filteredBooks = isbndbData.books;
    }

    // Filter out previously shown books
    if (previousBookIds.length > 0) {
      const availableBooks = filteredBooks.filter((book: any) => 
        !previousBookIds.includes(book.isbn13 || book.isbn)
      );
      
      // Use available books if any, otherwise use all filtered books
      if (availableBooks.length > 0) {
        filteredBooks = availableBooks;
      }
    }

    // Pick a random book from the results
    const randomBook = filteredBooks[Math.floor(Math.random() * filteredBooks.length)];
    
    return new Response(
      JSON.stringify({ 
        book: randomBook,
        searchCriteria 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-books function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
