/**
 * Voice options and configurations for Anonymous Editor
 */

export const voiceOptions = {
    male: [
        { id: 'hi-IN-rahul', name: 'Rahul', style: 'General', language: 'Hindi', accent: 'Indian' },
        { id: 'en-IN-eashwar', name: 'Eashwar', style: 'Conversational', language: 'English', accent: 'Indian' }
    ],
    female: [
        { id: 'ta-IN-iniya', name: 'Iniya', style: 'Narration', language: 'Tamil/English', accent: 'Indian' },
        { id: 'en-IN-arohi', name: 'Arohi', style: 'Promo', language: 'English', accent: 'Indian' },
        { id: 'en-IN-priya', name: 'Priya', style: 'Narration', language: 'English', accent: 'Indian' },
        { id: 'hi-IN-ayushi', name: 'Ayushi', style: 'Conversational', language: 'Hindi', accent: 'Indian' },
        { id: 'hi-IN-shweta', name: 'Shweta', style: 'Promo', language: 'Hindi', accent: 'Indian' }
    ]
};

/**
 * Get voice information by ID
 * @param {string} voiceId - Voice ID to search for
 * @returns {Object} Voice information object
 */
export const getVoiceById = (voiceId) => {
    const allVoices = [...voiceOptions.male, ...voiceOptions.female];
    return allVoices.find(voice => voice.id === voiceId) || voiceOptions.male[0];
};

/**
 * Get all available voices as a flat array
 * @returns {Array} All voice options
 */
export const getAllVoices = () => {
    return [...voiceOptions.male, ...voiceOptions.female];
};

/**
 * Default voice selection
 */
export const DEFAULT_VOICE = 'hi-IN-rahul';