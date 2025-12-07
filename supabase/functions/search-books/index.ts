// @ts-ignore
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(500, "Prompt too long"),
  previousBookIds: z.array(z.string()).optional(),
  targetLanguage: z.string().optional()
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

    const { prompt, previousBookIds = [], targetLanguage } = validation.data;

    // @ts-ignore
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    // @ts-ignore
    const ISBNDB_API_KEY = Deno.env.get('ISBNDB_API_KEY');

    if (!GEMINI_API_KEY || !ISBNDB_API_KEY) {
      console.error('Missing API keys');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing prompt with Gemini:', prompt, 'Target Language:', targetLanguage);

    // Use Gemini to extract structured search criteria from the prompt
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: {
            text: `You are a helpful assistant that extracts book search criteria from user queries. Analyze the query and extract specific fields.

CRITICAL EXTRACTION RULES:
1. Extract TITLE if the user mentions a specific book title or asks for books "like X" (where X is a title)
2. Extract AUTHOR if the user mentions a specific author name
3. Extract GENRES - ALWAYS extract book genres/categories as an array:
   - "mystery" → ["mystery"]
   - "science fiction" → ["science fiction"]  
   - "historical fiction" → ["historical fiction"]
   - "biography" → ["biography", "autobiography"]
   - Genre terms: fiction, mystery, thriller, sci-fi, romance, horror, fantasy, biography, autobiography, poetry, etc.
4. Extract YEAR_RANGE - CRITICAL for decade queries:
   - "1930s" → min: 1930, max: 1939
   - "1920s" → min: 1920, max: 1929
   - "60s" or "1960s" → min: 1960, max: 1969
   - "from the 1930s" → min: 1930, max: 1939
   - "before 1950" → max: 1950
   - "after 2000" → min: 2000
   - Any year followed by 's' means the FULL 10-year range (e.g., 1930-1939)
5. Extract LANGUAGE if the user wants books IN that language (not ABOUT that language):
   - "Greek book" or "book in Greek" → language: "Greek"
   - "book about Greek" or "Greek literature textbook" → DO NOT set language, use keywords instead
   - ONLY set language when the user wants to READ in that language
6. Extract KEYWORDS for thematic terms:
   - If user asks for "Greek writer" or "Greek author" → keywords: ["Greek literature", "Greek author"]
   - Nationality + writer/author → keywords: ["{nationality} literature", "{nationality} author"]
   - Theme terms: war, adventure, love, classical literature, etc.

NATIONALITY VS LANGUAGE:
- "Greek book about a Greek writer" → keywords: ["Greek literature", "Greek author"], NO language field
- "book in Greek" → language: "Greek"  
- "French novel" → keywords: ["French literature"], language: "French"
- "book about ancient Greece" → keywords: ["ancient Greece", "Greek history"]

EXAMPLES:
- "mystery novel from the 1930s" → genres: ["mystery"], year_range: {min: 1930, max: 1939}
- "sci-fi book from the 60s" → genres: ["science fiction"], year_range: {min: 1960, max: 1969}
- "Greek poetry book" → genres: ["poetry"], keywords: ["Greek literature"], language: "Greek"
- "book about a Greek writer" → keywords: ["Greek literature", "Greek author", "biography"]
- "French romance novel" → genres: ["romance"], keywords: ["French literature"], language: "French"

PRIORITY: Use specific fields (genres, year_range) over generic keywords whenever possible.`
          }
        },
        contents: [
          {
            role: 'user',
            parts: {
              text: prompt
            }
          }
        ],
        tools: [
          {
            function_declarations: [
              {
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
                  required: [] // Optional but good to specify if any are mandatory
                }
              }
            ]
          }
        ],
        tool_config: {
          function_calling_config: {
            mode: "ANY",
            allowed_function_names: ["extract_search_criteria"]
          }
        }
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

    const functionCall = aiData.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    if (!functionCall) {
      console.error('No function call in response');
      return new Response(
        JSON.stringify({ error: 'Failed to extract search criteria' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let searchCriteria: SearchCriteria = functionCall.args;

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

      console.log(`[FALLBACK] Detected decade pattern: ${decadeMatch[0]} → ${baseYear}-${baseYear + 9}`);
    }

    console.log('✅ Final extracted search criteria:', JSON.stringify(searchCriteria, null, 2));

    // Helper function to search ISBNdb
    const searchISBNdb = async (criteria: SearchCriteria) => {
      let searchQuery = '';
      let columnParam = '';

      // Priority 1: Search by author if specified
      if (criteria.author) {
        searchQuery = criteria.author;
        columnParam = '&column=author';
        console.log('🔍 [ISBNdb] Searching by AUTHOR:', searchQuery);
      }
      // Priority 2: Search by title if specified
      else if (criteria.title) {
        searchQuery = criteria.title;
        columnParam = '&column=title';
        console.log('🔍 [ISBNdb] Searching by TITLE:', searchQuery);
      }
      // Priority 3: Search by genre/subject
      else if (criteria.genres && criteria.genres.length > 0) {
        searchQuery = criteria.genres[0];
        columnParam = '&column=subjects';
        console.log('🔍 [ISBNdb] Searching by GENRE/SUBJECT:', searchQuery);
      }
      // Priority 4: Use keywords for general search
      else if (criteria.keywords && criteria.keywords.length > 0) {
        searchQuery = criteria.keywords.join(' ');
        console.log('🔍 [ISBNdb] Searching by KEYWORDS:', searchQuery);
      }
      // Fallback: default to fiction
      else {
        searchQuery = 'fiction';
        console.log('🔍 [ISBNdb] No criteria - using default: fiction');
      }

      console.log('ISBNdb query:', searchQuery, columnParam);

      const response = await fetch(
        `https://api2.isbndb.com/books/${encodeURIComponent(searchQuery)}?page=1&pageSize=20${columnParam}`,
        {
          headers: {
            'Authorization': ISBNDB_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ISBNdb API error:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('ISBNdb response:', JSON.stringify(data, null, 2));

      return data;
    };

    // Helper function to translate criteria to English
    const translateToEnglish = async (criteria: SearchCriteria): Promise<SearchCriteria> => {
      console.log('Translating search criteria to English...');

      try {
        const translateResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: {
                text: 'You are a translation assistant. Translate the provided search criteria to English. Keep proper nouns (author names, book titles) as they are if they are already in Latin script. Only translate descriptive keywords and genres.'
              }
            },
            contents: [
              {
                role: 'user',
                parts: {
                  text: `Translate these book search criteria to English:
Title: ${criteria.title || 'N/A'}
Author: ${criteria.author || 'N/A'}
Keywords: ${criteria.keywords?.join(', ') || 'N/A'}
Genres: ${criteria.genres?.join(', ') || 'N/A'}

Return the translation in the same format.`
                }
              }
            ],
            tools: [
              {
                function_declarations: [
                  {
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
                ]
              }
            ],
            tool_config: {
              function_calling_config: {
                mode: "ANY",
                allowed_function_names: ["translate_criteria"]
              }
            }
          }),
        });

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          const functionCall = translateData.candidates?.[0]?.content?.parts?.[0]?.functionCall;

          if (functionCall) {
            const translatedCriteria = functionCall.args;
            console.log('Translated criteria:', translatedCriteria);

            const newCriteria = { ...criteria };

            if (translatedCriteria.title && criteria.title) {
              newCriteria.title = translatedCriteria.title;
            }
            if (translatedCriteria.author && criteria.author) {
              newCriteria.author = translatedCriteria.author;
            }
            if (translatedCriteria.keywords && criteria.keywords) {
              newCriteria.keywords = translatedCriteria.keywords;
            }
            if (translatedCriteria.genres && criteria.genres) {
              newCriteria.genres = translatedCriteria.genres;
            }

            return newCriteria;
          }
        }
      } catch (translateError) {
        console.error('Error during translation:', translateError);
      }

      return criteria; // Return original if translation fails
    };

    // Helper function to translate a string (for description fallback)
    const translateText = async (text: string, targetLang: string): Promise<string> => {
      try {
        console.log(`Translating text to ${targetLang}...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Translate the following book description to ${targetLang}. Preserve the meaning and tone:\n\n${text}` }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const translated = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (translated) return translated;
        }
      } catch (error) {
        console.error('Text translation error:', error);
      }
      return text;
    };

    // STEP 1: Search with original language criteria
    console.log('STEP 1: Searching in original language...');
    let isbndbData = await searchISBNdb(searchCriteria);
    let usedTranslation = false;

    // STEP 2: Filter by language if user specified a language
    let filteredBooks = isbndbData?.books || [];

    if (searchCriteria.language && filteredBooks.length > 0) {
      const languageFiltered = filteredBooks.filter((book: any) => {
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

      console.log(`Filtered by language: ${languageFiltered.length} books found`);

      // If we found books in the requested language, use them
      if (languageFiltered.length > 0) {
        filteredBooks = languageFiltered;
      }
    }

    // STEP 3: If no books found in original language, translate and retry
    // We try translation if:
    // 1. No books found
    // 2. AND (Language is NOT English OR Language is undefined) - if it's undefined, it might be a non-English query that needs translation
    if (filteredBooks.length === 0 && (!searchCriteria.language || searchCriteria.language.toLowerCase() !== 'english')) {
      console.log('STEP 3: No books found. Attempting translation to English...');

      const translatedCriteria = await translateToEnglish(searchCriteria);
      translatedCriteria.language = 'english'; // Override language to search for English books

      isbndbData = await searchISBNdb(translatedCriteria);
      filteredBooks = isbndbData?.books || [];
      usedTranslation = true;

      console.log(`After English translation search: ${filteredBooks.length} books found`);
    }

    // If still no books, return null
    if (!isbndbData || !isbndbData.books || isbndbData.books.length === 0) {
      console.log('No books found after all attempts');
      return new Response(
        JSON.stringify({ book: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter books by year range if specified
    if (searchCriteria.year_range && filteredBooks.length > 0) {
      const beforeFiltering = filteredBooks.length;
      filteredBooks = filteredBooks.filter((book: any) => {
        if (!book.date_published) return false;
        const year = parseInt(book.date_published.substring(0, 4));
        if (searchCriteria.year_range?.min && year < searchCriteria.year_range.min) return false;
        if (searchCriteria.year_range?.max && year > searchCriteria.year_range.max) return false;
        return true;
      });
      console.log(`📅 [Year Filter] ${searchCriteria.year_range.min}-${searchCriteria.year_range.max}: ${beforeFiltering} → ${filteredBooks.length} books`);
    }

    // Filter out previously shown books
    if (previousBookIds.length > 0 && filteredBooks.length > 0) {
      const availableBooks = filteredBooks.filter((book: any) =>
        !previousBookIds.includes(book.isbn13 || book.isbn)
      );

      // Use available books if any, otherwise use all filtered books
      if (availableBooks.length > 0) {
        filteredBooks = availableBooks;
        console.log(`After removing previous books: ${filteredBooks.length} books`);
      }
    }

    // If still no books after all filtering, return null
    if (filteredBooks.length === 0) {
      console.log('No books found after all filtering');
      return new Response(
        JSON.stringify({ book: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AI Re-ranking AND Translation: Use Gemini to select best book AND translate its description
    let selectedBook = filteredBooks[0]; // Default fallback
    let translatedDescription = null; // Store translated description

    if (filteredBooks.length > 0) { // Changed to always run re-ranking/translation logic even for 1 book if we need translation
      try {
        // Limit to top 10 books for Gemini analysis
        const booksToAnalyze = filteredBooks.slice(0, 10);

        const booksForRanking = booksToAnalyze.map((book: any, index: number) => ({
          index,
          title: book.title || 'Unknown',
          author: book.authors?.join(', ') || 'Unknown',
          year: book.date_published?.substring(0, 4) || 'Unknown',
          description: (book.synopsis || book.title_long || '').substring(0, 500),
          subjects: book.subjects?.slice(0, 5) || []
        }));

        console.log('Sending to Gemini for ranking and translation:', booksForRanking.length, 'books');

        const shouldTranslate = targetLanguage && targetLanguage !== 'en';

        const systemInstruction = `You are a book recommendation expert. Analyze the user's query and select the BEST matching book from the available options.

CRITICAL MATCHING RULES:
1. Understand USER INTENT - what is the user REALLY asking for?
   - "Greek book about a Greek writer" → wants books BY Greek authors or ABOUT Greek literature
   - "mystery from the 1930s" → wants mystery novels published in that decade
   
2. PRIORITY:
   a) Perfect intent match
   b) Partial match but high quality
   c) Keyword match but wrong context (AVOID)

Select the BEST matching book.${shouldTranslate ? `
ALSO, translate the book's description to ${targetLanguage}. The translation must be fluent and natural.` : ''}`;

        const rankingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: {
                text: systemInstruction
              }
            },
            contents: [
              {
                role: 'user',
                parts: {
                  text: `User Query: "${prompt}"

Available Books:
${JSON.stringify(booksForRanking, null, 2)}

Select the BEST matching book${shouldTranslate ? ` and translate description to ${targetLanguage}` : ''}.`
                }
              }
            ],
            tools: [
              {
                function_declarations: [
                  {
                    name: 'select_best_book',
                    description: 'Select the best matching book from the list',
                    parameters: {
                      type: 'object',
                      properties: {
                        best_book_index: {
                          type: 'number',
                          description: 'The index (0-based) of the best matching book'
                        },
                        reasoning: {
                          type: 'string',
                          description: 'Brief explanation of why this book was selected'
                        },
                        translated_description: {
                          type: 'string',
                          description: shouldTranslate ? `The book description translated to ${targetLanguage}` : 'Optional translated description'
                        }
                      },
                      required: ['best_book_index', 'reasoning']
                    }
                  }
                ]
              }
            ],
            tool_config: {
              function_calling_config: {
                mode: "ANY",
                allowed_function_names: ["select_best_book"]
              }
            }
          }),
        });

        if (rankingResponse.ok) {
          const rankingData = await rankingResponse.json();
          const functionCall = rankingData.candidates?.[0]?.content?.parts?.[0]?.functionCall;

          if (functionCall) {
            const selectionResult = functionCall.args;
            const bestIndex = selectionResult.best_book_index;

            if (typeof bestIndex === 'number' && bestIndex >= 0 && bestIndex < booksToAnalyze.length) {
              selectedBook = booksToAnalyze[bestIndex];
              translatedDescription = selectionResult.translated_description;
              console.log(`Gemini selected book at index ${bestIndex}: ${selectedBook.title}`);
              console.log(`Reasoning: ${selectionResult.reasoning}`);
              if (translatedDescription) console.log('Got translated description from Gemini');
            } else {
              console.warn('Invalid book index from Gemini, using first book');
            }
          }
        } else {
          console.error('Gemini ranking failed, using first book');
        }
      } catch (rankingError) {
        console.error('Error during AI ranking:', rankingError);
        // Fall back to first book if ranking fails
      }
    }

    // Attach translated description to selected book object if available
    if (translatedDescription) {
      selectedBook = { ...selectedBook, translated_description: translatedDescription };
    } else if (targetLanguage && targetLanguage !== 'en') {
      // Fallback: if Gemini ranking didn't return translation (or failed), we can do a quick discrete translation here if really needed,
      // but to keep it fast we might skip it or rely on valid re-ranking response.
      // Let's rely on the previous logic or do a minimal effort one if optimization is key.
      // Given the goal is speed, we attempted it in the ranking. If that failed, we proceed with original.
      console.log('No translated description from ranking, returning original');
    }

    console.log(`Returning book: ${selectedBook.title} (Used translation: ${usedTranslation})`);

    return new Response(
      JSON.stringify({
        book: selectedBook,
        searchCriteria,
        usedTranslation
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
