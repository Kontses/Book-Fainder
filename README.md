# Book Fainder

## Επισκόπηση Έργου

Το Book Fainder είναι ένα έξυπνο σύστημα προτάσεων βιβλίων που επιτρέπει στους χρήστες να περιγράφουν το επιθυμητό βιβλίο τους σε φυσική γλώσσα (Prompt), όπως: "Θέλω ένα mystery novel από τη δεκαετία του 1930" ή "Θέλω ελληνική ποίηση". Η εφαρμογή χρησιμοποιεί **AI Re-Ranking με Google Gemini** για να μεταφράσει την περιγραφή του χρήστη σε δομημένα κριτήρια αναζήτησης και να επιλέξει το **πιο ταιριαστό βιβλίο** από τη βάση δεδομένων με βάση τη συνάφεια, την ποιότητα και την πρόθεση του χρήστη.

Οι χρήστες μπορούν να αποθηκεύουν τα αγαπημένα τους βιβλία σε προσωπικές λίστες (δημόσιες ή ιδιωτικές), να προσθέτουν φίλους και να εξερευνούν τις βιβλιοθήκες τους, και να μεταφράζουν αυτόματα τις περιγραφές βιβλίων σε 6 γλώσσες.

## Βασικές Λειτουργίες

### 🤖 AI-Powered Search & Re-Ranking
*   **Έξυπνη Ανάλυση Prompt:** Το Gemini αναλύει το prompt του χρήστη και εξάγει δομημένα κριτήρια (είδος, δεκαετία, συγγραφέας, γλώσσα, keywords).
*   **AI Re-Ranking:** Από τα φιλτραρισμένα αποτελέσματα, το Gemini επιλέγει το **πιο ταιριαστό βιβλίο** με βάση τη συνάφεια και την πρόθεση του χρήστη.
*   **Έξυπνο Φιλτράρισμα:** Αυτόματη αναγνώριση δεκαετιών (π.χ. "1930s" → 1930-1939), ειδών, και γλωσσών.

### 📚 Διαχείριση Βιβλιοθήκης
*   **Αποθήκευση Βιβλίων:** Δυνατότητα αποθήκευσης βιβλίων με ένα κλικ στη συλλογή "My Books".
*   **Προσωπικές Λίστες:** Δημιουργία custom λιστών με δημόσια ή ιδιωτική ορατότητα.
*   **Hover-to-Save:** Mouseover στην καρδούλα εμφανίζει τις λίστες για άμεση προσθήκη.

### 👥 Social Features
*   **Friends System:** Προσθήκη φίλων και εξερεύνηση των βιβλιοθηκών τους.
*   **Δημόσιες Λίστες:** Μοιράσου τις λίστες σου με την κοινότητα ή κράτησε τις ιδιωτικές.

### 🌍 Multi-Language Support
*   **6 Γλώσσες UI:** Αγγλικά, Ελληνικά, Ισπανικά, Γαλλικά, Γερμανικά, Ιταλικά.
*   **Αυτόματη Μετάφραση:** Οι περιγραφές βιβλίων μεταφράζονται αυτόματα στη γλώσσα που έχεις επιλέξει.

### 💰 Monetization
*   **Amazon Affiliate Links:** Κάθε βιβλίο περιλαμβάνει "View on Amazon" button με affiliate tag.
*   **Newsletter Subscription:** Auto-subscribe στο newsletter για προσωπικές προτάσεις.

### 🎨 User Experience
*   **Smooth Animations:** Elegant transitions για book cards, hover effects, και heart-pop animation.
*   **Theme Support:** Light/Dark mode με πλήρη υποστήριξη semantic tokens.
*   **Responsive Design:** Optimized για όλες τις συσκευές.

## Τεχνολογίες

Το έργο είναι χτισμένο με τις ακόλουθες τεχνολογίες:

*   **Frontend:**
    *   [Vite](https://vitejs.dev/): Εργαλείο build για ταχύτερη ανάπτυξη.
    *   [React](https://react.dev/): Βιβλιοθήκη JavaScript για τη δημιουργία διεπαφών χρήστη.
    *   [TypeScript](https://www.typescriptlang.org/): Γλώσσα προγραμματισμού που προσθέτει static typing στη JavaScript.
    *   [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework για γρήγορο styling.
    *   [shadcn/ui](https://ui.shadcn.com/): Συλλογή επαναχρησιμοποιήσιμων UI components.
    *   [React Router DOM](https://reactrouter.com/en/main): Για τη διαχείριση των διαδρομών στην εφαρμογή.
    *   [React Query (TanStack Query)](https://tanstack.com/query/latest): Για τη διαχείριση, caching και συγχρονισμό δεδομένων.
    *   [Sonner](https://sonner.emilkowalski.dk/): Για την εμφάνιση toast notifications.
*   **Backend & Βάση Δεδομένων:**
    *   [Supabase](https://supabase.com/): Open-source εναλλακτική λύση του Firebase, χρησιμοποιείται για authentication και βάση δεδομένων (PostgreSQL).
    *   [Supabase Functions (Deno)](https://supabase.com/docs/guides/functions): Serverless functions για την επεξεργασία αιτημάτων αναζήτησης και την κλήση εξωτερικών APIs.
*   **APIs:**
    *   [Lovable AI Gateway](https://lovable.dev/ai-gateway): Για την πρόσβαση στο Gemini API και τη μετατροπή των prompts.
    *   [ISBNdb.com API](https://isbndb.com/): Για την αναζήτηση και ανάκτηση πληροφοριών βιβλίων.

## Εγκατάσταση και Εκτέλεση

Για να εγκαταστήσετε και να εκτελέσετε το έργο τοπικά, ακολουθήστε τα παρακάτω βήματα:

1.  **Κλωνοποιήστε το αποθετήριο:**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    cd Book-Fainder
    ```

2.  **Εγκαταστήστε τις εξαρτήσεις:**
    ```bash
    npm install
    ```

3.  **Διαμόρφωση περιβαλλοντικών μεταβλητών:**
    Δημιουργήστε ένα αρχείο `.env` στο root του έργου και προσθέστε τις παρακάτω μεταβλητές. Θα πρέπει να τις λάβετε από το Supabase project σας και το Lovable AI Gateway.
    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLIC_KEY
    LOVABLE_API_KEY=YOUR_LOVABLE_API_KEY
    ISBNDB_API_KEY=YOUR_ISBNDB_API_KEY
    ```
    *   **Supabase:** Ενεργοποιήστε την αυθεντικοποίηση Google OAuth στο Supabase και δημιουργήστε τους πίνακες `profiles` και `user_books` όπως περιγράφεται παρακάτω.
    *   **Lovable AI Gateway:** Αποκτήστε ένα API Key από το Lovable AI Gateway.
    *   **ISBNdb.com:** Αποκτήστε ένα API Key από το ISBNdb.com.

4.  **Διαμόρφωση Lovable Cloud:**
    Το έργο χρησιμοποιεί **Lovable Cloud** (powered by Supabase) που παρέχει:
    *   **Database:** Αυτόματη διαχείριση schema με migrations
    *   **Authentication:** Google OAuth out-of-the-box
    *   **Edge Functions:** Serverless functions για AI και external APIs
    *   **Storage:** File handling με secure buckets
    
    Το database schema περιλαμβάνει:
    *   `profiles` - User profiles με nickname, avatar, newsletter subscription
    *   `user_books` - Αποθηκευμένα βιβλία
    *   `book_lists` - Custom λίστες με public/private visibility
    *   `list_books` - Junction table για βιβλία σε λίστες
    *   `friendships` - Friend requests και connections
    *   `genres` - Supported genres με ISBNdb codes
    *   `languages` - Supported languages με ISO codes
    *   `user_genres` - User genre preferences
    *   `user_languages` - User language preferences
    
    Όλα τα tables έχουν Row Level Security (RLS) policies για ασφάλεια.

5.  **Εκτελέστε το development server:**
    ```bash
    npm run dev
    ```
    Η εφαρμογή θα είναι διαθέσιμη στο `http://localhost:5173` (ή σε άλλο port).

## Deployment

Το έργο μπορεί να αναπτυχθεί εύκολα σε πλατφόρμες όπως το Vercel ή το Netlify, καθώς πρόκειται για μια εφαρμογή Vite. Συνιστάται η χρήση του Vercel για την ευκολία διαμόρφωσης και την αυτόματη ανάπτυξη από το Git repository σας.

### Βήματα Deployment (παράδειγμα με Vercel):

1.  **Δημιουργήστε ένα αποθετήριο Git** (π.χ., GitHub, GitLab) και ανεβάστε τον κώδικά σας.
2.  **Συνδέστε το Vercel** με το Git repository σας.
3.  **Διαμορφώστε τις περιβαλλοντικές μεταβλητές** (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, LOVABLE_API_KEY, ISBNDB_API_KEY) στο Vercel dashboard.
4.  **Deploy** την εφαρμογή.

## Architecture Highlights

### AI Re-Ranking System
Το search functionality χρησιμοποιεί dual-AI approach:
1. **Gemini για Extraction:** Αναλύει το prompt και εξάγει structured criteria (genre, year range, keywords, language)
2. **ISBNdb API Search:** Ανακτά βιβλία που ταιριάζουν στα criteria
3. **Post-filtering:** Φιλτράρει με βάση year range και language
4. **Gemini Re-Ranking:** Αναλύει τα top 10 results και επιλέγει το πιο ταιριαστό βιβλίο με reasoning

### Edge Functions
*   `search-books`: Orchestrates το AI search pipeline
*   `translate-description`: Μεταφράζει book descriptions στη γλώσσα του χρήστη

### Design System
*   Semantic color tokens (HSL-based) για consistent theming
*   Tailwind CSS με custom utilities
*   shadcn/ui components με custom variants
*   Framer Motion για smooth animations

## Περαιτέρω Ανάπτυξη

Πιθανές επεκτάσεις:
*   ⭐ Ratings & Reviews system
*   📖 Reading progress tracking
*   🎯 ML-based recommendations (collaborative filtering)
*   📧 Personalized email campaigns
*   🛒 Multiple affiliate programs (Audible, BookDepository, Greek bookstores)
*   💳 Premium subscription model
*   📊 Analytics dashboard για χρήστες

## License

MIT License - Ελεύθερο για χρήση και τροποποίηση.

---

Ελπίζουμε να απολαύσετε το Book Fainder! 📚✨
