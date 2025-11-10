import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Share2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface BookCardProps {
  title: string;
  author: string;
  description: string;
  year?: string;
  coverUrl?: string;
  isbn?: string;
  onSave?: (book: Omit<BookCardProps, 'onSave'>) => void;
  isSaved?: boolean; // New prop
}

export const BookCard = ({ title, author, description, year, coverUrl, isbn, onSave, isSaved = false }: BookCardProps) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const bookDetails = { title, author, description, year, coverUrl };
  // Remove all HTML tags from description
  const cleanedDescription = description.replaceAll(/<[^>]*>/g, '');
  
  // Amazon Affiliate configuration
  const AMAZON_AFFILIATE_TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'your-tag-20';
  
  const getAmazonLink = () => {
    // Use ISBN if available, otherwise search by title and author
    const searchQuery = isbn || `${title} ${author}`;
    return `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}&tag=${AMAZON_AFFILIATE_TAG}`;
  };
  
  const handleShare = async () => {
    const shareData = {
      title: `Book Recommendation: ${title}`,
      text: `Check out this book: "${title}" by ${author}`,
      url: globalThis.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      navigator.clipboard.writeText(shareText);
      toast.success('Link copied to clipboard!');
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-elegant hover:scale-[1.02] border-border/50 bg-card/80 backdrop-blur-sm min-h-[22rem]">
      <div className="flex flex-col sm:flex-row">
        {coverUrl && (
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogTrigger asChild>
              <div className="w-48 h-64 flex-shrink-0 cursor-pointer hover:opacity-90 transition-all duration-300 overflow-hidden group">
                <img 
                  src={coverUrl} 
                  alt={`Εξώφυλλο: ${title}`}
                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <div className="flex items-center justify-center p-4">
                <img 
                  src={coverUrl} 
                  alt={`Εξώφυλλο: ${title}`}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        <div className="flex-1 flex flex-col p-4">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl font-serif text-primary line-clamp-2 mb-1">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-1">
                  {author} {year && `• ${year}`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-primary hover:text-primary-glow hover:bg-primary/10 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                {onSave && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSave?.(bookDetails)}
                    className={`${isSaved ? "text-red-500 hover:text-red-600" : "text-primary hover:text-primary-glow"} hover:bg-primary/10 transition-colors`}
                  >
                    <Heart className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col justify-between">
            <p className="text-foreground/80 leading-relaxed text-sm line-clamp-4 mb-4 overflow-y-auto max-h-24">
              {cleanedDescription}
            </p>
            <Button
              className="w-full bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-semibold transition-all duration-300 hover:shadow-lg mt-auto"
              onClick={() => window.open(getAmazonLink(), '_blank', 'noopener,noreferrer')}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              View on Amazon
            </Button>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};
