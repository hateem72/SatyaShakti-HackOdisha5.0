import React, { useState, useRef } from 'react';
import { Upload, Download, Shield, Eye, EyeOff,RotateCcw, AlertCircle, CheckCircle2, Loader2, Video, Music, FileVideo, Play, Pause, Mic, Sparkles, User, Users, Info, BookOpen } from 'lucide-react';
import CloudinaryApi from '../../utils/CloudinaryApi';
import { convertVoice, handleApiError } from '../../utils/MurfApi';
import { createAudioUrl, revokeAudioUrl, formatFileSize, isVideoFile } from '../../utils/AudioHelpers';
import GuidePopup from '../components/GuidePopup';
import { useGuide } from '../hooks/useGuide';
import { systemGuideSchema } from '../data/guideSchemas';

const System = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [blurVideo, setBlurVideo] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('hi-IN-rahul');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedVideo, setProcessedVideo] = useState(null);
    const [currentStep, setCurrentStep] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [extractedAudio, setExtractedAudio] = useState(null);
    const [convertedAudio, setConvertedAudio] = useState(null);
    const [finalVideo, setFinalVideo] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const cloudinaryApi = new CloudinaryApi();
    
    const { showGuidePopup, guideRef, showGuide, closeGuidePopup, openGuidePopup } = useGuide(systemGuideSchema);

    const voiceOptions = {
        male: [
            { id: 'hi-IN-rahul', name: 'Rahul', style: 'General', language: 'Hindi' },
           { id: 'en-IN-eashwar', name: 'Eashwar', style: 'Conversational', language: 'English' }
        ],
        female: [
            { id: 'en-IN-arohi', name: 'Arohi', style: 'Promo', language: 'English' },
            { id: 'en-IN-priya', name: 'Priya', style: 'Narration', language: 'English' },
            { id: 'hi-IN-ayushi', name: 'Ayushi', style: 'Conversational', language: 'Hindi' }
        ]
    };

    const anonymityMessages = [
        "🔒 Securing your identity...",
        "🎭 Anonymizing your video...", 
        "🛡️ Protecting your privacy...",
        "🔐 Encrypting your presence...",
        "👤 Masking your identity...",
        "🌟 Creating anonymous magic...",
        "🎪 Transforming your appearance...",
        "🔮 Weaving privacy spells...",
        "🎨 Crafting your digital disguise...",
        "⚡ Powering up anonymity shields..."
    ];

    const getRandomAnonymityMessage = () => {
        return anonymityMessages[Math.floor(Math.random() * anonymityMessages.length)];
    };

    const handleVideoSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (isVideoFile(file)) {
                setSelectedVideo(file);
                setError('');
                resetProcessing();
            } else {
                setError('Please select a valid video file.');
                setSelectedVideo(null);
            }
        }
    };

    const resetProcessing = () => {
        setProcessedVideo(null);
        setExtractedAudio(null);
        setConvertedAudio(null);
        setFinalVideo(null);
        setProgress(0);
        setCurrentStep('');
        setIsProcessing(false);
    };

    const processVideo = async () => {
        if (!selectedVideo) return;

        setIsProcessing(true);
        setProgress(0);
        setError('');

        try {
            setCurrentStep(getRandomAnonymityMessage());
            setProgress(10);
            
            const audioExtractionResult = await cloudinaryApi.processVideoToMp3(
                selectedVideo,
                (uploadProg) => {
                    setProgress(10 + (uploadProg * 0.15)); // 10-25%
                },
                (message, conversionProg) => {
                    setCurrentStep(getRandomAnonymityMessage());
                    setProgress(25 + (conversionProg * 0.15)); // 25-40%
                }
            );

            setExtractedAudio(audioExtractionResult);
            
            setCurrentStep(getRandomAnonymityMessage());
            setProgress(40);

            const audioFile = new File([audioExtractionResult.blob], audioExtractionResult.name, {
                type: 'audio/mp3'
            });

            const voiceConversionResult = await convertVoice(audioFile, selectedVoice);
            
            const audioResponse = await fetch(voiceConversionResult.audio_file);
            const convertedAudioBlob = await audioResponse.blob();
            const convertedAudioUrl = createAudioUrl(convertedAudioBlob);

            setConvertedAudio({
                url: convertedAudioUrl,
                blob: convertedAudioBlob,
                name: 'converted_voice.mp3'
            });

            setCurrentStep(getRandomAnonymityMessage());
            setProgress(60);

            const convertedAudioFile = new File([convertedAudioBlob], 'converted_voice.mp3', {
                type: 'audio/mp3'
            });

            const audioReplacementResult = await cloudinaryApi.processVideoAudioReplacement(
                selectedVideo,
                convertedAudioFile,
                (videoProg) => {
                    setProgress(60 + (videoProg * 0.1)); // 60-70%
                },
                (audioProg) => {
                    setProgress(70 + (audioProg * 0.1)); // 70-80%
                },
                (message, processingProg) => {
                    setCurrentStep(getRandomAnonymityMessage());
                    setProgress(80 + (processingProg * 0.1)); // 80-90%
                }
            );

            let finalResult = audioReplacementResult;

            if (blurVideo) {
                setCurrentStep(getRandomAnonymityMessage());
                setProgress(90);

                const videoWithNewAudio = new File([audioReplacementResult.blob], audioReplacementResult.name, {
                    type: 'video/mp4'
                });

                const blurResult = await cloudinaryApi.processFaceBlurVideo(
                    videoWithNewAudio,
                    (uploadProg) => {
                        setProgress(90 + (uploadProg * 0.05)); // 90-95%
                    },
                    (message, processingProg) => {
                        setCurrentStep(getRandomAnonymityMessage());
                        setProgress(95 + (processingProg * 0.05)); // 95-100%
                    },
                    2000
                );

                finalResult = blurResult;
            }

            setFinalVideo(finalResult);
            setCurrentStep("🎉 Your video has been successfully anonymized! 🎉");
            setProgress(100);

        } catch (err) {
            console.error('Processing error:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            setCurrentStep('');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadVideo = () => {
        if (finalVideo) {
            const link = document.createElement('a');
            link.href = finalVideo.url;
            link.download = finalVideo.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const resetSystem = () => {
        setSelectedVideo(null);
        setBlurVideo(false);
        setSelectedVoice('hi-IN-rahul');
        resetProcessing();
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (extractedAudio?.url) revokeAudioUrl(extractedAudio.url);
        if (convertedAudio?.url) revokeAudioUrl(convertedAudio.url);
        if (finalVideo?.url) revokeAudioUrl(finalVideo.url);
    };

    const getSelectedVoiceInfo = () => {
        const allVoices = [...voiceOptions.male, ...voiceOptions.female];
        return allVoices.find(voice => voice.id === selectedVoice) || voiceOptions.male[0];
    };

    const toggleVideoPlayback = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      
                        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 drop-shadow-sm">
                            Video Anonymizer
                        </h1>
                      
                    </div>
                    <p className="text-2xl text-gray-700 font-medium mb-2">
                        Protect your identity with AI-powered voice changing and face blurring
                    </p>
                    <p className="text-lg text-gray-600 font-light">
                        Complete privacy protection for interviews, presentations, and sensitive content
                    </p>
                </div>

                {/* Main Processing Card */}
                <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 mb-8 transform transition-all duration-300 hover:shadow-3xl">
                    
                    {/* File Upload Section */}
                    {!selectedVideo && (
                        <div className="text-center mb-8">
                            <div
                                className="border-2 border-dashed border-blue-300 rounded-3xl p-16 hover:border-blue-400 transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="transform transition-transform duration-300 group-hover:scale-110">
                                    <Upload className="w-20 h-20 text-blue-500 mx-auto mb-6 drop-shadow-sm" />
                                    <h3 className="text-3xl font-bold text-gray-800 mb-3">
                                        Upload Your Video
                                    </h3>
                                    <p className="text-gray-600 mb-4 text-lg">
                                        Select a video file to begin the anonymization process
                                    </p>
                                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-200">
                                        <Info className="w-4 h-4 text-blue-600" />
                                        <span className="text-blue-700 font-medium">
                                            Supported formats: MP4, AVI, MOV, MKV, WebM
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoSelect}
                                className="hidden"
                            />
                            
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

                    {/* Selected Video Info */}
                    {selectedVideo && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 mb-8 border border-blue-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-3 rounded-xl">
                                        <FileVideo className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-800 font-bold text-2xl">
                                            {selectedVideo.name}
                                        </h3>
                                        <p className="text-gray-600 text-lg">{formatFileSize(selectedVideo.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={resetSystem}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 w-12 h-12 rounded-full transition-colors duration-300 flex items-center justify-center text-xl font-bold shadow-sm hover:shadow-md"
                                    title="Reset system"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Blur Video Checkbox */}
                            <div className="mb-8">
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={blurVideo}
                                            onChange={(e) => setBlurVideo(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 ${
                                            blurVideo 
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600' 
                                                : 'bg-white border-gray-300 hover:border-blue-400'
                                        }`}>
                                            {blurVideo && (
                                                <svg className="w-5 h-5 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-gray-800 font-bold text-lg flex items-center gap-3">
                                        <div className={`p-2 rounded-xl transition-colors ${
                                            blurVideo ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'
                                        }`}>
                                            <EyeOff className="w-6 h-6 text-blue-600" />
                                        </div>
                                        Blur faces in video for additional anonymity
                                    </span>
                                </label>
                            </div>

                            {/* Voice Selection */}
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700 mb-8 flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-2xl">
                                        <Users className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    Choose Voice for Anonymization
                                </h3>
                                
                                {/* Male Voices */}
                                <div className="mb-8">
                                    <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-lg">
                                            <User className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        Male Voices
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {voiceOptions.male.map((voice) => (
                                            <div
                                                key={voice.id}
                                                onClick={() => setSelectedVoice(voice.id)}
                                                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                                    selectedVoice === voice.id
                                                        ? 'border-emerald-500 bg-emerald-50 shadow-xl transform scale-105' 
                                                        : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-5 h-5 rounded-full border-2 ${
                                                        selectedVoice === voice.id ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
                                                    }`}></div>
                                                    <h5 className="font-bold text-gray-800 text-xl">{voice.name}</h5>
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
                                    <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <div className="bg-teal-100 p-2 rounded-lg">
                                            <User className="w-6 h-6 text-teal-600" />
                                        </div>
                                        Female Voices
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                        {voiceOptions.female.map((voice) => (
                                            <div
                                                key={voice.id}
                                                onClick={() => setSelectedVoice(voice.id)}
                                                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                                    selectedVoice === voice.id
                                                        ? 'border-teal-500 bg-teal-50 shadow-xl transform scale-105' 
                                                        : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-md'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-5 h-5 rounded-full border-2 ${
                                                        selectedVoice === voice.id ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-300'
                                                    }`}></div>
                                                    <h5 className="font-bold text-gray-800 text-xl">{voice.name}</h5>
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

                                {/* Process Button */}
                                {!isProcessing && !finalVideo && (
                                    <button
                                        onClick={processVideo}
                                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold py-5 px-8 rounded-2xl hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-4 text-2xl shadow-lg hover:shadow-xl"
                                    >
                                        <Shield className="w-8 h-8" />
                                        Begin Anonymization Process
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Processing Progress */}
                    {isProcessing && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 mb-8 border border-blue-200">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="animate-spin">
                                    <Loader2 className="w-12 h-12 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-800 font-bold text-2xl">
                                            {currentStep}
                                        </span>
                                        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                            {progress.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-5 mb-2">
                                <div
                                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-5 rounded-full transition-all duration-300 shadow-inner"
                                    style={{ width: `${progress.toFixed(1)}%` }}
                                ></div>
                            </div>
                            <p className="text-center text-gray-600 mt-4 text-xl">
                                Processing your video with advanced AI technology...
                            </p>
                            <p className="text-center text-gray-500 text-lg mt-2">
                                This may take a few minutes depending on video length
                            </p>
                        </div>
                    )}

                    {/* Processing Steps Visualization */}
                    {(isProcessing || finalVideo) && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className={`bg-white rounded-2xl p-6 border-2 text-center transition-all duration-300 ${
                                progress >= 25 
                                    ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transform scale-105' 
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}>
                                <div className="bg-green-100 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Music className="w-10 h-10 text-green-600" />
                                </div>
                                <h4 className="text-gray-800 font-bold text-xl mb-2">Extract Audio</h4>
                                <p className="text-gray-600">Separating audio track</p>
                                {progress >= 25 && (
                                    <div className="mt-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                                    </div>
                                )}
                            </div>
                            
                            <div className={`bg-white rounded-2xl p-6 border-2 text-center transition-all duration-300 ${
                                progress >= 60 
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg transform scale-105' 
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}>
                                <div className="bg-blue-100 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Mic className="w-10 h-10 text-blue-600" />
                                </div>
                                <h4 className="text-gray-800 font-bold text-xl mb-2">Voice Change</h4>
                                <p className="text-gray-600">AI voice transformation</p>
                                {progress >= 60 && (
                                    <div className="mt-3">
                                        <CheckCircle2 className="w-6 h-6 text-blue-600 mx-auto" />
                                    </div>
                                )}
                            </div>
                            
                            <div className={`bg-white rounded-2xl p-6 border-2 text-center transition-all duration-300 ${
                                progress >= 90 
                                    ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transform scale-105' 
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}>
                                <div className="bg-purple-100 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Video className="w-10 h-10 text-purple-600" />
                                </div>
                                <h4 className="text-gray-800 font-bold text-xl mb-2">Audio Replace</h4>
                                <p className="text-gray-600">Merging new audio</p>
                                {progress >= 90 && (
                                    <div className="mt-3">
                                        <CheckCircle2 className="w-6 h-6 text-purple-600 mx-auto" />
                                    </div>
                                )}
                            </div>
                            
                            <div className={`bg-white rounded-2xl p-6 border-2 text-center transition-all duration-300 ${
                                (progress >= 100 && blurVideo) || (!blurVideo && progress >= 90)
                                    ? 'border-red-400 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg transform scale-105' 
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}>
                                <div className="bg-red-100 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <EyeOff className="w-10 h-10 text-red-600" />
                                </div>
                                <h4 className="text-gray-800 font-bold text-xl mb-2">Face Blur</h4>
                                <p className="text-gray-600">{blurVideo ? 'Blurring faces' : 'Skipped'}</p>
                                {((progress >= 100 && blurVideo) || (!blurVideo && progress >= 90)) && (
                                    <div className="mt-3">
                                        <CheckCircle2 className="w-6 h-6 text-red-600 mx-auto" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Final Result */}
                    {finalVideo && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-200">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-green-100 p-3 rounded-2xl">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-gray-800 font-bold text-3xl">
                                        Anonymization Complete!
                                    </h3>
                                    <p className="text-green-700 font-bold text-xl">{finalVideo.name}</p>
                                    <p className="text-gray-600 text-lg">Your video is now fully anonymous</p>
                                </div>
                            </div>

                            {/* Video Preview */}
                            <div className="mb-8 relative bg-black rounded-2xl overflow-hidden group">
                                <video
                                    ref={videoRef}
                                    src={finalVideo.url}
                                    controls
                                    className="w-full max-h-96 object-contain"
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    preload="metadata"
                                    controlsList="nodownload"
                                />
                                
                                {/* Fallback play button for browsers that don't show controls */}
                                {!isPlaying && (
                                    <button
                                        onClick={toggleVideoPlayback}
                                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-5 rounded-full hover:bg-black transition-colors duration-300 shadow-lg opacity-0 group-hover:opacity-100"
                                    >
                                        <Play className="w-10 h-10" />
                                    </button>
                                )}
                                
                                {/* Video info overlay */}
                                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Anonymized Video Preview
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6">
                                <button
                                    onClick={downloadVideo}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl"
                                >
                                    <Download className="w-7 h-7" />
                                    Download Anonymous Video
                                </button>

                                <button
                                    onClick={resetSystem}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl"
                                >
                                    <RotateCcw className="w-7 h-7" />
                                    Process Another Video
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 rounded-3xl p-6 border border-red-200 flex items-center gap-4 mb-8 shadow-md">
                            <div className="bg-red-100 p-3 rounded-xl">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-800 font-bold text-lg">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-10 border border-blue-200">
                        <h3 className="text-gray-800 font-bold text-4xl mb-8 flex items-center gap-4">
                            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-2xl">
                                <Sparkles className="w-10 h-10 text-emerald-600" />
                            </div>
                            How the System Works
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
                            <div className="bg-white rounded-2xl p-8 shadow-md border border-blue-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <Music className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h4 className="font-bold text-2xl text-blue-700">Audio Anonymization</h4>
                                </div>
                                <ul className="space-y-4 text-lg">
                                    <li className="flex items-start gap-3">
                                        <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">1</span>
                                        Extracts audio from your video
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">2</span>
                                        Uses AI to change voice characteristics
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">3</span>
                                        Replaces original audio seamlessly
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="bg-white rounded-2xl p-8 shadow-md border border-red-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-red-100 p-2 rounded-lg">
                                        <EyeOff className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h4 className="font-bold text-2xl text-red-700">Visual Anonymization</h4>
                                </div>
                                <ul className="space-y-4 text-lg">
                                    <li className="flex items-start gap-3">
                                        <span className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">1</span>
                                        Optional face blurring with AI detection
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">2</span>
                                        Maintains video quality and smoothness
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">3</span>
                                        Complete identity protection
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guide Section */}
                <div ref={guideRef} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-10 shadow-2xl border border-emerald-200">
                    <h3 className="text-gray-800 font-bold text-3xl mb-8 flex items-center gap-4">
                        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-2xl">
                            <Sparkles className="w-8 h-8 text-emerald-600" />
                        </div>
                        Video Anonymization Guide
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-emerald-700 flex items-center gap-2">
                                <Upload className="w-6 h-6" />
                                Upload & Setup
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Upload video files (MP4, AVI, MOV, MKV, WebM)</li>
                                <li>• Choose AI voice for anonymization</li>
                                <li>• Enable face blurring for extra privacy</li>
                                <li>• Process with advanced AI technology</li>
                            </ul>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-teal-700 flex items-center gap-2">
                                <Shield className="w-6 h-6" />
                                Privacy Protection
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Complete voice anonymization</li>
                                <li>• Optional face blurring technology</li>
                                <li>• Secure processing pipeline</li>
                                <li>• No data retention policy</li>
                            </ul>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-cyan-700 flex items-center gap-2">
                                <Video className="w-6 h-6" />
                                Use Cases
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Anonymous interviews and testimonials</li>
                                <li>• Whistleblowing and reporting</li>
                                <li>• Educational content protection</li>
                                <li>• Confidential business communications</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <p className="text-gray-600 mb-3">
                            <strong>Technical Requirements:</strong>Processing time varies based on video length and complexity.
                        </p>
                        <p className="text-gray-500 text-sm">
                            Always ensure you have proper consent before processing videos containing other people.
                        </p>
                    </div>
                </div>

                {/* Guide Popup */}
                <GuidePopup
                    isVisible={showGuidePopup}
                    onClose={closeGuidePopup}
                    onViewFullGuide={showGuide}
                    guideData={systemGuideSchema}
                />
            </div>
            
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 18px;
                    width: 18px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    border: 2px solid white;
                }
                
                .slider::-moz-range-thumb {
                    height: 18px;
                    width: 18px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    border: 2px solid white;
                }
            `}</style>
        </div>
    );
};

export default System;