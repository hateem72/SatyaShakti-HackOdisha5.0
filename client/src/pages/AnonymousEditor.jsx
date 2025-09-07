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

              
               

                {/* Guide Popup */}
                <GuidePopup
                    isVisible={showGuidePopup}
                    onClose={closeGuidePopup}
                    onViewFullGuide={showGuide}
                    guideData={anonymousEditorGuideSchema}
                />
            </div>
        </div>
    );
};

export default AnonymousEditor;