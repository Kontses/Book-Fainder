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
  genres?: string[];
  year_range?: {
    min?: number;
    max?: number;
  };
  author?: string;
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

    if (!LOVABLE_API_KEY) {
      console.error('Missing LOVABLE_API_KEY');
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
            content: 'You are a helpful assistant that extracts book search criteria from user queries. Extract genres, year ranges, authors, language preferences, and keywords. Always extract the language even if not explicitly mentioned - infer it from the query language. IMPORTANT: When the user mentions a decade with "s" suffix (e.g., "1930s", "1940s", "50s"), interpret it as the entire decade range. For example: "1930s" = min:1930, max:1939; "1940s" = min:1940, max:1949; "50s" = min:1950, max:1959; "60s" = min:1960, max:1969, etc.'
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
                  genres: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Book genres in English (e.g., fiction, mystery, science fiction, romance)'
                  },
                  year_range: {
                    type: 'object',
                    properties: {
                      min: { type: 'number', description: 'Minimum publication year' },
                      max: { type: 'number', description: 'Maximum publication year' }
                    }
                  },
                  author: {
                    type: 'string',
                    description: 'Author name in English'
                  },
                  language: {
                    type: 'string',
                    description: 'Language of the book in English (e.g., greek, english, french)'
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Keywords or themes in English'
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

    const searchCriteria: SearchCriteria = JSON.parse(toolCall.function.arguments);
    console.log('Extracted search criteria:', searchCriteria);

    // Get ISBNDB API key
    const ISBNDB_API_KEY = Deno.env.get('ISBNDB_API_KEY');
    if (!ISBNDB_API_KEY) {
      console.error('Missing ISBNDB_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build ISBNDB search query
    let searchQuery = '';
    
    if (searchCriteria.keywords && searchCriteria.keywords.length > 0) {
      searchQuery = searchCriteria.keywords.join(' ');
    }
    
    if (searchCriteria.author) {
      searchQuery += ` ${searchCriteria.author}`;
    }

    if (searchCriteria.genres && searchCriteria.genres.length > 0) {
      searchQuery += ` ${searchCriteria.genres[0]}`;
    }

    if (!searchQuery.trim()) {
      searchQuery = 'fiction'; // Default fallback
    }

    // Map language names to ISO codes for ISBNDB
    let languageCode = '';
    if (searchCriteria.language) {
      const languageMap: { [key: string]: string } = {
        'greek': 'el',
        'ελληνικά': 'el',
        'ελληνική': 'el',
        'english': 'en',
        'αγγλικά': 'en',
        'αγγλική': 'en',
        'french': 'fr',
        'γαλλικά': 'fr',
        'spanish': 'es',
        'ισπανικά': 'es',
        'german': 'de',
        'γερμανικά': 'de',
        'italian': 'it',
        'ιταλικά': 'it',
      };
      languageCode = languageMap[searchCriteria.language.toLowerCase()] || searchCriteria.language;
    }

    const isbndbUrl = `https://api2.isbndb.com/books/${encodeURIComponent(searchQuery)}?page=1&pageSize=50`;
    
    console.log('ISBNDB search URL:', isbndbUrl);
    console.log('Search criteria for filtering:', searchCriteria);

    // Search ISBNDB
    const isbndbResponse = await fetch(isbndbUrl, {
      headers: {
        'Authorization': ISBNDB_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!isbndbResponse.ok) {
      const errorText = await isbndbResponse.text();
      console.error('ISBNDB API error:', isbndbResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch book data' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isbndbData = await isbndbResponse.json();
    console.log(`ISBNDB returned ${isbndbData.books?.length || 0} books`);

    if (!isbndbData.books || isbndbData.books.length === 0) {
      return new Response(
        JSON.stringify({ book: null }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter books by basic criteria
    let filteredBooks = isbndbData.books.filter((book: any) => {
      // Must have title and authors
      if (!book.title || !book.authors || book.authors.length === 0) return false;
      
      return true;
    });

    console.log(`After basic filtering: ${filteredBooks.length} books`);
    
    // Apply year range filter (decade filtering)
    if (searchCriteria.year_range && filteredBooks.length > 0) {
      const yearFiltered = filteredBooks.filter((book: any) => {
        if (!book.date_published) return false;
        
        // Extract year from date_published (can be "YYYY" or "YYYY-MM-DD")
        const yearMatch = book.date_published.match(/^(\d{4})/);
        if (!yearMatch) return false;
        
        const year = parseInt(yearMatch[1]);
        if (searchCriteria.year_range?.min && year < searchCriteria.year_range.min) return false;
        if (searchCriteria.year_range?.max && year > searchCriteria.year_range.max) return false;
        return true;
      });
      
      if (yearFiltered.length > 0) {
        filteredBooks = yearFiltered;
        console.log(`After year filtering: ${filteredBooks.length} books`);
      }
    }

    // Language filtering
    if (languageCode && filteredBooks.length > 0) {
      const languageFiltered = filteredBooks.filter((book: any) => {
        if (!book.language) return true; // Keep if no language info
        return book.language.toLowerCase() === languageCode.toLowerCase();
      });
      
      if (languageFiltered.length > 0) {
        filteredBooks = languageFiltered;
        console.log(`After language filtering: ${filteredBooks.length} books`);
      }
    }

    // Exclude previously shown books
    if (previousBookIds.length > 0) {
      const newBooks = filteredBooks.filter((book: any) => {
        const bookIsbn = book.isbn13 || book.isbn || '';
        return !previousBookIds.includes(bookIsbn);
      });
      
      if (newBooks.length > 0) {
        filteredBooks = newBooks;
        console.log(`After excluding previous books: ${filteredBooks.length} books`);
      }
    }

    if (filteredBooks.length === 0) {
      return new Response(
        JSON.stringify({ book: null }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pick a random book from filtered results
    const randomBook = filteredBooks[Math.floor(Math.random() * filteredBooks.length)];

    // Extract year from date_published
    const yearMatch = randomBook.date_published?.match(/^(\d{4})/);
    const year = yearMatch ? yearMatch[1] : null;

    const bookResult = {
      title: randomBook.title,
      author: randomBook.authors?.[0] || 'Unknown Author',
      description: randomBook.synopsis || 'No description available',
      year,
      coverUrl: randomBook.image || null,
      isbn: randomBook.isbn13 || randomBook.isbn || null,
      searchCriteria
    };

    console.log('Selected book:', bookResult.title, 'by', bookResult.author);

    return new Response(
      JSON.stringify({ book: bookResult, searchCriteria }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
