import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'el' | 'es' | 'fr' | 'de' | 'it';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    continueWithFacebook: 'Continue with Facebook',
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
  },
  el: {
    signIn: 'Σύνδεση',
    signUp: 'Εγγραφή',
    email: 'Email',
    password: 'Κωδικός',
    continueWithGoogle: 'Συνέχεια με Google',
    continueWithApple: 'Συνέχεια με Apple',
    continueWithFacebook: 'Συνέχεια με Facebook',
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
  },
  es: {
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    continueWithGoogle: 'Continuar con Google',
    continueWithApple: 'Continuar con Apple',
    continueWithFacebook: 'Continuar con Facebook',
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
  },
  fr: {
    signIn: 'Se connecter',
    signUp: "S'inscrire",
    email: 'Email',
    password: 'Mot de passe',
    continueWithGoogle: 'Continuer avec Google',
    continueWithApple: 'Continuer avec Apple',
    continueWithFacebook: 'Continuer avec Facebook',
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
  },
  de: {
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    continueWithGoogle: 'Mit Google fortfahren',
    continueWithApple: 'Mit Apple fortfahren',
    continueWithFacebook: 'Mit Facebook fortfahren',
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
  },
  it: {
    signIn: 'Accedi',
    signUp: 'Registrati',
    email: 'Email',
    password: 'Password',
    continueWithGoogle: 'Continua con Google',
    continueWithApple: 'Continua con Apple',
    continueWithFacebook: 'Continua con Facebook',
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