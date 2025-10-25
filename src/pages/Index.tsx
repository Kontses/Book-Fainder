import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { BookOpen, User } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [currentBook, setCurrentBook] = useState<any>(null);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    
    // Simulate AI processing and database query
    setTimeout(() => {
      // Mock book data
      setCurrentBook({
        title: "Η Γενιά του '30",
        author: "Γιώργος Σεφέρης",
        description: "Ένα από τα σημαντικότερα έργα της νεοελληνικής λογοτεχνίας, που αντιπροσωπεύει την ποιητική κίνηση της γενιάς του 1930. Συνδυάζει τον μοντερνισμό με την ελληνική παράδοση.",
        year: "1935",
        coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"
      });
      setIsSearching(false);
      toast.success("Βρήκαμε το τέλειο βιβλίο για εσάς!");
    }, 2000);
  };

  const handleSaveBook = () => {
    toast.success("Το βιβλίο προστέθηκε στις αγαπημένες σας!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-primary">Βιβλιοθήκη</h1>
          </div>
          <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">
            <User className="mr-2 h-5 w-5" />
            Είσοδος
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4">
            Ανακαλύψτε το επόμενο σας βιβλίο
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Περιγράψτε με τα λόγια σας το βιβλίο που αναζητάτε και η τεχνητή νοημοσύνη θα βρει την τέλεια πρόταση για εσάς.
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {/* Results Section */}
        {currentBook && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-serif font-semibold text-foreground mb-6 text-center">
              Η πρόταση μας για εσάς
            </h3>
            <BookCard
              title={currentBook.title}
              author={currentBook.author}
              description={currentBook.description}
              year={currentBook.year}
              coverUrl={currentBook.coverUrl}
              onSave={handleSaveBook}
            />
          </div>
        )}

        {/* Empty State */}
        {!currentBook && !isSearching && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-20 w-20 mx-auto mb-4 opacity-40" />
            <p className="text-lg">Ξεκινήστε την αναζήτησή σας παραπάνω</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
