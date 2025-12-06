import { useTypewriter } from "@/hooks/useTypewriter";

interface ProfileBioProps {
  bio: string;
}

export const ProfileBio = ({ bio }: ProfileBioProps) => {
  const displayedBio = useTypewriter({
    text: bio,
    speed: 30,
    delay: 300,
    cursor: ''
  });

  if (!bio) return null;

  return (
    <p className="text-muted-foreground italic font-serif text-lg min-h-[2rem]">
      "{displayedBio}"
    </p>
  );
};
