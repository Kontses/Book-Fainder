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
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'el', name: 'Ελληνικά', flag: 'https://flagcdn.com/w40/gr.png' },
  { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'it', name: 'Italiano', flag: 'https://flagcdn.com/w40/it.png' },
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
                <motion.img
                  initial="closed"
                  animate="open"
                  src={lang.flag}
                  alt={lang.name}
                  className="mr-2 h-4 w-6 object-cover rounded-sm shadow-sm"
                  variants={{
                    open: {
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      transition: {
                        delay: 0.8, // Increased delay to be clearly after text
                        type: "spring",
                        stiffness: 300,
                        damping: 24
                      }
                    },
                    closed: { opacity: 0, scale: 0, x: -20 } // More dramatic hidden state
                  }}
                />
                {lang.name}
              </DropdownMenuItem>
            </motion.div>
          ))}
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};