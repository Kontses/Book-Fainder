import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-primary/10">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover z-50 overflow-hidden">
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={{
            open: {
              transition: {
                staggerChildren: 0.1,
              },
            },
            closed: {
              transition: {
                staggerChildren: 0.05,
                staggerDirection: -1,
              },
            },
          }}
        >
          {languages.map((lang) => (
            <motion.div
              key={lang.code}
              variants={{
                open: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                  },
                },
                closed: { opacity: 0, y: -20, transition: { duration: 0.2 } },
              }}
            >
              <DropdownMenuItem
                onClick={() => setLanguage(lang.code as any)}
                className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </DropdownMenuItem>
            </motion.div>
          ))}
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};