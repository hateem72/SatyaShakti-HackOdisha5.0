import { useState, useEffect, useRef } from 'react';

export const useGuide = (guideSchema) => {
    const [showGuidePopup, setShowGuidePopup] = useState(false);
    const guideRef = useRef(null);

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem(guideSchema.localStorageKey);
        if (!hasSeenGuide) {
            setShowGuidePopup(true);
            localStorage.setItem(guideSchema.localStorageKey, 'true');
        }
    }, [guideSchema.localStorageKey]);

    const showGuide = () => {
        setShowGuidePopup(false);
        setTimeout(() => {
            guideRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const closeGuidePopup = () => {
        setShowGuidePopup(false);
    };

    const openGuidePopup = () => {
        setShowGuidePopup(true);
    };

    return {
        showGuidePopup,
        guideRef,
        showGuide,
        closeGuidePopup,
        openGuidePopup
    };
};