import React, { useState, useRef } from 'react';
import { Upload, Download, Shield, EyeOff, AlertCircle, CheckCircle2, Loader2, Video, Play, Pause, Mic, User, Users, Scissors, Clock, Edit3, Trash2, RotateCcw, SkipBack, SkipForward, Info, BookOpen, Sparkles } from 'lucide-react';
import AnonymousEditorApi from '../../utils/AnonymousEditorApi';
import { handleApiError } from '../../utils/MurfApi';
import { formatFileSize, isVideoFile } from '../../utils/AudioHelpers';
import { voiceOptions, DEFAULT_VOICE } from '../../utils/VoiceOptions';
import {
    formatTime,
    createQuickSegment,
    updateSegmentTime,
    updateSegmentBlurStrength,
    removeSegment,
    calculateTimelinePosition,
    createSegmentFromDrag,
    shouldShowLengthWarning
} from '../../utils/VideoSegmentHelpers';
import GuidePopup from '../components/GuidePopup';
import { useGuide } from '../hooks/useGuide';
import { anonymousEditorGuideSchema } from '../data/guideSchemas';

const AnonymousEditor = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedVideo, setProcessedVideo] = useState(null);
    const [currentStep, setCurrentStep] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [showLengthWarning, setShowLengthWarning] = useState(false);
    const [blurWholeVideo, setBlurWholeVideo] = useState(false);
    // Enhanced timeline segments
    const [blurSegments, setBlurSegments] = useState([]);
    const [voiceSegments, setVoiceSegments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragType, setDragType] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const timelineRef = useRef(null);
    const anonymousEditorApi = new AnonymousEditorApi();

    // Use the guide hook
    const { showGuidePopup, guideRef, showGuide, closeGuidePopup, openGuidePopup } = useGuide(anonymousEditorGuideSchema);

    const handleVideoSelect = (event) => {
        const file = event.target.files[0];
        if (file && isVideoFile(file)) {
            setSelectedVideo(file);
            const videoUrl = URL.createObjectURL(file);
            setVideoUrl(videoUrl);
            setError('');
            resetEditor();
        } else {
            setError('Please select a valid video file.');
            setSelectedVideo(null);
        }
    };

    const resetEditor = () => {
        setBlurSegments([]);
        setVoiceSegments([]);
        setProcessedVideo(null);
        setProgress(0);
        setCurrentStep('');
        setIsProcessing(false);
        setIsDragging(false);
        setDragStart(null);
        setDragType(null);
    };

    const handleVideoLoad = () => {
        if (videoRef.current) {
            const duration = videoRef.current.duration;
            setVideoDuration(duration);
            // Show warning if video is longer than 1 minute
            if (shouldShowLengthWarning(duration)) {
                setShowLengthWarning(true);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const togglePlayback = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const seekTo = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    // Enhanced segment management using utils
    const addQuickSegment = (type) => {
        try {
            const segment = createQuickSegment(currentTime, videoDuration, 5, type);
            if (type === 'blur') {
                setBlurSegments([...blurSegments, segment]);
            } else if (type === 'voice') {
                setVoiceSegments([...voiceSegments, segment]);
            }
            setError('');
        } catch (error) {
            setError(error.message);
        }
    };

    const handleRemoveSegment = (type, id) => {
        if (type === 'blur') {
            setBlurSegments(removeSegment(blurSegments, id));
        } else if (type === 'voice') {
            setVoiceSegments(removeSegment(voiceSegments, id));
        }
    };

    const handleUpdateSegmentTime = (type, id, field, value) => {
        if (type === 'blur') {
            setBlurSegments(updateSegmentTime(blurSegments, id, field, value, videoDuration));
        } else if (type === 'voice') {
            setVoiceSegments(updateSegmentTime(voiceSegments, id, field, value, videoDuration));
        }
    };

    const handleUpdateSegmentBlurStrength = (type, id, blurStrength) => {
        if (type === 'blur') {
            setBlurSegments(updateSegmentBlurStrength(blurSegments, id, blurStrength));
        }
    };

    // Enhanced timeline drag functionality with better error handling
    const handleTimelineMouseDown = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        if (!videoDuration || videoDuration === 0) {
            setError('Please wait for video to load completely before creating segments.');
            return;
        }
        const timeline = e.currentTarget;
        const timePosition = calculateTimelinePosition(e, timeline, videoDuration);
        console.log('Drag started:', { type, timePosition, videoDuration });
        setIsDragging(true);
        setDragStart(timePosition);
        setDragType(type);
        seekTo(timePosition);

        // Add global mouse event listeners for better drag handling
        const handleGlobalMouseMove = (moveEvent) => {
            if (!timeline) return;
            const moveTimePosition = calculateTimelinePosition(moveEvent, timeline, videoDuration);
            setCurrentTime(moveTimePosition);
            if (videoRef.current) {
                videoRef.current.currentTime = moveTimePosition;
            }
        };

        const handleGlobalMouseUp = (upEvent) => {
            const endTime = calculateTimelinePosition(upEvent, timeline, videoDuration);
            console.log('Drag ended:', { start: timePosition, end: endTime, duration: Math.abs(endTime - timePosition) });
            const segment = createSegmentFromDrag(timePosition, endTime, type);
            if (segment) {
                console.log('Creating segment:', segment);
                if (type === 'blur') {
                    setBlurSegments(prev => {
                        const newSegments = [...prev, segment];
                        console.log('New blur segments:', newSegments);
                        return newSegments;
                    });
                } else if (type === 'voice') {
                    setVoiceSegments(prev => {
                        const newSegments = [...prev, segment];
                        console.log('New voice segments:', newSegments);
                        return newSegments;
                    });
                }
                setError(''); // Clear any previous errors
            } else {
                setError('Segment too short. Minimum duration is 0.5 seconds.');
            }
            setIsDragging(false);
            setDragStart(null);
            setDragType(null);
            // Remove global listeners
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };

        // Add global listeners
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleTimelineMouseMove = (e) => {
        // This is now handled by global listeners in mousedown
        return;
    };

    const handleTimelineMouseUp = (e) => {
        // This is now handled by global listeners in mousedown
        return;
    };

    // Main video processing function using AnonymousEditorApi
    const processVideo = async () => {
        if (!selectedVideo || (!blurWholeVideo && voiceSegments.length === 0)) {
            setError('Please select blur whole video or add voice segments to process.');
            return;
        }
        setIsProcessing(true);
        setProgress(0);
        setError('');
        try {
            // Use the new API for processing
            const result = await anonymousEditorApi.processAnonymousVideo(
                selectedVideo,
                voiceSegments,
                blurWholeVideo,
                selectedVoice,
                setProgress,
                setCurrentStep
            );
            // Prepare final video using the API
            const finalVideo = await anonymousEditorApi.prepareFinalVideo(
                result,
                selectedVideo,
                setCurrentStep
            );
            setProcessedVideo(finalVideo);
            // Show success message with details
            if (finalVideo.warning) {
                setError(`Processing completed with warnings: ${finalVideo.warning}`);
            }
            setCurrentStep('✨ Processing complete!');
            setProgress(100.0);
        } catch (err) {
            console.error('Processing error:', err);
            try {
                // Try to get fallback video using the API
                const fallbackVideo = await anonymousEditorApi.handleProcessingError(
                    { public_id: 'fallback' }, // This will need to be handled properly
                    selectedVideo
                );
                setProcessedVideo(fallbackVideo);
                setError(fallbackVideo.warning || 'Processing failed, but your video is preserved.');
            } catch (fallbackError) {
                const errorMessage = handleApiError(err);
                setError(errorMessage);
            }
            setCurrentStep('');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadVideo = () => {
        if (processedVideo) {
            const link = document.createElement('a');
            link.href = processedVideo.url;
            link.download = processedVideo.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const resetSystem = () => {
        setSelectedVideo(null);
        setVideoUrl(null);
        resetEditor();
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">

                        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 drop-shadow-sm">
                            Anonymous Editor Pro
                        </h1>

                    </div>
                    <p className="text-xl text-gray-700 font-medium mb-2">
                        Advanced timeline-based video editing with drag-to-select segments
                    </p>
                    <p className="text-sm text-gray-500 font-light">
                        Protect privacy while maintaining video quality
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-center gap-3 shadow-md">
                        <div className="bg-red-100 p-2 rounded-full">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-red-800 font-medium flex-1">{error}</span>
                    </div>
                )}

                {/* Video Length Warning Popup */}
                {showLengthWarning && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl p-10 max-w-md mx-4 shadow-2xl transform transition-all duration-300 scale-100 hover:scale-105">
                            <div className="text-center">
                                <div className="bg-yellow-100 rounded-full p-5 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                    <AlertCircle className="w-12 h-12 text-yellow-600" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-800 mb-4">Video Length Warning</h3>
                                <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                                    Your video is longer than 1 minute ({formatTime(videoDuration)}).
                                    Processing longer videos may take more time and resources.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowLengthWarning(false)}
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                                    >
                                        Continue Processing
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowLengthWarning(false);
                                            resetSystem();
                                        }}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-2xl transition-colors"
                                    >
                                        Choose Different Video
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* File Upload Section */}
                {!selectedVideo && (
                    <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 mb-8 transform transition-all duration-300 hover:shadow-3xl">
                        <div className="text-center">
                            <div
                                className="border-2 border-dashed border-purple-300 rounded-3xl p-16 hover:border-purple-400 transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="transform transition-transform duration-300 group-hover:scale-110">
                                    <Upload className="w-20 h-20 text-purple-500 mx-auto mb-6 drop-shadow-sm" />
                                    <h3 className="text-3xl font-bold text-gray-800 mb-3">
                                        Upload Video for Advanced Editing
                                    </h3>
                                    <p className="text-gray-600 mb-4 text-lg">
                                        Drag to select segments • Click to add quick segments • Precise timeline control
                                    </p>
                                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-200">
                                        <Info className="w-4 h-4 text-purple-600" />
                                        <span className="text-purple-700 font-medium">
                                            Perfect for interviews, presentations, and content creation
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
                    </div>
                )}

                {/* Video Editor Interface */}
                {selectedVideo && (
                    <div className="space-y-8">
                        {/* Video Player */}
                        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-xl">
                                            <Video className="w-8 h-8 text-blue-600" />
                                        </div>
                                        {selectedVideo.name}
                                    </h3>
                                    <p className="text-gray-600 text-lg flex items-center gap-2">
                                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{formatFileSize(selectedVideo.size)}</span>
                                        <span className="bg-purple-100 px-3 py-1 rounded-full text-sm">{formatTime(videoDuration)} duration</span>
                                    </p>
                                </div>
                                <button
                                    onClick={resetSystem}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 shadow-sm hover:shadow-md transform hover:scale-105"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Reset All
                                </button>
                            </div>

                            <div className="relative bg-black rounded-2xl overflow-hidden mb-6 group">
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    controls
                                    className="w-full max-h-96 object-contain"
                                    onLoadedMetadata={handleVideoLoad}
                                    onTimeUpdate={handleTimeUpdate}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    preload="metadata"
                                />

                                {/* Fallback play button for browsers that don't show controls */}
                                {!isPlaying && (
                                    <button
                                        onClick={togglePlayback}
                                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-5 rounded-full hover:bg-black transition-colors duration-300 shadow-lg opacity-0 group-hover:opacity-100"
                                    >
                                        <Play className="w-10 h-10" />
                                    </button>
                                )}
                            </div>

                            {/* Enhanced Video Controls */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => seekTo(Math.max(0, currentTime - 10))}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm"
                                        title="Seek back 10 seconds"
                                    >
                                        <SkipBack className="w-5 h-5" />
                                    </button>

                                    <span className="text-base font-bold text-gray-800 min-w-[60px] text-center">
                                        {formatTime(currentTime)}
                                    </span>

                                    <div className="flex-1 relative">
                                        <input
                                            type="range"
                                            min="0"
                                            max={videoDuration || 0}
                                            value={currentTime}
                                            onChange={(e) => seekTo(parseFloat(e.target.value))}
                                            className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                                            style={{
                                                background: `linear-gradient(to right, #10b981 ${currentTime / videoDuration * 100}%, #e5e7eb ${currentTime / videoDuration * 100}%)`
                                            }}
                                        />
                                    </div>

                                    <span className="text-base font-bold text-gray-800 min-w-[60px] text-center">
                                        {formatTime(videoDuration)}
                                    </span>

                                    <button
                                        onClick={() => seekTo(Math.min(videoDuration, currentTime + 10))}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm"
                                        title="Seek forward 10 seconds"
                                    >
                                        <SkipForward className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Timeline Editor */}
                        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
                            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700 mb-8 flex items-center gap-4">
                                <div className="bg-emerald-100 p-3 rounded-2xl">
                                    <Clock className="w-8 h-8 text-emerald-600" />
                                </div>
                                Interactive Timeline Editor
                            </h3>

                            {/* Quick Add Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 px-8 py-6 rounded-2xl flex items-center justify-center gap-4 font-medium text-gray-500 hover:border-gray-400 transition-all duration-300">
                                    <div className="bg-gray-200 p-3 rounded-xl">
                                        <EyeOff className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-semibold">Selective Blur</div>
                                        <div className="text-sm mt-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">🚧 Under Construction</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setBlurWholeVideo(!blurWholeVideo)}
                                    className={`px-8 py-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 font-bold text-lg ${blurWholeVideo
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg transform scale-105'
                                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg'
                                        }`}
                                >
                                    <div className="bg-white/20 p-3 rounded-xl">
                                        <EyeOff className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <div>{blurWholeVideo ? 'Whole Video Blurred' : 'Blur Whole Video'}</div>
                                        <div className="text-sm mt-1 opacity-90">{blurWholeVideo ? 'Click to remove' : 'Complete anonymization'}</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => addQuickSegment('voice')}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 font-bold text-lg shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <div className="bg-white/20 p-3 rounded-xl">
                                        <Mic className="w-6 h-6" />
                                    </div>
                                    Add Voice Segment (5s)
                                </button>
                            </div>

                            {/* Interactive Timeline */}
                            <div className="mb-8">
                                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    🖱️ Drag on timeline to create segments
                                </h4>

                                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-5 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-orange-800 font-medium">
                                                <strong>🚧 Selective Blur:</strong> Feature under construction. Use "Blur Whole Video" button above for complete anonymization.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-green-800 font-medium">
                                                <strong>Selective Voice Change:</strong> Original audio will be muted in selected segments and replaced with AI-generated voice. Other parts keep original audio.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-6">
                                    <div className="flex items-center gap-6 text-sm">
                                        <span className="text-gray-400 min-w-[140px] font-medium">Drag for Blur:</span>
                                        <div
                                            className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl h-20 border-2 border-gray-300 select-none opacity-60 cursor-not-allowed hover:border-gray-400 transition-all duration-300"
                                            style={{ userSelect: 'none' }}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200/70 rounded-2xl">
                                                <div className="text-center text-gray-500">
                                                    <div className="text-base font-bold mb-1">🚧 Under Construction</div>
                                                    <div className="text-sm">Use "Blur Whole Video" instead</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm">
                                        <span className="text-gray-600 min-w-[140px] font-medium">Drag for Voice:</span>
                                        <div
                                            className="flex-1 relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl h-20 cursor-crosshair border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 select-none group"
                                            onMouseDown={(e) => handleTimelineMouseDown(e, 'voice')}
                                            style={{ userSelect: 'none' }}
                                        >
                                            {/* Time markers */}
                                            {Array.from({ length: Math.ceil(videoDuration / 10) + 1 }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute top-0 bottom-0 border-l-2 border-blue-300/70 pointer-events-none"
                                                    style={{ left: `${(i * 10 / videoDuration) * 100}%` }}
                                                >
                                                    <span className="absolute -bottom-8 text-sm text-gray-500 font-medium transform -translate-x-1/2 pointer-events-none bg-white/80 px-2 py-1 rounded">
                                                        {i * 10}s
                                                    </span>
                                                </div>
                                            ))}

                                            {/* Drag preview */}
                                            {isDragging && dragType === 'voice' && dragStart !== null && (
                                                <div
                                                    className="absolute top-2 bg-blue-500/80 rounded-xl h-16 border-2 border-blue-600 pointer-events-none shadow-lg"
                                                    style={{
                                                        left: `${Math.min(dragStart, currentTime) / videoDuration * 100}%`,
                                                        width: `${Math.abs(currentTime - dragStart) / videoDuration * 100}%`
                                                    }}
                                                />
                                            )}

                                            {/* Voice segments */}
                                            {voiceSegments.map((segment) => (
                                                <div
                                                    key={`voice-${segment.id}`}
                                                    className="absolute top-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl h-16 flex items-center justify-center text-white text-sm font-bold shadow-lg pointer-events-none transform transition-all duration-200 hover:scale-105"
                                                    style={{
                                                        left: `${(segment.start / videoDuration) * 100}%`,
                                                        width: `${((segment.end - segment.start) / videoDuration) * 100}%`
                                                    }}
                                                >
                                                    <div className="text-center px-2">
                                                        <div className="font-bold">VOICE {(segment.end - segment.start).toFixed(1)}s</div>
                                                        <div className="text-xs opacity-90">Mute + Replace</div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Current time indicator */}
                                            <div
                                                className="absolute top-0 bottom-0 w-2 bg-gradient-to-t from-yellow-500 to-yellow-400 z-20 pointer-events-none shadow-lg"
                                                style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                                            >
                                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-500 rounded-full shadow"></div>
                                            </div>

                                            {/* Hover indicator */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 rounded-2xl"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Blur Status and Voice Segments */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Blur Status */}
                                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                                    <h4 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">
                                        <div className="bg-red-100 p-2 rounded-lg">
                                            <EyeOff className="w-6 h-6 text-red-600" />
                                        </div>
                                        Blur Settings
                                    </h4>
                                    <div className="bg-white p-6 rounded-2xl border border-red-200/70">
                                        {blurWholeVideo ? (
                                            <div className="text-center">
                                                <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                                    <EyeOff className="w-10 h-10 text-red-600" />
                                                </div>
                                                <p className="font-bold text-gray-800 text-lg mb-2">Whole Video Blur</p>
                                                <p className="text-sm text-gray-600 mb-4">Complete anonymization selected</p>
                                                <button
                                                    onClick={() => setBlurWholeVideo(false)}
                                                    className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2 rounded-xl transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Remove blur
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                                    <EyeOff className="w-10 h-10 opacity-50" />
                                                </div>
                                                <p className="font-medium text-gray-800 mb-2">No blur selected</p>
                                                <p className="text-sm text-gray-500 mb-4">Your video will retain original visuals</p>
                                                <button
                                                    onClick={() => setBlurWholeVideo(true)}
                                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl transition-colors"
                                                >
                                                    <EyeOff className="w-4 h-4" />
                                                    Enable whole video blur
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Voice Segments */}
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                                    <h4 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <Mic className="w-6 h-6 text-blue-600" />
                                        </div>
                                        Voice Segments ({voiceSegments.length})
                                    </h4>
                                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                        {voiceSegments.map((segment, index) => (
                                            <div key={segment.id} className="bg-white p-4 rounded-2xl border border-blue-200/70 hover:shadow-md transition-shadow duration-300">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                                            #{index + 1}
                                                        </div>
                                                        <span className="font-bold text-gray-800">Voice Segment</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveSegment('voice', segment.id)}
                                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove segment"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">Start Time (s)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={videoDuration}
                                                            step="0.1"
                                                            value={segment.start.toFixed(1)}
                                                            onChange={(e) => handleUpdateSegmentTime('voice', segment.id, 'start', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">End Time (s)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={videoDuration}
                                                            step="0.1"
                                                            value={segment.end.toFixed(1)}
                                                            onChange={(e) => handleUpdateSegmentTime('voice', segment.id, 'end', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                                                    <span>Duration: <span className="font-bold text-gray-800">{(segment.end - segment.start).toFixed(1)}s</span></span>
                                                    <span>Start: {formatTime(segment.start)} | End: {formatTime(segment.end)}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {voiceSegments.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p className="font-medium">No voice segments added yet</p>
                                                <p className="text-sm mt-1">Use the "Add Voice Segment" button or drag on the timeline</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Voice Selection */}
                        {voiceSegments.length > 0 && (
                            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
                                <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700 mb-8 flex items-center gap-4">
                                    <div className="bg-emerald-100 p-3 rounded-2xl">
                                        <Users className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    Voice Selection
                                </h3>

                                {/* Male Voices */}
                                <div className="mb-8">
                                    <h4 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-lg">
                                            <User className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        Male Voices Voices
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {voiceOptions.male.map((voice) => (
                                            <div
                                                key={voice.id}
                                                onClick={() => setSelectedVoice(voice.id)}
                                                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedVoice === voice.id
                                                    ? 'border-blue-500 bg-blue-50 shadow-xl transform scale-105'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-4 h-4 rounded-full border-2 ${selectedVoice === voice.id ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                                        }`}></div>
                                                    <h5 className="font-bold text-gray-800 text-lg">{voice.name}</h5>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                                                    <span className="bg-blue-100 px-2 py-1 rounded text-xs font-medium">Style:</span>
                                                    {voice.style}
                                                </p>
                                                <p className="text-sm text-blue-600 mb-2 flex items-center gap-2">
                                                    <span className="bg-blue-100 px-2 py-1 rounded text-xs font-medium">Language:</span>
                                                    {voice.language}
                                                </p>
                                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">Accent:</span>
                                                    {voice.accent}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Female Voices */}
                                <div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">
                                        <div className="bg-teal-100 p-2 rounded-lg">
                                            <User className="w-5 h-5 text-teal-600" />
                                        </div>
                                        Female Voices
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                                        {voiceOptions.female.map((voice) => (
                                            <div
                                                key={voice.id}
                                                onClick={() => setSelectedVoice(voice.id)}
                                                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedVoice === voice.id
                                                    ? 'border-purple-500 bg-purple-50 shadow-xl transform scale-105'
                                                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-4 h-4 rounded-full border-2 ${selectedVoice === voice.id ? 'bg-purple-500 border-purple-500' : 'bg-white border-gray-300'
                                                        }`}></div>
                                                    <h5 className="font-bold text-gray-800 text-lg">{voice.name}</h5>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                                                    <span className="bg-purple-100 px-2 py-1 rounded text-xs font-medium">Style:</span>
                                                    {voice.style}
                                                </p>
                                                <p className="text-sm text-purple-600 mb-2 flex items-center gap-2">
                                                    <span className="bg-purple-100 px-2 py-1 rounded text-xs font-medium">Language:</span>
                                                    {voice.language}
                                                </p>
                                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">Accent:</span>
                                                    {voice.accent}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Process Button */}
                        {(blurWholeVideo || voiceSegments.length > 0) && !isProcessing && !processedVideo && (
                            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
                                <button
                                    onClick={processVideo}
                                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold py-5 px-8 rounded-2xl hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl"
                                >
                                    <Shield className="w-7 h-7" />
                                    Process Video {blurWholeVideo && voiceSegments.length > 0 ? '(Blur + Voice)' : blurWholeVideo ? '(Blur)' : '(Voice)'}
                                </button>
                                <div className="text-center text-gray-600 mt-4 space-y-2">
                                    <p className="text-lg">
                                        <span className={blurWholeVideo ? 'text-red-600 font-bold' : 'text-gray-500'}>
                                            {blurWholeVideo ? '✓ Whole video blur' : '✗ No blur'}
                                        </span>
                                        {' • '}
                                        <span className={voiceSegments.length > 0 ? 'text-blue-600 font-bold' : 'text-gray-500'}>
                                            {voiceSegments.length} voice segments
                                        </span>
                                    </p>
                                    <p className="text-base text-gray-500">
                                        {voiceSegments.length > 0 && blurWholeVideo
                                            ? 'Audio processing first, then video blur'
                                            : voiceSegments.length > 0
                                                ? 'Audio processing only'
                                                : 'Video blur only'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Processing Progress */}
                        {isProcessing && (
                            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-300">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="animate-spin">
                                        <Loader2 className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-800 font-bold text-2xl">
                                                {currentStep}
                                            </span>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                                {progress.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-4 rounded-full transition-all duration-300 shadow-inner"
                                        style={{ width: `${progress.toFixed(1)}%` }}
                                    ></div>
                                </div>
                                <p className="text-center text-gray-600 mt-4 text-lg">
                                    Processing your video with advanced technology...
                                </p>
                                <p className="text-center text-gray-500 text-sm mt-2">
                                    This may take a few minutes depending on video length
                                </p>
                            </div>
                        )}

                        {/* Final Result */}
                        {processedVideo && (
                            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="bg-green-100 p-3 rounded-2xl">
                                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-800 font-bold text-2xl">
                                            Processing Complete!
                                        </h3>
                                        <p className="text-green-700 font-bold text-lg">{processedVideo.name}</p>
                                        <p className="text-gray-600 text-sm">Ready for download</p>
                                    </div>
                                </div>

                                <div className="relative bg-black rounded-2xl overflow-hidden mb-8 group">
                                    <video
                                        src={processedVideo.url}
                                        controls
                                        controlsList="nodownload"
                                        className="w-full max-h-96 object-contain"
                                        preload="metadata"
                                        autoPlay={false}
                                        muted={false}
                                    >
                                        Your browser does not support the video tag.
                                    </video>

                                    {/* Video info overlay */}
                                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        Processed Video Preview
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={downloadVideo}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        <Download className="w-6 h-6" />
                                        Download Video
                                    </button>

                                    <button
                                        onClick={resetSystem}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        <RotateCcw className="w-6 h-6" />
                                        New Video
                                    </button>
                                </div>

                                <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-green-500 rounded-full shadow"></div>
                                            <span className="text-gray-700">
                                                <strong className="font-bold">Processing:</strong> {blurWholeVideo && voiceSegments.length > 0 ? 'Blur + Voice' : blurWholeVideo ? 'Blur Only' : 'Voice Only'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-red-400 rounded-full shadow"></div>
                                            <span className="text-gray-700">
                                                <strong className="font-bold">Blur Applied:</strong> {blurWholeVideo ? 'Whole Video' : 'None'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-blue-400 rounded-full shadow"></div>
                                            <span className="text-gray-700">
                                                <strong className="font-bold">Voice Changed:</strong> {voiceSegments.length} segments
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Guide Section */}
                <div ref={guideRef} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-10 shadow-2xl border border-purple-200">
                    <h3 className="text-gray-800 font-bold text-3xl mb-8 flex items-center gap-4">
                        <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-3 rounded-2xl">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                        </div>
                        Advanced Video Editing Guide
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-purple-700 flex items-center gap-2">
                                <Clock className="w-6 h-6" />
                                Timeline Editing
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Drag on timeline to create voice segments</li>
                                <li>• Minimum segment duration: 0.5 seconds</li>
                                <li>• Precise start and end time control</li>
                                <li>• Visual segment representation</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-indigo-700 flex items-center gap-2">
                                <EyeOff className="w-6 h-6" />
                                Selective Processing
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Choose specific segments for voice change</li>
                                <li>• Blur whole video or selective areas</li>
                                <li>• Preserve original audio in unselected parts</li>
                                <li>• Advanced anonymization control</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-xl mb-4 text-cyan-700 flex items-center gap-2">
                                <Edit3 className="w-6 h-6" />
                                Professional Features
                            </h4>
                            <ul className="space-y-2 text-gray-700">
                                <li>• Frame-accurate editing precision</li>
                                <li>• Multiple voice segment support</li>
                                <li>• Real-time preview capabilities</li>
                                <li>• Export in original quality</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <p className="text-gray-600 mb-3">
                            <strong>Advanced Features:</strong> This editor provides timeline-based precision editing for professional anonymization workflows. Perfect for interviews, presentations, and content requiring selective privacy protection.
                        </p>
                        <p className="text-gray-500 text-sm">
                            Note: Selective blur functionality is currently under development. Use "Blur Whole Video" for complete face anonymization.
                        </p>
                    </div>
                </div>

                {/* Guide Popup */}
                <GuidePopup
                    isVisible={showGuidePopup}
                    onClose={closeGuidePopup}
                    onViewFullGuide={showGuide}
                    guideData={anonymousEditorGuideSchema}
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

export default AnonymousEditor;