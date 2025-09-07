import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Mic, Music, Play, Pause, Volume2, User, Users, Sparkles, CheckCircle2, AlertCircle, Loader2, Square, RotateCcw, Info, BookOpen } from 'lucide-react';
import { convertVoice, handleApiError, testApiConnection } from '../../utils/MurfApi';
import { createAudioUrl, revokeAudioUrl, formatFileSize, isAudioFile } from '../../utils/AudioHelpers';
import GuidePopup from '../components/GuidePopup';
import { useGuide } from '../hooks/useGuide';
import { voiceChangerGuideSchema } from '../data/guideSchemas';

const AudioVoiceChanger = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState('hi-IN-rahul');
    const [isProcessing, setIsProcessing] = useState(false);
    const [convertedAudioUrl, setConvertedAudioUrl] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioStream, setAudioStream] = useState(null);
    const fileInputRef = useRef(null);
    const audioRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    
    const { showGuidePopup, guideRef, showGuide, closeGuidePopup, openGuidePopup } = useGuide(voiceChangerGuideSchema);

    const voiceOptions = {
        male: [
            { id: 'hi-IN-rahul', name: 'Rahul', style: 'General', language: 'Hindi', accent: 'Indian' },
            { id: 'en-IN-eashwar', name: 'Eashwar', style: 'Conversational', language: 'English', accent: 'Indian' }
        ],
        female: [
            { id: 'en-IN-arohi', name: 'Arohi', style: 'Promo', language: 'English', accent: 'Indian' },
            { id: 'en-IN-priya', name: 'Priya', style: 'Narration', language: 'English', accent: 'Indian' },
            { id: 'hi-IN-ayushi', name: 'Ayushi', style: 'Conversational', language: 'Hindi', accent: 'Indian' }
        ]
    };

    useEffect(() => {
        return () => {
            if (selectedFile) revokeAudioUrl(URL.createObjectURL(selectedFile));
            if (convertedAudioUrl) revokeAudioUrl(convertedAudioUrl);
            if (recordedAudio) revokeAudioUrl(recordedAudio.url);
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [selectedFile, convertedAudioUrl, recordedAudio, audioStream]);

    useEffect(() => {
        const checkApiConnection = async () => {
            try {
                const result = await testApiConnection();
                if (!result.success) {
                    console.warn('API connection test failed:', result.error);
                }
            } catch (error) {
                console.warn('Could not test API connection:', error);
            }
        };

        checkApiConnection();
    }, []);



    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                if (!isAudioFile(file)) {
                    throw new Error('Please select an audio file (MP3, WAV, etc.)');
                }

                if (file.size > 10 * 1024 * 1024) {
                    throw new Error('File size must be less than 10MB');
                }

                setError('');
                setSelectedFile(file);
                setRecordedAudio(null); // Clear recorded audio when uploading file
                setConvertedAudioUrl(null);
                setStatusMessage('Audio file ready for processing');
            } catch (error) {
                setError(error.message);
            }
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioStream(stream);

            const recorder = new MediaRecorder(stream);
            const audioChunks = [];

            recorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = createAudioUrl(audioBlob);
                const audioFile = new File([audioBlob], 'recorded-audio.wav', { type: 'audio/wav' });

                setRecordedAudio({
                    file: audioFile,
                    url: audioUrl,
                    blob: audioBlob,
                    name: 'recorded-audio.wav'
                });
                setSelectedFile(null); // Clear uploaded file when recording
                setStatusMessage('Recording completed! Ready for voice transformation.');
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setError('');

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            setError('Could not access microphone. Please check permissions.');
            console.error('Recording error:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
        setIsRecording(false);
    };

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleConvert = async () => {
        const audioToProcess = recordedAudio?.file || selectedFile;
        
        if (!audioToProcess) {
            setError('Please record audio or select an audio file first');
            return;
        }

        setIsProcessing(true);
        setStatusMessage('🎤 Converting voice with AI technology...');
        setError('');

        try {
            const response = await convertVoice(audioToProcess, selectedVoice);

            setStatusMessage('🎉 Voice conversion completed successfully!');

            const audioResponse = await fetch(response.audio_file);
            const audioBlob = await audioResponse.blob();
            const audioUrl = createAudioUrl(audioBlob);

            setConvertedAudioUrl(audioUrl);
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
            setStatusMessage('');
        } finally {
            setIsProcessing(false);
        }
    };

    


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                       
                        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 drop-shadow-sm">
                            Voice Transformer
                        </h1>
                       
                    </div>
                    <p className="text-2xl text-gray-700 font-medium mb-2">
                        Record or upload audio and transform it with Indian AI voices
                    </p>
                    <p className="text-lg text-gray-600 font-light">
                        Perfect for content creation, privacy protection, and voice anonymization
                    </p>
                </div>

                {/* Main Processing Card */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 rounded-2xl p-6 border border-red-200 flex items-center gap-3 mb-6">
                            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                            <p className="text-gray-800 font-semibold">
                                {error}
                            </p>
                        </div>
                    )}
                </div>

                {/* Guide Popup */}
                <GuidePopup
                    isVisible={showGuidePopup}
                    onClose={closeGuidePopup}
                    onViewFullGuide={showGuide}
                    guideData={voiceChangerGuideSchema}
                />
            </div>
        </div>
    );
};

export default AudioVoiceChanger;