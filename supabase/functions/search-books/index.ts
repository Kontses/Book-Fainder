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
            content: 'You are a helpful assistant that extracts book search criteria from user queries. Extract genres, year ranges, authors, language preferences, and keywords.'
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
                    description: 'Book genres (e.g., fiction, mystery, science fiction)'
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
                    description: 'Author name or nationality preference'
                  },
                  language: {
                    type: 'string',
                    description: 'Language of the book'
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Keywords or themes from the user query'
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

    // Build ISBNdb query
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

    // Add language to search query for better filtering
    if (searchCriteria.language) {
      searchQuery += ` ${searchCriteria.language}`;
    }

    if (!searchQuery.trim()) {
      searchQuery = 'fiction'; // Default fallback
    }

    console.log('ISBNdb search query:', searchQuery);

    // Search ISBNdb
    const isbndbResponse = await fetch(
      `https://api2.isbndb.com/books/${encodeURIComponent(searchQuery)}?page=1&pageSize=20`,
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
