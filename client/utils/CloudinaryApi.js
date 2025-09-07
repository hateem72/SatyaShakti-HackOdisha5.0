
class CloudinaryApi {
  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    this.apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`;

    if (!this.cloudName || !this.uploadPreset) {
      console.warn('Cloudinary credentials not found in environment variables');
    }
  }

 
  async uploadVideo(file, onProgress = null) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.type.startsWith('video/')) {
        throw new Error('File must be a video');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('resource_type', 'video');

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', this.uploadUrl);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  
  async blurVideo(uploadResult, fileName, blurStrength = 2000) {
    try {
      if (!uploadResult || !uploadResult.public_id) {
        throw new Error('Upload result with public_id is required');
      }

      console.log('Video upload result:', uploadResult);

      const baseFileName = fileName.replace(/\.[^/.]+$/, '');

      // Use enhanced Cloudinary transformation with better quality settings
      const blurredVideoUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/e_blur:${blurStrength},q_auto:good,f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;

      console.log('Video blur URL:', blurredVideoUrl);

      // Fetch the processed video with retry logic
      let response;
      let retries = 3;
      
      while (retries > 0) {
        try {
          response = await fetch(blurredVideoUrl);
          if (response.ok) break;
          
          if (response.status === 423) {
            // Resource is being processed, wait and retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries--;
            continue;
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (fetchError) {
          retries--;
          if (retries === 0) throw fetchError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary response error:', errorText);
        throw new Error(`Video blur failed: ${response.status} - ${response.statusText}`);
      }

      const videoBlob = await response.blob();

      // Verify we got video content
      if (videoBlob.size === 0) {
        throw new Error('Processed video file is empty');
      }

      return {
        url: URL.createObjectURL(videoBlob),
        name: `${baseFileName}_blurred.mp4`,
        blob: videoBlob,
        downloadUrl: blurredVideoUrl,
        originalVideoId: uploadResult.public_id
      };
    } catch (error) {
      console.error('Cloudinary video blur error:', error);
      throw error;
    }
  }

  /**
   * Complete blur workflow for videos
   */
  async processFaceBlurVideo(file, onUploadProgress = null, onProcessingProgress = null, blurStrength = 2000) {
    try {
      // Step 1: Upload video to Cloudinary
      if (onProcessingProgress) onProcessingProgress('Uploading video...', 20);

      const uploadResult = await this.uploadVideo(file, onUploadProgress);

      if (onProcessingProgress) onProcessingProgress('Applying blur effect to video...', 70);

      // Step 2: Apply blur using Cloudinary transformations
      const result = await this.blurVideo(uploadResult, file.name, blurStrength);

      if (onProcessingProgress) onProcessingProgress('Video blur complete!', 100);

      return {
        ...result,
        originalVideo: uploadResult,
        success: true
      };
    } catch (error) {
      console.error('Cloudinary video blur processing error:', error);
      throw error;
    }
  }

  /**
   * Convert video to MP3 using Cloudinary transformations
   */
  async convertVideoToMp3(uploadResult, fileName) {
    try {
      if (!uploadResult || !uploadResult.public_id) {
        throw new Error('Upload result with public_id is required');
      }

      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      const mp3Url = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp3,fl_attachment/${uploadResult.public_id}.mp3`;

      const response = await fetch(mp3Url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary response error:', errorText);
        throw new Error(`Audio conversion failed: ${response.status} - ${response.statusText}`);
      }

      const audioBlob = await response.blob();

      if (audioBlob.size === 0) {
        throw new Error('Converted audio file is empty');
      }

      return {
        url: URL.createObjectURL(audioBlob),
        name: `${baseFileName}.mp3`,
        blob: audioBlob,
        downloadUrl: mp3Url,
        uploadedVideoUrl: uploadResult.secure_url,
        uploadedVideoId: uploadResult.public_id
      };
    } catch (error) {
      console.error('Cloudinary audio conversion error:', error);
      throw error;
    }
  }

  /**
   * Complete video to MP3 conversion workflow
   */
  async processVideoToMp3(file, onUploadProgress = null, onConversionProgress = null) {
    try {
      if (onConversionProgress) onConversionProgress('Uploading video to Cloudinary...', 10);

      const uploadResult = await this.uploadVideo(file, onUploadProgress);

      if (onConversionProgress) onConversionProgress('Converting video to MP3...', 70);

      const conversionResult = await this.convertVideoToMp3(uploadResult, file.name);

      if (onConversionProgress) onConversionProgress('Conversion complete!', 100);

      return {
        ...conversionResult,
        originalFile: uploadResult,
        success: true
      };
    } catch (error) {
      console.error('Cloudinary processing error:', error);
      throw error;
    }
  }

  /**
   * Upload audio file to Cloudinary
   */
  async uploadAudio(file, onProgress = null) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.type.startsWith('audio/')) {
        throw new Error('File must be an audio file');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('resource_type', 'video');

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', this.uploadUrl);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Audio upload error:', error);
      throw error;
    }
  }

  /**
   * Replace video audio with new audio using Cloudinary
   */
  async replaceVideoAudio(videoResult, audioResult, fileName) {
    try {
      if (!videoResult || !videoResult.public_id) {
        throw new Error('Video upload result with public_id is required');
      }

      if (!audioResult || !audioResult.public_id) {
        throw new Error('Audio upload result with public_id is required');
      }

      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      // Mute original audio (ac_none) and replace with new audio
      const videoWithNewAudioUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/ac_none/l_video:${audioResult.public_id},fl_layer_apply,f_mp4,fl_attachment/${videoResult.public_id}.mp4`;

      const response = await fetch(videoWithNewAudioUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary response error:', errorText);
        throw new Error(`Audio replacement failed: ${response.status} - ${response.statusText}`);
      }

      const videoBlob = await response.blob();

      if (videoBlob.size === 0) {
        throw new Error('Processed video file is empty');
      }

      return {
        url: URL.createObjectURL(videoBlob),
        name: `${baseFileName}_new_audio.mp4`,
        blob: videoBlob,
        downloadUrl: videoWithNewAudioUrl,
        originalVideoId: videoResult.public_id,
        audioId: audioResult.public_id
      };
    } catch (error) {
      console.error('Cloudinary audio replacement error:', error);
      throw error;
    }
  }


 

 
  /**
   * Advanced timeline-based processing workflow
   * @param {File} videoFile - Video file to process
   * @param {Object} timelineConfig - Configuration for timeline processing
   * @param {Function} onProgress - Progress callback
   */
  async processAdvancedTimeline(videoFile, timelineConfig, onProgress = null) {
    try {
      if (onProgress) onProgress('Uploading video...', 10);

      const uploadResult = await this.uploadVideo(videoFile);

      if (onProgress) onProgress('Getting video metadata...', 20);

      const metadata = await this.getVideoMetadata(uploadResult);

      const results = {
        originalVideo: uploadResult,
        metadata,
        processedSegments: [],
        finalVideo: null
      };

      // Process segments if specified
      if (timelineConfig.segments && timelineConfig.segments.length > 0) {
        if (onProgress) onProgress('Processing timeline segments...', 40);

        results.processedSegments = await this.processTimelineSegments(
          uploadResult,
          timelineConfig.segments,
          videoFile.name
        );
      }

      // Apply selective blur if specified
      if (timelineConfig.blurSegments && timelineConfig.blurSegments.length > 0) {
        if (onProgress) onProgress('Applying selective blur...', 60);

        results.selectiveBlur = await this.applySelectiveBlur(
          uploadResult,
          timelineConfig.blurSegments,
          videoFile.name
        );
      }

      // Create thumbnails if specified
      if (timelineConfig.thumbnails && timelineConfig.thumbnails.length > 0) {
        if (onProgress) onProgress('Creating thumbnails...', 80);

        results.thumbnails = [];
        for (const timestamp of timelineConfig.thumbnails) {
          const thumbnail = await this.createVideoThumbnail(uploadResult, timestamp);
          results.thumbnails.push(thumbnail);
        }
      }

      if (onProgress) onProgress('Timeline processing complete!', 100);

      return results;
    } catch (error) {
      console.error('Advanced timeline processing error:', error);
      throw error;
    }
  }
}

export default CloudinaryApi;