import { useLayoutEffect, useCallback, useState } from 'react';

export const useRect = (ref) => {

    const [rect, setRect] = useState({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 });

    const updateRect = useCallback(() => {
        if (ref.current) {
            setRect(ref.current.getBoundingClientRect());
        }
    }, [ref]);

    useLayoutEffect(() => {
        if (!ref.current) return;

        const timeout = setTimeout(updateRect, 0); // Delay to next event loop

        const observer = new ResizeObserver(updateRect);
        observer.observe(ref.current);

        return () => {
            observer.disconnect()
            clearTimeout(timeout)
        }
    }, [updateRect, ref]);

    return rect;
};

/**
 * Higher order component to make use of the useRect
 */
export function WithRect({ forwardedRef, children }) {
    const rect = useRect(forwardedRef)
    return children(rect)
}