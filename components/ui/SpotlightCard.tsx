'use client';

import { useRef, ReactNode } from 'react';

interface SpotlightCardProps {
    children: ReactNode;
    className?: string;
    spotlightColor?: string;
}

/**
 * SpotlightCard — radial gradient follows mouse cursor.
 * Inspired by reactbits.dev/components/spotlight-card
 */
export default function SpotlightCard({
    children,
    className = '',
    spotlightColor = 'rgba(0, 100, 247, 0.15)',
}: SpotlightCardProps) {
    const divRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = divRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--spot-x', `${x}px`);
        el.style.setProperty('--spot-y', `${y}px`);
        el.style.setProperty('--spot-color', spotlightColor);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            className={`spotlight-card ${className}`}
            style={{
                '--spot-x': '50%',
                '--spot-y': '50%',
                '--spot-color': spotlightColor,
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
}
