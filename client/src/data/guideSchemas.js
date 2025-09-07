import { Mic, Shield, Edit3 } from 'lucide-react';

export const voiceChangerGuideSchema = {
    title: "Welcome to Voice Transformer!",
    icon: Mic,
    localStorageKey: 'voiceTransformerGuideShown',
    colors: {
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600',
        stepsBg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
        stepsBorder: 'border border-emerald-200',
        stepNumber: 'bg-emerald-500',
        useCasesBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        useCasesBorder: 'border border-blue-200',
        useCasesIcon: 'text-blue-600',
        notesBg: 'bg-gradient-to-r from-amber-50 to-orange-50',
        notesBorder: 'border border-amber-200',
        notesIcon: 'text-amber-600',
        primaryButton: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
    },
    steps: [
        "Record your voice using the microphone or upload an audio file",
        "Choose from 8 different Indian AI voices (Hindi, English, Tamil, Bengali)",
        "Transform your voice with AI technology",
        "Preview and download your transformed audio"
    ],
    useCases: [
        "Privacy Protection: Anonymous interviews and testimonials",
        "Content Creation: Voiceovers and podcast narration",
        "Educational Content: Multi-language presentations",
        "Creative Projects: Character voices for storytelling"
    ],
    importantNotes: [
        "Always ensure you have permission to transform voices",
        "Use voice transformation responsibly and legally",
        "Clear audio quality produces better results",
        "Microphone access is required for recording"
    ]
};

export const systemGuideSchema = {
    title: "Welcome to Video Anonymizer!",
    icon: Shield,
    localStorageKey: 'videoAnonymizerGuideShown',
    colors: {
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600',
        stepsBg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
        stepsBorder: 'border border-emerald-200',
        stepNumber: 'bg-emerald-500',
        useCasesBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        useCasesBorder: 'border border-blue-200',
        useCasesIcon: 'text-blue-600',
        notesBg: 'bg-gradient-to-r from-amber-50 to-orange-50',
        notesBorder: 'border border-amber-200',
        notesIcon: 'text-amber-600',
        primaryButton: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
    },
    steps: [
        "Upload your video file (MP4, AVI, MOV, MKV, WebM)",
        "Choose an AI voice for anonymization",
        "Optionally enable face blurring for additional privacy",
        "Process video with AI technology and download the result"
    ],
    useCases: [
        "Privacy Protection: Anonymous interviews and whistleblowing",
        "Confidential Content: Sensitive business communications",
        "Educational Videos: Protect student/participant identity",
        "Content Creation: Anonymous testimonials and reviews"
    ],
    importantNotes: [
        "Processing may take several minutes depending on video length",
        "Face blurring adds extra processing time but enhances anonymity",
        "Original video quality is preserved during processing",
        "Always obtain consent before processing videos with people"
    ]
};

export const anonymousEditorGuideSchema = {
    title: "Welcome to Anonymous Editor Pro!",
    icon: Edit3,
    localStorageKey: 'anonymousEditorGuideShown',
    colors: {
        iconBg: 'bg-purple-100',
        iconText: 'text-purple-600',
        stepsBg: 'bg-gradient-to-r from-purple-50 to-indigo-50',
        stepsBorder: 'border border-purple-200',
        stepNumber: 'bg-purple-500',
        useCasesBg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
        useCasesBorder: 'border border-blue-200',
        useCasesIcon: 'text-blue-600',
        notesBg: 'bg-gradient-to-r from-amber-50 to-orange-50',
        notesBorder: 'border border-amber-200',
        notesIcon: 'text-amber-600',
        primaryButton: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
    },
    steps: [
        "Upload your video and wait for it to load completely",
        "Use the timeline to drag and select specific segments for voice change",
        "Choose 'Blur Whole Video' for complete face anonymization",
        "Select an AI voice and process your video with precision control"
    ],
    useCases: [
        "Selective Anonymization: Only anonymize specific parts of interviews",
        "Professional Editing: Precise control over voice and blur segments",
        "Content Creation: Advanced editing for sensitive content",
        "Educational Videos: Protect specific speakers while keeping others"
    ],
    importantNotes: [
        "Drag on the timeline to create voice change segments (minimum 0.5 seconds)",
        "Selective blur is under construction - use 'Blur Whole Video' for now",
        "Longer videos may require more processing time and resources",
        "Timeline editing requires the video to be fully loaded first"
    ]
};