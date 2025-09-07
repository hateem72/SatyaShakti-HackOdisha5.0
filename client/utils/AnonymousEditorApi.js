/**
 * Anonymous Editor API utility functions
 * Handles video processing, voice conversion, and blur operations for the Anonymous Editor
 */

import CloudinaryApi from './CloudinaryApi';
import { convertVoice, handleApiError } from './MurfApi';

class AnonymousEditorApi {
    constructor() {
        this.cloudinaryApi = new CloudinaryApi();
    }

    /**
     * Process voice segments by extracting audio, converting voice, and uploading
     * @param {Array} voiceSegments - Array of voice segments with start/end times
     * @param {Object} uploadResult - Cloudinary upload result
     * @param {string} selectedVoice - Selected voice ID for conversion
     * @param {Function} onProgress - Progress callback function
     * @param {Function} onStepUpdate - Step update callback function
     * @returns {Array} Processed voice segments with converted audio
     */
    async processVoiceSegments(voiceSegments, uploadResult, selectedVoice, onProgress, onStepUpdate) {
        const processedVoiceSegments = [];
        
        if (voiceSegments.length === 0) {
            return processedVoiceSegments;
        }

        onStepUpdate('🎤 Processing audio segments...');
        
        for (let i = 0; i < voiceSegments.length; i++) {
            const segment = voiceSegments[i];
            onStepUpdate(`🎤 Processing audio segment ${i + 1}/${voiceSegments.length}...`);
            onProgress(parseFloat((30 + (i / voiceSegments.length) * 25).toFixed(1))); // 30-55%

            try {
                // Extract segment audio from Cloudinary
                const segmentAudioUrl = `https://res.cloudinary.com/${this.cloudinaryApi.cloudName}/video/upload/so_${segment.start},eo_${segment.end},f_mp3/${uploadResult.public_id}.mp3`;
                const audioResponse = await fetch(segmentAudioUrl);
                
                if (audioResponse.ok) {
                    const audioBlob = await audioResponse.blob();
                    
                    // Check if audio blob has content
                    if (audioBlob.size < 1000) { // Less than 1KB, likely empty or too short
                        console.warn(`Segment ${i + 1} audio too short, skipping voice conversion`);
                        continue;
                    }
                    
                    const audioFile = new File([audioBlob], `segment_${i}.mp3`, { type: 'audio/mp3' });

                    // Convert voice using Murf API
                    const voiceResult = await convertVoice(audioFile, selectedVoice);
                    
                    if (voiceResult && voiceResult.audio_file) {
                        const convertedAudioResponse = await fetch(voiceResult.audio_file);
                        const convertedAudioBlob = await convertedAudioResponse.blob();
                        const convertedAudioFile = new File([convertedAudioBlob], `converted_${i}.mp3`, { type: 'audio/mp3' });

                        // Upload converted audio to Cloudinary
                        const audioUpload = await this.cloudinaryApi.uploadAudio(convertedAudioFile);
                        
                        processedVoiceSegments.push({
                            ...segment,
                            convertedAudio: audioUpload
                        });
                    }
                }
            } catch (voiceError) {
                console.warn(`Voice conversion failed for segment ${i + 1}:`, voiceError);
                
                // Handle specific error types
                if (voiceError.message === 'SKIP_SEGMENT_LOW_VOLUME' || 
                    voiceError.message === 'SKIP_SEGMENT_CONVERSION_FAILED') {
                    console.log(`Skipping segment ${i + 1} due to: ${voiceError.message}`);
                    continue;
                }
                
                // For other errors, continue with remaining segments
            }
        }

        return processedVoiceSegments;
    }

    /**
     * Apply audio processing to video using processed voice segments
     * @param {Object} uploadResult - Original video upload result
     * @param {Array} processedVoiceSegments - Processed voice segments with converted audio
     * @param {string} fileName - Original file name
     * @param {Function} onProgress - Progress callback function
     * @param {Function} onStepUpdate - Step update callback function
     * @returns {Object} Video with processed audio
     */
    async applyAudioProcessing(uploadResult, processedVoiceSegments, fileName, onProgress, onStepUpdate) {
        if (processedVoiceSegments.length === 0) {
            return uploadResult;
        }

        onStepUpdate('🎤 Applying audio changes...');
        onProgress(55.0);
        
        const result = await this.cloudinaryApi.processVideoWithSegments(
            uploadResult,
            [], // No blur segments yet
            processedVoiceSegments.map(seg => ({
                startTime: seg.start,
                endTime: seg.end,
                convertedAudio: seg.convertedAudio
            })),
            fileName
        );
        
        onProgress(70.0);
        return result;
    }

    /**
     * Apply blur to entire video
     * @param {Object} videoResult - Video to blur (can be original or audio-processed)
     * @param {string} fileName - Original file name
     * @param {boolean} hasAudioProcessing - Whether audio processing was done
     * @param {Function} onProgress - Progress callback function
     * @param {Function} onStepUpdate - Step update callback function
     * @returns {Object} Blurred video result
     */
    async applyWholeVideoBlur(videoResult, fileName, hasAudioProcessing, onProgress, onStepUpdate) {
        onStepUpdate('🎭 Applying blur to entire video...');
        const baseProgress = hasAudioProcessing ? 75.0 : 60.0;
        onProgress(baseProgress);
        
        // Create a File object from the processed video (or original if no audio processing)
        let videoToBlur;
        if (videoResult && videoResult.blob) {
            videoToBlur = new File([videoResult.blob], videoResult.name || fileName, {
                type: 'video/mp4'
            });
        } else {
            // If no blob, we need to create a file from the original
            throw new Error('Video result must have a blob for blur processing');
        }
        
        // Use Cloudinary's face blur processing
        const blurResult = await this.cloudinaryApi.processFaceBlurVideo(
            videoToBlur,
            (uploadProg) => {
                const progressBase = hasAudioProcessing ? 75.0 : 60.0;
                onProgress(parseFloat((progressBase + (uploadProg * 0.05)).toFixed(1)));
            },
            (message, processingProg) => {
                onStepUpdate('🎭 Applying blur to entire video...');
                const progressBase = hasAudioProcessing ? 80.0 : 65.0;
                onProgress(parseFloat((progressBase + (processingProg * 0.05)).toFixed(1)));
            },
            2000 // Blur strength
        );
        
        return blurResult;
    }

    /**
     * Complete video processing workflow for Anonymous Editor
     * @param {File} videoFile - Original video file
     * @param {Array} voiceSegments - Voice segments to process
     * @param {boolean} blurWholeVideo - Whether to blur entire video
     * @param {string} selectedVoice - Selected voice for conversion
     * @param {Function} onProgress - Progress callback function
     * @param {Function} onStepUpdate - Step update callback function
     * @returns {Object} Final processed video result
     */
    async processAnonymousVideo(videoFile, voiceSegments, blurWholeVideo, selectedVoice, onProgress, onStepUpdate) {
        try {
            // Step 1: Upload original video
            onStepUpdate('🚀 Preparing your video for processing...');
            onProgress(10.0);

            const uploadResult = await this.cloudinaryApi.uploadVideo(videoFile, (prog) => {
                onProgress(parseFloat((10 + (prog * 0.2)).toFixed(1))); // 10-30%
            });

            onStepUpdate('🎬 Processing video content...');
            onProgress(30.0);

            // Step 2: Process voice segments
            const processedVoiceSegments = await this.processVoiceSegments(
                voiceSegments, 
                uploadResult, 
                selectedVoice, 
                onProgress, 
                onStepUpdate
            );

            // Step 3: Apply audio processing if needed
            let result = await this.applyAudioProcessing(
                uploadResult, 
                processedVoiceSegments, 
                videoFile.name, 
                onProgress, 
                onStepUpdate
            );

            // Step 4: Apply blur if selected
            if (blurWholeVideo) {
                result = await this.applyWholeVideoBlur(
                    result, 
                    videoFile.name, 
                    processedVoiceSegments.length > 0, 
                    onProgress, 
                    onStepUpdate
                );
            }

            onProgress(85.0);
            onStepUpdate('🎉 Finalizing your video...');
            onProgress(90.0);

            return result;

        } catch (error) {
            console.error('Anonymous video processing error:', error);
            throw error;
        }
    }

    /**
     * Validate and prepare final video result
     * @param {Object} result - Processing result
     * @param {File} originalFile - Original video file
     * @param {Function} onStepUpdate - Step update callback function
     * @returns {Object} Final video object with url, name, and blob
     */
    async prepareFinalVideo(result, originalFile, onStepUpdate) {
        if (!result || (!result.blob && !result.downloadUrl)) {
            throw new Error('No valid video data received');
        }

        let finalVideoBlob;
        let finalVideoName;
        
        if (result.blob) {
            // We have the processed video blob
            finalVideoBlob = result.blob;
            finalVideoName = result.name;
            
            // Check if the video has reasonable size (not empty or too small)
            if (finalVideoBlob.size < 1000) {
                console.warn('Processed video seems too small, using fallback');
                throw new Error('Processed video is too small');
            }
            
        } else if (result.downloadUrl) {
            // Fetch the processed video
            const videoResponse = await fetch(result.downloadUrl);
            if (videoResponse.ok) {
                finalVideoBlob = await videoResponse.blob();
                finalVideoName = result.name || `${originalFile.name.replace(/\.[^/.]+$/, '')}_processed.mp4`;
                
                // Check video size
                if (finalVideoBlob.size < 1000) {
                    console.warn('Downloaded video seems too small, using fallback');
                    throw new Error('Downloaded video is too small');
                }
            } else {
                throw new Error('Failed to fetch processed video');
            }
        }
        
        // Verify we have a valid video
        console.log('Final video info:', {
            name: finalVideoName,
            size: finalVideoBlob.size,
            type: finalVideoBlob.type
        });
        
        return {
            url: URL.createObjectURL(finalVideoBlob),
            name: finalVideoName,
            blob: finalVideoBlob,
            warning: result.warning
        };
    }

    /**
     * Handle processing errors and provide fallback
     * @param {Object} uploadResult - Original upload result
     * @param {File} originalFile - Original video file
     * @returns {Object} Fallback video result
     */
    async handleProcessingError(uploadResult, originalFile) {
        console.warn('Video processing failed, ensuring complete original video is returned');
        
        const fallbackResult = await this.cloudinaryApi.ensureFullVideo(uploadResult, originalFile.name);
        
        return {
            url: fallbackResult.url,
            name: fallbackResult.name,
            blob: fallbackResult.blob,
            warning: 'Processing failed, but your complete original video is preserved and ready for download.'
        };
    }
}

export default AnonymousEditorApi;