import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface SoundContextType {
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (type: 'send' | 'received' | 'click') => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Pre-load audio elements
const sounds = {
    send: typeof Audio !== 'undefined' ? new Audio('/sounds/send.wav') : null,
    received: typeof Audio !== 'undefined' ? new Audio('/sounds/received.wav') : null,
    click: typeof Audio !== 'undefined' ? new Audio('/sounds/click.wav') : null,
};

// Set volume levels by ritik raj
if (sounds.send) sounds.send.volume = 0.5;
if (sounds.received) sounds.received.volume = 0.6;
if (sounds.click) sounds.click.volume = 0.3;

export function SoundProvider({ children }: { children: ReactNode }) {
    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('soundMuted');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('soundMuted', String(isMuted));
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const playSound = useCallback((type: 'send' | 'received' | 'click') => {
        if (isMuted) return;

        const sound = sounds[type];
        if (sound) {
            // Reset and play
            sound.currentTime = 0;
            sound.play().catch(() => {
                // Ignore autoplay errors (browser policy)
            });
        }
    }, [isMuted]);

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
}
