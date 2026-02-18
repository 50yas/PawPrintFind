
import React, { useState, useRef, useCallback, useEffect, RefObject } from 'react';

interface Position {
    x: number;
    y: number;
}

export const useDraggable = (
    ref: RefObject<HTMLElement>,
    initialPosition: Position = { x: 0, y: 0 }
) => {
    const [position, setPosition] = useState<Position>(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef<Position>({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (ref.current) {
            setIsDragging(true);
            const rect = ref.current.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            // Prevent text selection while dragging
            e.preventDefault();
        }
    }, [ref]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging && ref.current) {
            const newX = e.clientX - dragOffset.current.x;
            const newY = e.clientY - dragOffset.current.y;
            
            // Boundary checks to keep the window on screen
            const maxX = window.innerWidth - ref.current.offsetWidth;
            const maxY = window.innerHeight - ref.current.offsetHeight;
            
            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY)),
            });
        }
    }, [isDragging, ref]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return {
        position,
        setPosition,
        handleMouseDown,
        isDragging
    };
};
