

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

export const getVoiceById = (voiceId) => {
    const allVoices = [...voiceOptions.male, ...voiceOptions.female];
    return allVoices.find(voice => voice.id === voiceId) || voiceOptions.male[0];
};


export const getAllVoices = () => {
    return [...voiceOptions.male, ...voiceOptions.female];
};


export const DEFAULT_VOICE = 'hi-IN-rahul';