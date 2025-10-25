# Book Fainder

## Επισκόπηση Έργου

Το Book Fainder είναι ένα έξυπνο σύστημα προτάσεων βιβλίων που επιτρέπει στους χρήστες να περιγράφουν το επιθυμητό βιβλίο τους σε φυσική γλώσσα (Prompt), όπως: "Θέλω ένα βιβλίο Έλληνα συγγραφέα γραμμένο από το '30". Η εφαρμογή μεταφράζει την περιγραφή του χρήστη σε δομημένα, αναζητήσιμα κριτήρια χρησιμοποιώντας τεχνολογία AI και εμφανίζει ένα τυχαίο αποτέλεσμα από τη βάση δεδομένων με όλες τις σχετικές πληροφορίες του βιβλίου (τίτλος, συγγραφέας, περιγραφή, έτος έκδοσης, εξώφυλλο).

Οι χρήστες μπορούν να αποθηκεύουν τα αγαπημένα τους βιβλία σε προσωπικές λίστες, τις οποίες μπορούν να δουν στο προφίλ τους.

## Βασικές Λειτουργίες

*   **AI-Powered Αναζήτηση:** Μετατροπή ελεύθερου κειμένου (prompt) σε δομημένα κριτήρια αναζήτησης (π.χ., είδος, εύρος ετών, συγγραφέας, γλώσσα, λέξεις-κλειδιά) χρησιμοποιώντας το Gemini API.
*   **Βάση Δεδομένων Βιβλίων:** Χρήση του ISBNdb.com API για την παροχή πραγματικών δεδομένων για τα βιβλία.
*   **Αυθεντικοποίηση Χρήστη:** Εγγραφή και σύνδεση μέσω Google OAuth, με διαχείριση συνεδριών μέσω Supabase.
*   **Αποθήκευση Βιβλίων:** Δυνατότητα αποθήκευσης βιβλίων στις προσωπικές λίστες του χρήστη.
*   **Προφίλ Χρήστη:** Προβολή όλων των αποθηκευμένων βιβλίων σε μια ειδική σελίδα προφίλ, με δυνατότητα διαγραφής.
*   **Δυναμικό UI:** Εμφάνιση διαφορετικών επιλογών στην κεφαλίδα (Σύνδεση/Εγγραφή ή Προφίλ/Αποσύνδεση) ανάλογα με την κατάσταση σύνδεσης του χρήστη.

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

4.  **Διαμόρφωση Supabase Database Schema:**
    Στο Supabase project σας, δημιουργήστε τους παρακάτω πίνακες:

    **Πίνακας `profiles`:**
    ```sql
    CREATE TABLE profiles (
      id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
      username text UNIQUE,
      avatar_url text
    );
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
    ```

    **Πίνακας `user_books`:**
    ```sql
    CREATE TABLE user_books (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      book_title text NOT NULL,
      book_author text,
      book_description text,
      book_year text,
      book_cover_url text,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view their own books." ON user_books FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own books." ON user_books FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own books." ON user_books FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own books." ON user_books FOR DELETE USING (auth.uid() = user_id);
    ```

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

## Περαιτέρω Ανάπτυξη

Ο κώδικας είναι δομημένος με τέτοιο τρόπο ώστε να επιτρέπει εύκολη επέκταση και προσθήκη νέων λειτουργιών, όπως:

*   Πολλαπλές λίστες βιβλίων για κάθε χρήστη.
*   Προηγμένη αναζήτηση και φιλτράρισμα στη σελίδα προφίλ.
*   Βαθμολογήσεις και κριτικές βιβλίων.
*   Κοινωνική κοινή χρήση βιβλίων.
*   Ενσωμάτωση με άλλες βιβλιοθήκες βιβλίων ή πηγές δεδομένων.

Ελπίζουμε να απολαύσετε το Book Fainder!
