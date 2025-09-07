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

    const handleDownload = async () => {
        if (!convertedAudioUrl) return;

        try {
            setStatusMessage('Downloading...');

            const a = document.createElement('a');
            a.href = convertedAudioUrl;
            a.download = 'converted-voice.mp3';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setStatusMessage('Download completed!');
        } catch (error) {
            setError('Failed to download audio');
            console.error('Download error:', error);
        }
    };

    const handleReset = () => {
        if (convertedAudioUrl) {
            revokeAudioUrl(convertedAudioUrl);
        }
        if (recordedAudio?.url) {
            revokeAudioUrl(recordedAudio.url);
        }
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }

        setSelectedFile(null);
        setRecordedAudio(null);
        setConvertedAudioUrl(null);
        setStatusMessage('');
        setError('');
        setSelectedVoice('hi-IN-rahul');
        setIsRecording(false);
        setRecordingTime(0);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const toggleAudioPlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const getSelectedVoiceInfo = () => {
        const allVoices = [...voiceOptions.male, ...voiceOptions.female];
        return allVoices.find(voice => voice.id === selectedVoice) || voiceOptions.male[0];
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

                    {/* Audio Input Section */}
                    {!selectedFile && !recordedAudio && (
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-3">
                                <Music className="w-8 h-8 text-emerald-600" />
                                Choose Your Audio Source
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Recording Section */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border-2 border-emerald-200">
                                    <div className="text-center">
                                        <div className="bg-emerald-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                            <Mic className="w-12 h-12 text-emerald-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                            Record Audio
                                        </h3>
                                        <p className="text-gray-600 mb-6 text-lg">
                                            Record your voice directly using your microphone
                                        </p>
                                        
                                        {!isRecording ? (
                                            <div className="space-y-4">
                                                <button
                                                    onClick={startRecording}
                                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg"
                                                >
                                                    <Mic className="w-6 h-6" />
                                                    Start Recording
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-red-100 rounded-xl p-4 border border-red-200">
                                                    <div className="flex items-center justify-center gap-3 mb-2">
                                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                                        <span className="text-red-700 font-bold text-lg">Recording...</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-red-600">
                                                        {formatRecordingTime(recordingTime)}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={stopRecording}
                                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg"
                                                >
                                                    <Square className="w-6 h-6" />
                                                    Stop Recording
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Section */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200">
                                    <div className="text-center">
                                        <div
                                            className="cursor-pointer group"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="bg-blue-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                <Upload className="w-12 h-12 text-blue-600" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                                Upload Audio File
                                            </h3>
                                            <p className="text-gray-600 mb-6 text-lg">
                                                Select an existing audio file from your device
                                            </p>
                                            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-200 inline-flex items-center gap-2">
                                                <Info className="w-4 h-4 text-blue-600" />
                                                <span className="text-blue-700 font-medium">
                                                    MP3, WAV, FLAC (max 10MB)
                                                </span>
                                            </div>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Guide Button */}
                            <div className="text-center mt-6">
                                <button
                                    onClick={openGuidePopup}
                                    className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white font-bold py-3 px-8 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg mx-auto"
                                >
                                    <BookOpen className="w-6 h-6" />
                                    View Guide & Use Cases
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Selected Audio Info */}
                    {(selectedFile || recordedAudio) && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 mb-8 border border-emerald-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-100 p-3 rounded-xl">
                                        <Music className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-800 font-bold text-2xl">
                                            {recordedAudio ? recordedAudio.name : selectedFile?.name}
                                        </h3>
                                        <p className="text-gray-600 text-lg">
                                            {recordedAudio ? 
                                                `Recorded Audio • ${formatRecordingTime(recordingTime)}` : 
                                                formatFileSize(selectedFile?.size)
                                            }
                                        </p>
                                        <div className="mt-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                recordedAudio ? 
                                                'bg-emerald-100 text-emerald-800' : 
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {recordedAudio ? 'Recorded' : 'Uploaded'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 w-12 h-12 rounded-full transition-colors duration-300 flex items-center justify-center text-xl font-bold shadow-sm hover:shadow-md"
                                    title="Reset and start over"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Audio Preview */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Play className="w-5 h-5 text-emerald-600" />
                                    Audio Preview
                                </h4>
                                <audio
                                    src={recordedAudio?.url || (selectedFile ? URL.createObjectURL(selectedFile) : '')}
                                    controls
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Voice Selection */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700 mb-8 flex items-center gap-4">
                            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-2xl">
                                <Users className="w-8 h-8 text-emerald-600" />
                            </div>
                            Choose Your AI Voice
                        </h2>

                        {/* Male Voices */}
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-lg">
                                    <User className="w-6 h-6 text-emerald-600" />
                                </div>
                                Male Voices
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {voiceOptions.male.map((voice) => (
                                    <div
                                        key={voice.id}
                                        onClick={() => setSelectedVoice(voice.id)}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedVoice === voice.id
                                                ? 'border-emerald-500 bg-emerald-50 shadow-xl transform scale-105'
                                                : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-5 h-5 rounded-full border-2 ${selectedVoice === voice.id ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
                                                }`}></div>
                                            <h4 className="font-bold text-gray-800 text-xl">{voice.name}</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-gray-600 mb-1">
                                                <span className="font-medium text-emerald-600">Style:</span> {voice.style}
                                            </p>
                                            <p className="text-gray-600">
                                                <span className="font-medium text-emerald-600">Language:</span> {voice.language}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Female Voices */}
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <div className="bg-teal-100 p-2 rounded-lg">
                                    <User className="w-6 h-6 text-teal-600" />
                                </div>
                                Female Voices
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {voiceOptions.female.map((voice) => (
                                    <div
                                        key={voice.id}
                                        onClick={() => setSelectedVoice(voice.id)}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedVoice === voice.id
                                                ? 'border-teal-500 bg-teal-50 shadow-xl transform scale-105'
                                                : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-5 h-5 rounded-full border-2 ${selectedVoice === voice.id ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-300'
                                                }`}></div>
                                            <h4 className="font-bold text-gray-800 text-xl">{voice.name}</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-gray-600 mb-1">
                                                <span className="font-medium text-teal-600">Style:</span> {voice.style}
                                            </p>
                                            <p className="text-gray-600">
                                                <span className="font-medium text-teal-600">Language:</span> {voice.language}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selected Voice Info */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-green-100 p-3 rounded-xl">
                                    <Mic className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                                        Selected Voice: {getSelectedVoiceInfo().name}
                                    </h4>
                                    <div className="flex items-center gap-6 text-lg">
                                        <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-medium">
                                            {getSelectedVoiceInfo().style}
                                        </span>
                                        <span className="bg-teal-100 text-teal-800 px-4 py-2 rounded-full font-medium">
                                            {getSelectedVoiceInfo().language}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transform Button */}
                        {(selectedFile || recordedAudio) && !convertedAudioUrl && !isProcessing && (
                            <button
                                onClick={handleConvert}
                                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold py-5 px-8 rounded-2xl hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-4 text-2xl shadow-lg hover:shadow-xl"
                            >
                                <Sparkles className="w-8 h-8" />
                                Transform Voice with AI
                            </button>
                        )}
                    </div>

                    {/* Processing Status */}
                    {isProcessing && (
                        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
                            <div className="flex items-center gap-3 mb-4">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <div className="flex-1">
                                    <span className="text-gray-800 font-bold text-lg">
                                        {statusMessage}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {statusMessage && !isProcessing && convertedAudioUrl && (
                        <div className="bg-green-50 rounded-2xl p-6 mb-6 border border-green-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                                <span className="text-gray-800 font-bold text-lg">
                                    {statusMessage}
                                </span>
                            </div>
                        </div>
                    )}


                </div>

                {/* Preview Section */}
                {(selectedFile || recordedAudio || convertedAudioUrl) && (
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 mb-8 transform transition-all duration-300 hover:shadow-3xl">
                        <div className="p-10">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-4">
                                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-2xl">
                                    <Music className="w-8 h-8 text-emerald-600" />
                                </div>
                                Audio Comparison
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Original Audio */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-200">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-xl">
                                            <Mic className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        Original Audio
                                    </h3>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                                        {(selectedFile || recordedAudio) ? (
                                            <audio
                                                src={recordedAudio?.url || (selectedFile ? URL.createObjectURL(selectedFile) : '')}
                                                controls
                                                className="w-full"
                                            />
                                        ) : (
                                            <div className="text-gray-500 text-center py-12 text-lg">No audio available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Converted Audio */}
                                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-8 border border-teal-200">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <div className="bg-teal-100 p-2 rounded-xl">
                                            <Volume2 className="w-6 h-6 text-teal-600" />
                                        </div>
                                        Transformed Voice
                                    </h3>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                                        {convertedAudioUrl ? (
                                            <audio
                                                ref={audioRef}
                                                src={convertedAudioUrl}
                                                controls
                                                className="w-full"
                                                onPlay={() => setIsPlaying(true)}
                                                onPause={() => setIsPlaying(false)}
                                            />
                                        ) : (
                                            <div className="text-gray-500 text-center py-12 text-lg">
                                                {isProcessing ? 'Processing...' : 'Transformed audio will appear here'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Download Button */}
                            {convertedAudioUrl && !isProcessing && (
                                <div className="mt-10 flex gap-6 flex-col sm:flex-row">
                                    <button
                                        onClick={handleDownload}
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-5 px-8 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl"
                                    >
                                        <Download className="w-7 h-7" />
                                        Download Transformed Audio
                                    </button>

                                    <button
                                        onClick={handleReset}
                                        className="px-8 py-5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 font-bold shadow-lg text-xl flex items-center justify-center gap-3"
                                    >
                                        <RotateCcw className="w-6 h-6" />
                                        Transform Another
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Instructions and Use Cases */}
                <div ref={guideRef} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-10 shadow-2xl border border-emerald-200">
                    <h3 className="text-gray-800 font-bold text-3xl mb-8 flex items-center gap-4">
                        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-2xl">
                            <Sparkles className="w-8 h-8 text-emerald-600" />
                        </div>
                        Voice Transformation Guide
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-emerald-700 flex items-center gap-2">
                                <Mic className="w-6 h-6" />
                                Recording & Upload
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Record directly using your microphone</li>
                                <li>• Upload existing audio files (MP3, WAV, FLAC)</li>
                                <li>• Maximum file size: 10MB</li>
                                <li>• Clear audio quality recommended</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-teal-700 flex items-center gap-2">
                                <Users className="w-6 h-6" />
                                Voice Selection
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• 8 different Indian AI voices</li>
                                <li>• Male and female options</li>
                                <li>• Hindi, English, Tamil & Bengali</li>
                                <li>• Various speaking styles available</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-cyan-700 flex items-center gap-2">
                                <Volume2 className="w-6 h-6" />
                                AI Processing
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Advanced voice synthesis technology</li>
                                <li>• Maintains speech patterns and timing</li>
                                <li>• High-quality audio output</li>
                                <li>• Instant preview and download</li>
                            </ul>
                        </div>
                    </div>

                    {/* Use Cases Section */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
                        <h4 className="font-bold text-2xl mb-6 text-gray-800 flex items-center gap-3">
                            <Info className="w-7 h-7 text-emerald-600" />
                            When & Why to Use Voice Transformation
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h5 className="font-semibold text-lg mb-3 text-emerald-700">Privacy & Anonymity</h5>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Protect your identity in interviews or testimonials</li>
                                    <li>• Anonymous whistleblowing or reporting</li>
                                    <li>• Confidential business communications</li>
                                    <li>• Personal safety in sensitive recordings</li>
                                </ul>
                            </div>

                            <div>
                                <h5 className="font-semibold text-lg mb-3 text-teal-700">Content Creation</h5>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Voiceovers for videos and presentations</li>
                                    <li>• Podcast narration with different voices</li>
                                    <li>• Educational content in multiple languages</li>
                                    <li>• Character voices for storytelling</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                            <p className="text-amber-800 font-medium flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                <strong>Ethical Use:</strong> Always ensure you have permission to transform someone's voice and use voice transformation responsibly and legally.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <p className="text-gray-600 mb-3">
                            <strong>Technical Requirements:</strong> Processing time varies.
                        </p>
                        <p className="text-gray-500 text-sm">
                            If an Indian voice is not available, the system will automatically use a fallback English voice for conversion.
                        </p>
                    </div>
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