import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Heart } from "lucide-react";

interface BookCardProps {
  title: string;
  author: string;
  description: string;
  year?: string;
  coverUrl?: string;
  onSave?: (book: Omit<BookCardProps, 'onSave'>) => void;
}

export const BookCard = ({ title, author, description, year, coverUrl, onSave }: BookCardProps) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const bookDetails = { title, author, description, year, coverUrl };
  const cleanedDescription = description.replace(/<p>|<\/p>/g, '');
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row">
        {coverUrl && (
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogTrigger asChild>
              <div className="md:w-48 h-64 md:h-auto bg-muted flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                <img 
                  src={coverUrl} 
                  alt={`Εξώφυλλο: ${title}`}
                  className="w-full h-full object-contain"
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
        <div className="flex-1">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl md:text-3xl font-serif text-primary mb-2">
                  {title}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {author} {year && `• ${year}`}
                </CardDescription>
              </div>
              {onSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSave?.(bookDetails)}
                  className="text-primary hover:text-primary-glow hover:bg-primary/10 transition-colors"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 leading-relaxed">
              {cleanedDescription}
            </p>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};
