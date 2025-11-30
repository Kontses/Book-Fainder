import React from 'react';
import { BookOpen } from 'lucide-react';

interface ListThumbnailProps {
    coverUrls: string[];
}

export const ListThumbnail = ({ coverUrls }: ListThumbnailProps) => {
    const [isHovered, setIsHovered] = React.useState(false);

    // If no covers, show a placeholder
    if (!coverUrls || coverUrls.length === 0) {
        return (
            <div className="w-16 h-20 bg-muted rounded-md flex items-center justify-center border border-border/50 shadow-sm transition-transform duration-300 hover:scale-105">
                <BookOpen className="h-6 w-6 text-muted-foreground/50" />
            </div>
        );
    }

    // Take up to 3 covers
    const displayCovers = coverUrls.slice(0, 3);

    return (
        <div
            className="relative w-20 h-24 mr-6 flex-shrink-0 cursor-pointer group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {displayCovers.map((url, index) => {
                // Calculate styles for stacking effect
                // index 0: front (z-30), no offset
                // index 1: middle (z-20), offset right and top
                // index 2: back (z-10), more offset right and top

                // Reverse index for z-index (0 is top, so highest z-index)
                const zIndex = 30 - (index * 10);

                // Offset calculation - dynamic based on hover
                // Normal: 10px right, -8px top
                // Hover: 20px right, -12px top (spread out)
                const spreadFactor = isHovered ? 20 : 10;
                const liftFactor = isHovered ? -12 : -8;

                const left = index * spreadFactor;
                const top = index * liftFactor;

                // Scale calculation
                // Normal: slight reduction for back items
                // Hover: all items scale up slightly
                const baseScale = 1 - (index * 0.05);
                const hoverScale = isHovered ? 1.05 : 1;
                const finalScale = baseScale * hoverScale;

                // Opacity - made more visible
                const opacity = 1 - (index * 0.1); // Higher opacity (1, 0.9, 0.8)

                return (
                    <div
                        key={index}
                        className="absolute w-16 h-20 rounded-md shadow-sm overflow-hidden border border-border/50 bg-card transition-all duration-300 ease-out"
                        style={{
                            zIndex,
                            left: `${left}px`,
                            top: `${16 + top}px`, // Push down slightly to account for negative top offset
                            transform: `scale(${finalScale})`,
                            transformOrigin: 'bottom left',
                            opacity,
                        }}
                    >
                        <img
                            src={url}
                            alt={`Book cover ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback if image fails to load
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-muted');
                                e.currentTarget.parentElement!.innerHTML = '<svg class="h-4 w-4 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};
