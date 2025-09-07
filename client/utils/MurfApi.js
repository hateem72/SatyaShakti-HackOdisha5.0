import axios from 'axios';

const API_BASE_URL = 'https://api.murf.ai/v1/voice-changer';
const API_KEY = import.meta.env.VITE_MURF_API_KEY;

// Log API key status (without exposing the actual key)
console.log("Murf API Key configured:", !!API_KEY);
if (API_KEY) {
    console.log("API Key prefix:", API_KEY.substring(0, 8) + "...");
}

// Validate audio file
export const validateAudioFile = (file) => {
    if (!file) {
        throw new Error('Please select an audio file');
    }

    if (!file.type.startsWith('audio/')) {
        throw new Error('Please select an audio file (MP3, WAV, etc.)');
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
    }

    return true;
};

// Test API connection
export const testApiConnection = async () => {
    if (!API_KEY) {
        throw new Error('API key not configured');
    }

    try {
        // Try to make a simple request to test the API
        const response = await axios.get('https://api.murf.ai/v1/voices', {
            headers: {
                'api-key': API_KEY,
            },
            timeout: 10000,
        });

        console.log('API connection test successful');
        return { success: true, voices: response.data };
    } catch (error) {
        console.error('API connection test failed:', error);
        return { success: false, error: error.message };
    }
};

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

// Normalize audio volume using Web Audio API
const normalizeAudioVolume = async (file) => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Analyze audio levels
        const channelData = audioBuffer.getChannelData(0);
        let maxAmplitude = 0;

        for (let i = 0; i < channelData.length; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
        }

        console.log('Audio analysis:', {
            maxAmplitude,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate
        });

        // If audio is too quiet (max amplitude < 0.1), normalize it
        if (maxAmplitude < 0.1 && maxAmplitude > 0) {
            const gainFactor = 0.8 / maxAmplitude; // Normalize to 80% of max

            // Create new buffer with normalized audio
            const normalizedBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const inputData = audioBuffer.getChannelData(channel);
                const outputData = normalizedBuffer.getChannelData(channel);

                for (let i = 0; i < inputData.length; i++) {
                    outputData[i] = inputData[i] * gainFactor;
                }
            }

            // Convert back to file
            const offlineContext = new OfflineAudioContext(
                normalizedBuffer.numberOfChannels,
                normalizedBuffer.length,
                normalizedBuffer.sampleRate
            );

            const source = offlineContext.createBufferSource();
            source.buffer = normalizedBuffer;
            source.connect(offlineContext.destination);
            source.start();

            const renderedBuffer = await offlineContext.startRendering();

            // Convert to WAV blob (more reliable than MP3 for processing)
            const wavBlob = audioBufferToWav(renderedBuffer);

            console.log('Audio normalized successfully');
            return new File([wavBlob], file.name.replace(/\.[^/.]+$/, '.wav'), { type: 'audio/wav' });
        }

        // Audio level is acceptable, return original
        return file;
    } catch (error) {
        console.warn('Audio normalization failed, using original:', error);
        return file;
    }
};

// Convert AudioBuffer to WAV format
const audioBufferToWav = (buffer) => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
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

// Handle API errors
export const handleApiError = (error) => {
    console.error('API Error:', error);

    if (error.response) {
        const { status, data } = error.response;

        switch (status) {
            case 400:
                if (data && data.message) {
                    return `Bad Request: ${data.message}`;
                }
                return 'Invalid request. Please check your file format and voice selection. Supported formats: WAV, MP3, ALAW, ULAW, FLAC.';
            case 401:
                return 'Invalid API key. Please check your Murf API key in the .env file.';
            case 403:
                return 'Access forbidden. Please check your API key permissions.';
            case 404:
                return 'Voice not found. The selected voice may not be available.';
            case 429:
                return 'API rate limit exceeded. Please try again later.';
            case 500:
                if (data && data.message) {
                    return `Server Error: ${data.message}`;
                }
                return 'Internal server error. The voice conversion service is temporarily unavailable. Please try again later.';
            case 503:
                return 'Service unavailable. Please try again later.';
            default:
                return `Server error (${status}): ${data?.message || 'Unknown error'}`;
        }
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        return 'Network error. Please check your internet connection.';
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return 'Request timeout. The conversion is taking too long. Please try with a smaller file.';
    } else if (error.message) {
        return error.message;
    } else {
        return 'An unexpected error occurred. Please try again.';
    }
};