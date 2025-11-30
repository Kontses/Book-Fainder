import { useState, useEffect } from 'react';

interface UseTypewriterProps {
    text: string;
    speed?: number;
    delay?: number;
    cursor?: string;
}

export const useTypewriter = ({ text, speed = 50, delay = 0, cursor = '_' }: UseTypewriterProps) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        // Reset when text changes
        setDisplayText('');
        setCurrentIndex(0);
        setIsStarted(false);
        setShowCursor(true);
    }, [text]);

    // Typing effect
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (!isStarted) {
            timeout = setTimeout(() => {
                setIsStarted(true);
            }, delay);
            return () => clearTimeout(timeout);
        }

        if (currentIndex < text.length) {
            timeout = setTimeout(() => {
                setDisplayText((prev) => prev + text[currentIndex]);
                setCurrentIndex((prev) => prev + 1);
            }, speed);
        }

        return () => clearTimeout(timeout);
    }, [currentIndex, isStarted, text, speed, delay]);

    // Blinking cursor effect when finished or waiting
    useEffect(() => {
        const interval = setInterval(() => {
            setShowCursor((prev) => !prev);
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return `${displayText}${showCursor ? cursor : ''}`;
};
