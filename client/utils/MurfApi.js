import axios from 'axios';

const API_BASE_URL = 'https://api.murf.ai/v1/voice-changer';
const API_KEY = import.meta.env.VITE_MURF_API_KEY;

// Log API key status (without exposing the actual key)
console.log("Murf API Key configured:", !!API_KEY);
if (API_KEY) {
    console.log("API Key prefix:", API_KEY.substring(0, 8) + "...");
}




// Voice configuration for Indian voices
const VOICE_CONFIG = {
    'hi-IN-rahul': { style: 'General', fallback: 'en-US-ken' },
    'en-IN-eashwar': { style: 'Conversational', fallback: 'en-US-ken' },
    'en-IN-arohi': { style: 'Promo', fallback: 'en-US-sarah' },
    'en-IN-priya': { style: 'Narration', fallback: 'en-US-sarah' },
    'hi-IN-ayushi': { style: 'Conversational', fallback: 'en-US-sarah' }
};

// Get voice configuration
const getVoiceConfig = (voiceId) => {
    return VOICE_CONFIG[voiceId] || { style: 'Conversational', fallback: 'en-US-ken' };
};



// Convert voice using Murf API
export const convertVoice = async (file, voiceId = 'hi-IN-rahul') => {
    if (!API_KEY) {
        throw new Error('API key not found. Please set VITE_MURF_API_KEY in your .env file');
    }

    validateAudioFile(file);

    const voiceConfig = getVoiceConfig(voiceId);
    let currentVoiceId = voiceId;
    let currentStyle = voiceConfig.style;

    try {
        // Normalize audio volume first
        console.log('Normalizing audio volume...');
        const normalizedFile = await normalizeAudioVolume(file);

        // Create FormData
        const formData = new FormData();
        formData.append('file', normalizedFile);
        formData.append('voice_id', currentVoiceId);
        formData.append('style', currentStyle);

        console.log('Converting voice with:', {
            voiceId: currentVoiceId,
            style: currentStyle,
            fileName: normalizedFile.name,
            fileSize: normalizedFile.size
        });

        // Make API request to Murf
        const response = await axios.post(
            `${API_BASE_URL}/convert`,
            formData,
            {
                headers: {
                    'api-key': API_KEY,
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 120000, // 2 minute timeout for voice conversion
            }
        );

        console.log('Voice conversion successful:', response.data);
        return response.data;

    } catch (error) {
        console.error('Voice conversion error:', error);

        // Log detailed error information
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);

            // Handle specific error cases
            if (error.response.status === 400) {
                const errorData = error.response.data;

                // If volume is still too low, skip this segment
                if (errorData && errorData.errorMessage === 'Volume is too low') {
                    console.warn('Audio volume too low even after normalization, skipping segment');
                    throw new Error('SKIP_SEGMENT_LOW_VOLUME');
                }

                // Try with fallback voice for other 400 errors
                console.log(`Trying fallback voice: ${voiceConfig.fallback}`);

                try {
                    const normalizedFile = await normalizeAudioVolume(file);
                    const fallbackFormData = new FormData();
                    fallbackFormData.append('file', normalizedFile);
                    fallbackFormData.append('voice_id', voiceConfig.fallback);
                    fallbackFormData.append('style', 'Conversational');

                    const fallbackResponse = await axios.post(
                        `${API_BASE_URL}/convert`,
                        fallbackFormData,
                        {
                            headers: {
                                'api-key': API_KEY,
                                'Content-Type': 'multipart/form-data',
                            },
                            timeout: 120000,
                        }
                    );

                    console.log('Fallback voice conversion successful');
                    return fallbackResponse.data;
                } catch (fallbackError) {
                    console.error('Fallback conversion also failed:', fallbackError);
                    throw new Error('SKIP_SEGMENT_CONVERSION_FAILED');
                }
            }
        }

        throw error;
    }
};

// Download converted audio
export const downloadConvertedAudio = async (audioUrl, filename = 'converted-voice.mp3') => {
    try {
        const response = await axios.get(audioUrl, {
            responseType: 'blob',
        });

        const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);

        // Create a download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading audio:', error);
        throw new Error('Failed to download audio');
    }
};
