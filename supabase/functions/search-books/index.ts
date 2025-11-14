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
            content: 'You are a helpful assistant that extracts book search criteria from user queries. Extract genres, year ranges, authors, language preferences, and keywords. Always extract the language even if not explicitly mentioned - infer it from the query language.'
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

    // Build Open Library search query
    let searchQuery = '';
    const queryParams: string[] = [];
    
    if (searchCriteria.keywords && searchCriteria.keywords.length > 0) {
      searchQuery = searchCriteria.keywords.join(' ');
    }
    
    if (searchCriteria.author) {
      queryParams.push(`author=${encodeURIComponent(searchCriteria.author)}`);
    }

    if (searchCriteria.genres && searchCriteria.genres.length > 0) {
      queryParams.push(`subject=${encodeURIComponent(searchCriteria.genres[0])}`);
    }

    // Map language names to ISO codes for Open Library
    if (searchCriteria.language) {
      const languageMap: { [key: string]: string } = {
        'greek': 'gre',
        'ελληνικά': 'gre',
        'ελληνική': 'gre',
        'english': 'eng',
        'αγγλικά': 'eng',
        'αγγλική': 'eng',
        'french': 'fre',
        'γαλλικά': 'fre',
        'spanish': 'spa',
        'ισπανικά': 'spa',
        'german': 'ger',
        'γερμανικά': 'ger',
        'italian': 'ita',
        'ιταλικά': 'ita',
      };
      const langCode = languageMap[searchCriteria.language.toLowerCase()] || searchCriteria.language;
      queryParams.push(`language=${langCode}`);
    }

    if (!searchQuery.trim()) {
      searchQuery = 'fiction'; // Default fallback
    }

    const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
    const openLibraryUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}${queryString}&limit=50`;
    
    console.log('Open Library search URL:', openLibraryUrl);

    // Search Open Library
    const openLibraryResponse = await fetch(openLibraryUrl);

    if (!openLibraryResponse.ok) {
      const errorText = await openLibraryResponse.text();
      console.error('Open Library API error:', openLibraryResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch book data' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openLibraryData = await openLibraryResponse.json();
    console.log(`Open Library returned ${openLibraryData.docs?.length || 0} books`);

    if (!openLibraryData.docs || openLibraryData.docs.length === 0) {
      return new Response(
        JSON.stringify({ book: null }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter books by basic criteria
    let filteredBooks = openLibraryData.docs.filter((book: any) => {
      // Must have title and author
      if (!book.title || !book.author_name || book.author_name.length === 0) return false;
      
      return true;
    });

    console.log(`After basic filtering: ${filteredBooks.length} books`);
    
    // Log how many books have ISBN
    const booksWithISBN = filteredBooks.filter((book: any) => book.isbn && book.isbn.length > 0).length;
    console.log(`Books with ISBN: ${booksWithISBN} out of ${filteredBooks.length}`);
    
    // Apply year range filter
    if (searchCriteria.year_range && filteredBooks.length > 0) {
      const yearFiltered = filteredBooks.filter((book: any) => {
        if (!book.first_publish_year) return false;
        const year = book.first_publish_year;
        if (searchCriteria.year_range?.min && year < searchCriteria.year_range.min) return false;
        if (searchCriteria.year_range?.max && year > searchCriteria.year_range.max) return false;
        return true;
      });
      
      if (yearFiltered.length > 0) {
        filteredBooks = yearFiltered;
        console.log(`After year filtering: ${filteredBooks.length} books`);
      }
    }

    // Double-check language filtering (Open Library may return mixed results)
    if (searchCriteria.language && filteredBooks.length > 0) {
      const languageMap: { [key: string]: string[] } = {
        'greek': ['gre', 'el', 'gr'],
        'ελληνικά': ['gre', 'el', 'gr'],
        'english': ['eng', 'en'],
        'αγγλικά': ['eng', 'en'],
        'french': ['fre', 'fr', 'fra'],
        'spanish': ['spa', 'es'],
        'german': ['ger', 'de', 'deu'],
        'italian': ['ita', 'it'],
      };
      
      const searchLang = searchCriteria.language.toLowerCase();
      const acceptedCodes = languageMap[searchLang] || [searchLang];
      
      const languageFiltered = filteredBooks.filter((book: any) => {
        if (!book.language || book.language.length === 0) return true; // Keep if no language info
        return book.language.some((lang: string) => 
          acceptedCodes.includes(lang.toLowerCase())
        );
      });
      
      // Only use language filtering if it returns results
      if (languageFiltered.length > 0) {
        filteredBooks = languageFiltered;
        console.log(`After language filtering: ${filteredBooks.length} books`);
      }
    }

    // Exclude previously shown books
    if (previousBookIds.length > 0) {
      const newBooks = filteredBooks.filter((book: any) => {
        const bookIsbn = book.isbn?.[0] || '';
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

    // Get cover URL from Open Library Cover API
    const isbn = randomBook.isbn?.[0];
    const coverUrl = isbn 
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      : null;

    const bookResult = {
      title: randomBook.title,
      author: randomBook.author_name?.[0] || 'Unknown Author',
      description: randomBook.first_sentence?.[0] || 'No description available',
      year: randomBook.first_publish_year?.toString() || null,
      coverUrl,
      isbn,
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
