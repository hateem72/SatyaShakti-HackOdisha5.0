import CloudinaryApi from './CloudinaryApi';
import { convertVoice, handleApiError } from './MurfApi';

class AnonymousEditorApi {
    constructor() {
        this.cloudinaryApi = new CloudinaryApi();
    }

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

}

export default AnonymousEditorApi;