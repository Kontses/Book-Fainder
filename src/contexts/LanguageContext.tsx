import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'el' | 'es' | 'fr' | 'de' | 'it';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    // Auth page
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    haveAccount: 'Already have an account? Sign in',
    noAccount: "Don't have an account? Sign up",
    createAccount: 'Create an account to save your favorite books',
    signInToView: 'Sign in to view your saved books',
    pleaseComplete: 'Please fill in all fields',
    passwordLength: 'Password must be at least 6 characters',
    signedUpSuccess: 'Successfully signed up! You can now sign in.',
    signedInSuccess: 'Successfully signed in!',
    errorOccurred: 'An error occurred',
    loading: 'Loading...',
    or: 'or',
    // Main page
    profile: 'Profile',
    signOut: 'Sign Out',
    loginRegister: 'Login / Register',
    discoverYourNextBook: 'Discover your next book',
    describeBookAI: 'Describe the book you\'re looking for and AI will find the perfect recommendation for you.',
    searchPlaceholder: 'Describe the book you\'re looking for... e.g. I want a mystery novel from the 1930s',
    suggestMeBook: 'Suggest me a book',
    searching: 'Searching...',
    ourRecommendation: 'Our recommendation for you',
    startSearch: 'Start your search above',
    foundBook: 'Found the perfect book for you!',
    noBooks: 'No books found matching your criteria. Try a different search!',
    failedSearch: 'Failed to search for books. Please try again.',
    mustSignIn: 'You must sign in to save books.',
    bookSaved: 'Book added to your favorites!',
    failedSave: 'Failed to save book',
    signedOut: 'Successfully signed out.',
    failedSignOut: 'Failed to sign out',
    // Profile page
    myBooks: 'My Saved Books',
    noSavedBooks: 'No saved books yet',
    startSaving: 'Start searching for books and save your favorites!',
    // Random prompts
    randomPrompt1: 'I want a mystery novel from the 1930s',
    randomPrompt2: 'Looking for a sci-fi book about space exploration',
    randomPrompt3: 'A romantic comedy set in Paris',
    randomPrompt4: 'Historical fiction about ancient Rome',
    randomPrompt5: 'A thriller with unexpected twists',
    randomPrompt6: 'Fantasy novel with dragons and magic',
    randomPrompt7: 'Biography of an inspiring leader',
    randomPrompt8: 'Psychological horror that keeps you up at night',
  },
  el: {
    // Auth page
    signIn: 'Σύνδεση',
    signUp: 'Εγγραφή',
    email: 'Email',
    password: 'Κωδικός',
    continueWithGoogle: 'Συνέχεια με Google',
    continueWithApple: 'Συνέχεια με Apple',
    haveAccount: 'Έχετε ήδη λογαριασμό; Συνδεθείτε',
    noAccount: 'Δεν έχετε λογαριασμό; Εγγραφείτε',
    createAccount: 'Δημιουργήστε λογαριασμό για να αποθηκεύετε τα αγαπημένα σας βιβλία',
    signInToView: 'Συνδεθείτε για να δείτε τα αποθηκευμένα σας βιβλία',
    pleaseComplete: 'Παρακαλώ συμπληρώστε όλα τα πεδία',
    passwordLength: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες',
    signedUpSuccess: 'Εγγραφήκατε επιτυχώς! Μπορείτε τώρα να συνδεθείτε.',
    signedInSuccess: 'Συνδεθήκατε επιτυχώς!',
    errorOccurred: 'Παρουσιάστηκε σφάλμα',
    loading: 'Περιμένετε...',
    or: 'ή',
    // Main page
    profile: 'Προφίλ',
    signOut: 'Αποσύνδεση',
    loginRegister: 'Σύνδεση / Εγγραφή',
    discoverYourNextBook: 'Ανακαλύψτε το επόμενο βιβλίο σας',
    describeBookAI: 'Περιγράψτε το βιβλίο που ψάχνετε και η τεχνητή νοημοσύνη θα βρει την τέλεια σύσταση για εσάς.',
    searchPlaceholder: 'Περιγράψτε το βιβλίο που ψάχνετε... π.χ. Θέλω ένα μυστήριο μυθιστόρημα από τη δεκαετία του 1930',
    suggestMeBook: 'Πρότεινέ μου ένα βιβλίο',
    searching: 'Αναζήτηση...',
    ourRecommendation: 'Η πρότασή μας για εσάς',
    startSearch: 'Ξεκινήστε την αναζήτησή σας παραπάνω',
    foundBook: 'Βρήκαμε το τέλειο βιβλίο για εσάς!',
    noBooks: 'Δεν βρέθηκαν βιβλία που να ταιριάζουν με τα κριτήριά σας. Δοκιμάστε διαφορετική αναζήτηση!',
    failedSearch: 'Αποτυχία αναζήτησης βιβλίων. Παρακαλώ δοκιμάστε ξανά.',
    mustSignIn: 'Πρέπει να συνδεθείτε για να αποθηκεύσετε βιβλία.',
    bookSaved: 'Το βιβλίο προστέθηκε στα αγαπημένα σας!',
    failedSave: 'Αποτυχία αποθήκευσης βιβλίου',
    signedOut: 'Αποσυνδεθήκατε επιτυχώς.',
    failedSignOut: 'Αποτυχία αποσύνδεσης',
    // Profile page
    myBooks: 'Τα Αποθηκευμένα μου Βιβλία',
    noSavedBooks: 'Δεν υπάρχουν αποθηκευμένα βιβλία ακόμα',
    startSaving: 'Ξεκινήστε να αναζητάτε βιβλία και αποθηκεύστε τα αγαπημένα σας!',
    // Random prompts
    randomPrompt1: 'Θέλω ένα μυστήριο μυθιστόρημα από τη δεκαετία του 1930',
    randomPrompt2: 'Ψάχνω για ένα βιβλίο επιστημονικής φαντασίας για διαστημική εξερεύνηση',
    randomPrompt3: 'Μια ρομαντική κωμωδία στο Παρίσι',
    randomPrompt4: 'Ιστορική μυθοπλασία για την αρχαία Ρώμη',
    randomPrompt5: 'Ένα θρίλερ με απροσδόκητες ανατροπές',
    randomPrompt6: 'Μυθιστόρημα φαντασίας με δράκους και μαγεία',
    randomPrompt7: 'Βιογραφία ενός εμπνευσμένου ηγέτη',
    randomPrompt8: 'Ψυχολογικός τρόμος που σε κρατάει ξάγρυπνο',
  },
  es: {
    // Auth page
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    continueWithGoogle: 'Continuar con Google',
    continueWithApple: 'Continuar con Apple',
    haveAccount: '¿Ya tienes una cuenta? Inicia sesión',
    noAccount: '¿No tienes cuenta? Regístrate',
    createAccount: 'Crea una cuenta para guardar tus libros favoritos',
    signInToView: 'Inicia sesión para ver tus libros guardados',
    pleaseComplete: 'Por favor completa todos los campos',
    passwordLength: 'La contraseña debe tener al menos 6 caracteres',
    signedUpSuccess: '¡Registro exitoso! Ahora puedes iniciar sesión.',
    signedInSuccess: '¡Inicio de sesión exitoso!',
    errorOccurred: 'Ocurrió un error',
    loading: 'Cargando...',
    or: 'o',
    // Main page
    profile: 'Perfil',
    signOut: 'Cerrar sesión',
    loginRegister: 'Iniciar sesión / Registrarse',
    discoverYourNextBook: 'Descubre tu próximo libro',
    describeBookAI: 'Describe el libro que buscas y la IA encontrará la recomendación perfecta para ti.',
    searchPlaceholder: 'Describe el libro que buscas... ej. Quiero una novela de misterio de los años 30',
    suggestMeBook: 'Sugiéreme un libro',
    searching: 'Buscando...',
    ourRecommendation: 'Nuestra recomendación para ti',
    startSearch: 'Comienza tu búsqueda arriba',
    foundBook: '¡Encontramos el libro perfecto para ti!',
    noBooks: 'No se encontraron libros que coincidan con tus criterios. ¡Intenta una búsqueda diferente!',
    failedSearch: 'Error al buscar libros. Por favor, inténtalo de nuevo.',
    mustSignIn: 'Debes iniciar sesión para guardar libros.',
    bookSaved: '¡Libro agregado a tus favoritos!',
    failedSave: 'Error al guardar libro',
    signedOut: 'Sesión cerrada exitosamente.',
    failedSignOut: 'Error al cerrar sesión',
    // Profile page
    myBooks: 'Mis Libros Guardados',
    noSavedBooks: 'Aún no hay libros guardados',
    startSaving: '¡Comienza a buscar libros y guarda tus favoritos!',
    // Random prompts
    randomPrompt1: 'Quiero una novela de misterio de los años 30',
    randomPrompt2: 'Busco un libro de ciencia ficción sobre exploración espacial',
    randomPrompt3: 'Una comedia romántica ambientada en París',
    randomPrompt4: 'Ficción histórica sobre la antigua Roma',
    randomPrompt5: 'Un thriller con giros inesperados',
    randomPrompt6: 'Novela de fantasía con dragones y magia',
    randomPrompt7: 'Biografía de un líder inspirador',
    randomPrompt8: 'Terror psicológico que te mantiene despierto',
  },
  fr: {
    // Auth page
    signIn: 'Se connecter',
    signUp: "S'inscrire",
    email: 'Email',
    password: 'Mot de passe',
    continueWithGoogle: 'Continuer avec Google',
    continueWithApple: 'Continuer avec Apple',
    haveAccount: 'Vous avez déjà un compte? Connectez-vous',
    noAccount: "Vous n'avez pas de compte? Inscrivez-vous",
    createAccount: 'Créez un compte pour sauvegarder vos livres préférés',
    signInToView: 'Connectez-vous pour voir vos livres sauvegardés',
    pleaseComplete: 'Veuillez remplir tous les champs',
    passwordLength: 'Le mot de passe doit contenir au moins 6 caractères',
    signedUpSuccess: 'Inscription réussie! Vous pouvez maintenant vous connecter.',
    signedInSuccess: 'Connexion réussie!',
    errorOccurred: 'Une erreur est survenue',
    loading: 'Chargement...',
    or: 'ou',
    // Main page
    profile: 'Profil',
    signOut: 'Se déconnecter',
    loginRegister: 'Connexion / Inscription',
    discoverYourNextBook: 'Découvrez votre prochain livre',
    describeBookAI: 'Décrivez le livre que vous recherchez et l\'IA trouvera la recommandation parfaite pour vous.',
    searchPlaceholder: 'Décrivez le livre que vous cherchez... ex. Je veux un roman policier des années 1930',
    suggestMeBook: 'Suggérez-moi un livre',
    searching: 'Recherche...',
    ourRecommendation: 'Notre recommandation pour vous',
    startSearch: 'Commencez votre recherche ci-dessus',
    foundBook: 'Nous avons trouvé le livre parfait pour vous!',
    noBooks: 'Aucun livre trouvé correspondant à vos critères. Essayez une recherche différente!',
    failedSearch: 'Échec de la recherche de livres. Veuillez réessayer.',
    mustSignIn: 'Vous devez vous connecter pour enregistrer des livres.',
    bookSaved: 'Livre ajouté à vos favoris!',
    failedSave: 'Échec de l\'enregistrement du livre',
    signedOut: 'Déconnexion réussie.',
    failedSignOut: 'Échec de la déconnexion',
    // Profile page
    myBooks: 'Mes Livres Enregistrés',
    noSavedBooks: 'Aucun livre enregistré pour le moment',
    startSaving: 'Commencez à rechercher des livres et enregistrez vos favoris!',
    // Random prompts
    randomPrompt1: 'Je veux un roman policier des années 1930',
    randomPrompt2: 'À la recherche d\'un livre de science-fiction sur l\'exploration spatiale',
    randomPrompt3: 'Une comédie romantique se déroulant à Paris',
    randomPrompt4: 'Fiction historique sur la Rome antique',
    randomPrompt5: 'Un thriller avec des rebondissements inattendus',
    randomPrompt6: 'Roman fantastique avec des dragons et de la magie',
    randomPrompt7: 'Biographie d\'un leader inspirant',
    randomPrompt8: 'Horreur psychologique qui vous tient éveillé',
  },
  de: {
    // Auth page
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    continueWithGoogle: 'Mit Google fortfahren',
    continueWithApple: 'Mit Apple fortfahren',
    haveAccount: 'Haben Sie bereits ein Konto? Anmelden',
    noAccount: 'Kein Konto? Registrieren',
    createAccount: 'Erstellen Sie ein Konto, um Ihre Lieblingsbücher zu speichern',
    signInToView: 'Melden Sie sich an, um Ihre gespeicherten Bücher zu sehen',
    pleaseComplete: 'Bitte füllen Sie alle Felder aus',
    passwordLength: 'Das Passwort muss mindestens 6 Zeichen lang sein',
    signedUpSuccess: 'Erfolgreich registriert! Sie können sich jetzt anmelden.',
    signedInSuccess: 'Erfolgreich angemeldet!',
    errorOccurred: 'Ein Fehler ist aufgetreten',
    loading: 'Laden...',
    or: 'oder',
    // Main page
    profile: 'Profil',
    signOut: 'Abmelden',
    loginRegister: 'Anmelden / Registrieren',
    discoverYourNextBook: 'Entdecken Sie Ihr nächstes Buch',
    describeBookAI: 'Beschreiben Sie das Buch, das Sie suchen, und die KI findet die perfekte Empfehlung für Sie.',
    searchPlaceholder: 'Beschreiben Sie das Buch, das Sie suchen... z.B. Ich möchte einen Kriminalroman aus den 1930er Jahren',
    suggestMeBook: 'Schlagen Sie mir ein Buch vor',
    searching: 'Suche...',
    ourRecommendation: 'Unsere Empfehlung für Sie',
    startSearch: 'Starten Sie Ihre Suche oben',
    foundBook: 'Das perfekte Buch für Sie gefunden!',
    noBooks: 'Keine Bücher gefunden, die Ihren Kriterien entsprechen. Versuchen Sie eine andere Suche!',
    failedSearch: 'Fehler bei der Buchsuche. Bitte versuchen Sie es erneut.',
    mustSignIn: 'Sie müssen sich anmelden, um Bücher zu speichern.',
    bookSaved: 'Buch zu Ihren Favoriten hinzugefügt!',
    failedSave: 'Fehler beim Speichern des Buches',
    signedOut: 'Erfolgreich abgemeldet.',
    failedSignOut: 'Fehler beim Abmelden',
    // Profile page
    myBooks: 'Meine Gespeicherten Bücher',
    noSavedBooks: 'Noch keine gespeicherten Bücher',
    startSaving: 'Beginnen Sie mit der Suche nach Büchern und speichern Sie Ihre Favoriten!',
    // Random prompts
    randomPrompt1: 'Ich möchte einen Kriminalroman aus den 1930er Jahren',
    randomPrompt2: 'Auf der Suche nach einem Science-Fiction-Buch über Weltraumforschung',
    randomPrompt3: 'Eine romantische Komödie in Paris',
    randomPrompt4: 'Historische Fiktion über das antike Rom',
    randomPrompt5: 'Ein Thriller mit unerwarteten Wendungen',
    randomPrompt6: 'Fantasy-Roman mit Drachen und Magie',
    randomPrompt7: 'Biografie eines inspirierenden Führers',
    randomPrompt8: 'Psycho-Horror, der Sie wach hält',
  },
  it: {
    // Auth page
    signIn: 'Accedi',
    signUp: 'Registrati',
    email: 'Email',
    password: 'Password',
    continueWithGoogle: 'Continua con Google',
    continueWithApple: 'Continua con Apple',
    haveAccount: 'Hai già un account? Accedi',
    noAccount: 'Non hai un account? Registrati',
    createAccount: 'Crea un account per salvare i tuoi libri preferiti',
    signInToView: 'Accedi per vedere i tuoi libri salvati',
    pleaseComplete: 'Compila tutti i campi',
    passwordLength: 'La password deve contenere almeno 6 caratteri',
    signedUpSuccess: 'Registrazione avvenuta con successo! Ora puoi accedere.',
    signedInSuccess: 'Accesso avvenuto con successo!',
    errorOccurred: 'Si è verificato un errore',
    loading: 'Caricamento...',
    or: 'o',
    // Main page
    profile: 'Profilo',
    signOut: 'Esci',
    loginRegister: 'Accedi / Registrati',
    discoverYourNextBook: 'Scopri il tuo prossimo libro',
    describeBookAI: 'Descrivi il libro che stai cercando e l\'IA troverà la raccomandazione perfetta per te.',
    searchPlaceholder: 'Descrivi il libro che stai cercando... es. Voglio un romanzo giallo degli anni \'30',
    suggestMeBook: 'Suggeriscimi un libro',
    searching: 'Ricerca...',
    ourRecommendation: 'La nostra raccomandazione per te',
    startSearch: 'Inizia la tua ricerca sopra',
    foundBook: 'Trovato il libro perfetto per te!',
    noBooks: 'Nessun libro trovato corrispondente ai tuoi criteri. Prova una ricerca diversa!',
    failedSearch: 'Ricerca libri fallita. Riprova.',
    mustSignIn: 'Devi accedere per salvare i libri.',
    bookSaved: 'Libro aggiunto ai tuoi preferiti!',
    failedSave: 'Salvataggio libro fallito',
    signedOut: 'Disconnessione avvenuta con successo.',
    failedSignOut: 'Disconnessione fallita',
    // Profile page
    myBooks: 'I Miei Libri Salvati',
    noSavedBooks: 'Nessun libro salvato ancora',
    startSaving: 'Inizia a cercare libri e salva i tuoi preferiti!',
    // Random prompts
    randomPrompt1: 'Voglio un romanzo giallo degli anni \'30',
    randomPrompt2: 'Cerco un libro di fantascienza sull\'esplorazione spaziale',
    randomPrompt3: 'Una commedia romantica ambientata a Parigi',
    randomPrompt4: 'Narrativa storica sull\'antica Roma',
    randomPrompt5: 'Un thriller con colpi di scena inaspettati',
    randomPrompt6: 'Romanzo fantasy con draghi e magia',
    randomPrompt7: 'Biografia di un leader ispiratore',
    randomPrompt8: 'Horror psicologico che ti tiene sveglio',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};