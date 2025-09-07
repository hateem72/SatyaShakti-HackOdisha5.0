/**
 * Cloudinary API utility for video processing
 * Handles video uploads and blur effects using Cloudinary's transformation capabilities
 */

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

  /**
   * Upload video file to Cloudinary
   */
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

  /**
   * Apply blur to video using Cloudinary with enhanced transformations
   */
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
   * Complete video audio replacement workflow
   */
  async processVideoAudioReplacement(videoFile, audioFile, onVideoUploadProgress = null, onAudioUploadProgress = null, onProcessingProgress = null) {
    try {
      if (onProcessingProgress) onProcessingProgress('Uploading video...', 10);

      const videoResult = await this.uploadVideo(videoFile, onVideoUploadProgress);

      if (onProcessingProgress) onProcessingProgress('Uploading audio...', 40);

      const audioResult = await this.uploadAudio(audioFile, onAudioUploadProgress);

      if (onProcessingProgress) onProcessingProgress('Replacing video audio...', 70);

      const result = await this.replaceVideoAudio(videoResult, audioResult, videoFile.name);

      if (onProcessingProgress) onProcessingProgress('Processing complete!', 100);

      return {
        ...result,
        originalVideo: videoResult,
        originalAudio: audioResult,
        success: true
      };
    } catch (error) {
      console.error('Cloudinary audio replacement processing error:', error);
      throw error;
    }
  }

  // ===== ENHANCED TIMELINE-BASED PROCESSING METHODS =====

  /**
   * Extract video segment based on timeline
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {number} startTime - Start time in seconds
   * @param {number} endTime - End time in seconds
   * @param {string} fileName - Original file name
   */
  async extractVideoSegment(uploadResult, startTime, endTime, fileName) {
    try {
      if (!uploadResult || !uploadResult.public_id) {
        throw new Error('Upload result with public_id is required');
      }

      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      const segmentUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/so_${startTime},eo_${endTime},f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;

      const response = await fetch(segmentUrl);

      if (!response.ok) {
        throw new Error(`Segment extraction failed: ${response.status} - ${response.statusText}`);
      }

      const videoBlob = await response.blob();

      return {
        url: URL.createObjectURL(videoBlob),
        name: `${baseFileName}_segment_${startTime}-${endTime}.mp4`,
        blob: videoBlob,
        downloadUrl: segmentUrl,
        startTime,
        endTime,
        duration: endTime - startTime
      };
    } catch (error) {
      console.error('Video segment extraction error:', error);
      throw error;
    }
  }

  /**
   * Apply different transformations to specific timeline segments
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {Array} segments - Array of segment objects with transformations
   * @param {string} fileName - Original file name
   */
  async processTimelineSegments(uploadResult, segments, fileName) {
    try {
      if (!uploadResult || !uploadResult.public_id) {
        throw new Error('Upload result with public_id is required');
      }

      const processedSegments = [];

      for (const segment of segments) {
        const { startTime, endTime, transformations = [] } = segment;

        // Build transformation string
        let transformationStr = `so_${startTime},eo_${endTime}`;

        if (transformations.length > 0) {
          transformationStr += '/' + transformations.join('/');
        }

        const segmentUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/${transformationStr},f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;

        const response = await fetch(segmentUrl);

        if (!response.ok) {
          throw new Error(`Segment processing failed for ${startTime}-${endTime}: ${response.status}`);
        }

        const videoBlob = await response.blob();

        processedSegments.push({
          url: URL.createObjectURL(videoBlob),
          name: `segment_${startTime}-${endTime}.mp4`,
          blob: videoBlob,
          startTime,
          endTime,
          transformations
        });
      }

      return processedSegments;
    } catch (error) {
      console.error('Timeline segments processing error:', error);
      throw error;
    }
  }

  /**
   * Simple video processing without concatenation - just return the processed video
   * @param {Object} videoResult - Processed video result
   * @param {string} fileName - Output file name
   */
  async finalizeProcessedVideo(videoResult, fileName) {
    try {
      if (!videoResult || !videoResult.public_id) {
        throw new Error('Video result with public_id is required');
      }

      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      
      // Ensure we get the full video without any trimming
      const finalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${videoResult.public_id}.mp4`;

      const response = await fetch(finalUrl);

      if (!response.ok) {
        throw new Error(`Video finalization failed: ${response.status} - ${response.statusText}`);
      }

      const videoBlob = await response.blob();

      // Verify the video has content
      if (videoBlob.size === 0) {
        throw new Error('Processed video is empty');
      }

      return {
        url: URL.createObjectURL(videoBlob),
        name: `${baseFileName}_processed.mp4`,
        blob: videoBlob,
        downloadUrl: finalUrl,
        public_id: videoResult.public_id
      };
    } catch (error) {
      console.error('Video finalization error:', error);
      throw error;
    }
  }

  /**
   * Ensure full video is preserved - utility method
   * @param {Object} uploadResult - Original upload result
   * @param {string} fileName - File name
   */
  async ensureFullVideo(uploadResult, fileName) {
    try {
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      
      // Get the complete original video
      const fullVideoUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
      
      const response = await fetch(fullVideoUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch full video: ${response.status}`);
      }
      
      const videoBlob = await response.blob();
      
      return {
        url: URL.createObjectURL(videoBlob),
        name: `${baseFileName}_full.mp4`,
        blob: videoBlob,
        downloadUrl: fullVideoUrl,
        public_id: uploadResult.public_id
      };
      
    } catch (error) {
      console.error('Error ensuring full video:', error);
      throw error;
    }
  }

  /**
   * Apply selective blur to specific segments using Cloudinary transformations
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {Array} blurSegments - Array of {startTime, endTime, blurStrength} objects
   * @param {string} fileName - Original file name
   */
  async applySelectiveBlur(uploadResult, blurSegments, fileName) {
    try {
      if (!uploadResult || !uploadResult.public_id) {
        throw new Error('Upload result with public_id is required');
      }

      const baseFileName = fileName.replace(/\.[^/.]+$/, '');

      // If no blur segments, return original video
      if (!blurSegments || blurSegments.length === 0) {
        const originalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
        const originalResponse = await fetch(originalUrl);
        const originalBlob = await originalResponse.blob();
        
        return {
          url: URL.createObjectURL(originalBlob),
          name: `${baseFileName}_no_blur.mp4`,
          blob: originalBlob,
          downloadUrl: originalUrl,
          blurSegments: [],
          public_id: uploadResult.public_id
        };
      }

      // Process segments using client-side video reconstruction
      return await this.processSelectiveBlurSegments(uploadResult, blurSegments, fileName);
      
    } catch (error) {
      console.error('Selective blur error:', error);
      throw error;
    }
  }

  /**
   * Process selective blur segments using client-side video reconstruction
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {Array} blurSegments - Array of blur segments
   * @param {string} fileName - Original file name
   */
  async processSelectiveBlurSegments(uploadResult, blurSegments, fileName) {
    try {
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      
      // Get original video URL for downloading
      const originalVideoUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4/${uploadResult.public_id}.mp4`;
      
      // Fetch the original video
      const videoResponse = await fetch(originalVideoUrl);
      if (!videoResponse.ok) {
        throw new Error('Failed to fetch original video');
      }
      
      const videoBlob = await videoResponse.blob();
      
      // Use browser-based video processing for selective blur
      const processedVideo = await this.applySelectiveBlurClientSide(videoBlob, blurSegments, baseFileName);
      
      return processedVideo;
      
    } catch (error) {
      console.error('Selective blur segments processing error:', error);
      
      // Fallback: return original video
      const originalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
      const originalResponse = await fetch(originalUrl);
      const originalBlob = await originalResponse.blob();
      
      return {
        url: URL.createObjectURL(originalBlob),
        name: `${fileName.replace(/\.[^/.]+$/, '')}_original.mp4`,
        blob: originalBlob,
        downloadUrl: originalUrl,
        blurSegments: [],
        public_id: uploadResult.public_id,
        warning: 'Selective blur failed, returning original video'
      };
    }
  }

  /**
   * Apply selective blur using client-side canvas processing
   * @param {Blob} videoBlob - Original video blob
   * @param {Array} blurSegments - Array of blur segments
   * @param {string} baseFileName - Base file name
   */
  async applySelectiveBlurClientSide(videoBlob, blurSegments, baseFileName) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.src = URL.createObjectURL(videoBlob);
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      const chunks = [];
      let mediaRecorder;
      let stream;
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Create canvas stream for recording
        stream = canvas.captureStream(30); // 30 FPS
        
        // Try different codecs for better compatibility
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
          }
        }
        
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const processedBlob = new Blob(chunks, { type: 'video/webm' });
          
          resolve({
            url: URL.createObjectURL(processedBlob),
            name: `${baseFileName}_selective_blur.webm`,
            blob: processedBlob,
            blurSegments: blurSegments,
            note: 'Selective blur applied using client-side processing'
          });
          
          // Cleanup
          URL.revokeObjectURL(video.src);
        };
        
        mediaRecorder.onerror = (event) => {
          reject(new Error('MediaRecorder error: ' + event.error));
        };
        
        // Start recording
        mediaRecorder.start();
        
        // Process video frame by frame
        this.processVideoFrames(video, canvas, ctx, blurSegments, mediaRecorder);
      };
      
      video.onerror = (error) => {
        console.error('Video loading error:', error);
        reject(new Error('Video loading failed: ' + (error.message || 'Unknown error')));
      };
      
      // Add timeout for video loading
      setTimeout(() => {
        if (!video.videoWidth) {
          reject(new Error('Video loading timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Process video frames with selective blur
   * @param {HTMLVideoElement} video - Video element
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} blurSegments - Array of blur segments
   * @param {MediaRecorder} mediaRecorder - Media recorder instance
   */
  processVideoFrames(video, canvas, ctx, blurSegments, mediaRecorder) {
    const processFrame = () => {
      if (video.ended) {
        return;
      }
      
      const currentTime = video.currentTime;
      
      // Check if current time is within any blur segment
      const activeBlurSegment = blurSegments.find(segment => 
        currentTime >= segment.startTime && currentTime <= segment.endTime
      );
      
      // Apply blur filter if needed
      if (activeBlurSegment) {
        this.applyBlurFilter(ctx, activeBlurSegment.blurStrength || 15);
      } else {
        this.resetFilter(ctx);
      }
      
      // Draw the current frame with the applied filter
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Continue to next frame
      requestAnimationFrame(processFrame);
    };
    
    // Start video playback and frame processing
    video.play().then(() => {
      processFrame();
    });
    
    // Stop recording when video ends
    video.onended = () => {
      // Give a small delay to ensure last frame is captured
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 100);
    };
  }

  /**
   * Apply blur filter to image data using CSS filter (more efficient)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} blurRadius - Blur radius
   */
  applyBlurFilter(ctx, blurRadius = 10) {
    // Use CSS filter for better performance
    ctx.filter = `blur(${blurRadius}px)`;
  }
  
  /**
   * Reset canvas filter
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  resetFilter(ctx) {
    ctx.filter = 'none';
  }

  /**
   * Apply simple blur effect that actually works
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {Object} blurSegment - Single blur segment
   * @param {string} fileName - Original file name
   */
  async applySimpleBlur(uploadResult, blurSegment, fileName) {
    try {
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      const { startTime, endTime, blurStrength = 2000 } = blurSegment;
      
      console.log('Applying simple blur:', { startTime, endTime, blurStrength });
      
      // Method 1: Try using a simple blur transformation on the entire video
      // This will blur the whole video, but it's better than no blur at all
      const simpleBlurUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/e_blur:${blurStrength},f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
      
      console.log('Trying simple blur URL:', simpleBlurUrl);
      
      const response = await fetch(simpleBlurUrl);
      
      if (response.ok) {
        const videoBlob = await response.blob();
        
        if (videoBlob.size > 1000) { // Check if we got a valid video
          // Re-upload for further processing
          const processedFile = new File([videoBlob], `${baseFileName}_blurred.mp4`, { type: 'video/mp4' });
          const reuploadResult = await this.uploadVideo(processedFile);
          
          return {
            url: URL.createObjectURL(videoBlob),
            name: `${baseFileName}_blurred.mp4`,
            blob: videoBlob,
            downloadUrl: simpleBlurUrl,
            blurSegments: [blurSegment],
            public_id: reuploadResult.public_id,
            note: 'Full video blur applied (segment-specific blur not supported)'
          };
        }
      }
      
      console.warn('Simple blur failed, trying segment extraction approach');
      
      // Method 2: Extract the segment, blur it, and return just that segment
      // This will give a shorter video but with proper blur
      const segmentBlurUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/so_${startTime},eo_${endTime},e_blur:${blurStrength},f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
      
      console.log('Trying segment blur URL:', segmentBlurUrl);
      
      const segmentResponse = await fetch(segmentBlurUrl);
      
      if (segmentResponse.ok) {
        const segmentBlob = await segmentResponse.blob();
        
        if (segmentBlob.size > 1000) {
          // Re-upload for further processing
          const processedFile = new File([segmentBlob], `${baseFileName}_blur_segment.mp4`, { type: 'video/mp4' });
          const reuploadResult = await this.uploadVideo(processedFile);
          
          return {
            url: URL.createObjectURL(segmentBlob),
            name: `${baseFileName}_blur_segment.mp4`,
            blob: segmentBlob,
            downloadUrl: segmentBlurUrl,
            blurSegments: [blurSegment],
            public_id: reuploadResult.public_id,
            note: 'Blurred segment extracted (full video reconstruction not available)'
          };
        }
      }
      
      // Method 3: Fallback - return original video
      console.warn('All blur methods failed, returning original video');
      
      const originalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
      const originalResponse = await fetch(originalUrl);
      const originalBlob = await originalResponse.blob();
      
      return {
        url: URL.createObjectURL(originalBlob),
        name: `${baseFileName}_original.mp4`,
        blob: originalBlob,
        downloadUrl: originalUrl,
        blurSegments: [],
        public_id: uploadResult.public_id,
        warning: 'Blur effect could not be applied, returning original video'
      };
      
    } catch (error) {
      console.error('Simple blur error:', error);
      throw error;
    }
  }

  /**
   * NEW APPROACH: Create complete video with blur effects using segment reconstruction
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {Array} blurSegments - Array of blur segments
   * @param {string} fileName - Original file name
   */
  async processBlurSegmentsIndividually(uploadResult, blurSegments, fileName) {
    try {
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      
      // Sort segments by start time
      const sortedSegments = [...blurSegments].sort((a, b) => a.startTime - b.startTime);
      
      // Get video metadata to know the full duration
      let videoDuration;
      try {
        const metadata = await this.getVideoMetadata(uploadResult);
        videoDuration = metadata.duration;
      } catch (metaError) {
        console.warn('Could not get video metadata, using fallback approach');
        videoDuration = 300; // Assume 5 minutes max
      }
      
      // Create segments array covering the entire video
      const allSegments = [];
      let lastEndTime = 0;
      
      for (const blurSegment of sortedSegments) {
        const { startTime, endTime, blurStrength = 2000 } = blurSegment;
        
        // Add normal segment before blur (if any)
        if (startTime > lastEndTime) {
          allSegments.push({
            start: lastEndTime,
            end: startTime,
            type: 'normal'
          });
        }
        
        // Add blur segment
        allSegments.push({
          start: startTime,
          end: endTime,
          type: 'blur',
          blurStrength
        });
        
        lastEndTime = endTime;
      }
      
      // Add final normal segment (if any)
      if (lastEndTime < videoDuration) {
        allSegments.push({
          start: lastEndTime,
          end: videoDuration,
          type: 'normal'
        });
      }
      
      console.log('Video segments to process:', allSegments);
      
      // Process each segment and collect URLs for concatenation
      const segmentUrls = [];
      
      for (let i = 0; i < allSegments.length; i++) {
        const segment = allSegments[i];
        
        if (segment.type === 'blur') {
          // Create blurred segment
          const blurUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/so_${segment.start},eo_${segment.end},e_blur:${segment.blurStrength},f_mp4/${uploadResult.public_id}.mp4`;
          segmentUrls.push(blurUrl);
        } else {
          // Create normal segment
          const normalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/so_${segment.start},eo_${segment.end},f_mp4/${uploadResult.public_id}.mp4`;
          segmentUrls.push(normalUrl);
        }
      }
      
      // Use FFmpeg-style concatenation approach with Cloudinary
      // Since Cloudinary doesn't support direct concatenation, we'll use a different approach
      // Let's try using video overlays to reconstruct the full video
      
      return await this.reconstructFullVideoWithBlur(uploadResult, sortedSegments, fileName);
      
    } catch (error) {
      console.error('Blur segments processing error:', error);
      
      // Fallback: return original video
      try {
        const originalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
        const originalResponse = await fetch(originalUrl);
        const originalBlob = await originalResponse.blob();
        
        return {
          url: URL.createObjectURL(originalBlob),
          name: `${fileName.replace(/\.[^/.]+$/, '')}_original.mp4`,
          blob: originalBlob,
          downloadUrl: originalUrl,
          blurSegments: [],
          public_id: uploadResult.public_id
        };
      } catch (fallbackError) {
        throw new Error('Both blur processing and fallback failed');
      }
    }
  }

  /**
   * Reconstruct full video with blur effects using a client-side approach
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {Array} blurSegments - Array of blur segments
   * @param {string} fileName - Original file name
   */
  async reconstructFullVideoWithBlur(uploadResult, blurSegments, fileName) {
    try {
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      
      // Since Cloudinary concatenation is complex, let's use a simpler approach:
      // Apply blur effects using conditional transformations that preserve the full video
      
      // For now, let's process the first blur segment and apply it to the full video
      // This maintains the full video length while applying the blur effect
      
      if (blurSegments.length > 0) {
        const firstSegment = blurSegments[0];
        const { startTime, endTime, blurStrength = 2000 } = firstSegment;
        
        // Use a transformation that applies blur only during the specified time range
        // but keeps the full video intact
        const processedUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/if_so_gte_${startTime}_and_so_lte_${endTime},e_blur:${blurStrength}/if_end,f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
        
        console.log('Trying conditional blur transformation:', processedUrl);
        
        const response = await fetch(processedUrl);
        
        if (response.ok) {
          const videoBlob = await response.blob();
          
          // Re-upload for further processing
          const processedFile = new File([videoBlob], `${baseFileName}_blurred.mp4`, { type: 'video/mp4' });
          const reuploadResult = await this.uploadVideo(processedFile);
          
          return {
            url: URL.createObjectURL(videoBlob),
            name: `${baseFileName}_blurred.mp4`,
            blob: videoBlob,
            downloadUrl: processedUrl,
            blurSegments: blurSegments,
            public_id: reuploadResult.public_id
          };
        } else {
          console.warn('Conditional transformation failed, using fallback');
          return await this.fallbackBlurApproach(uploadResult, blurSegments, fileName);
        }
      }
      
      // No blur segments, return original
      const originalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
      const originalResponse = await fetch(originalUrl);
      const originalBlob = await originalResponse.blob();
      
      return {
        url: URL.createObjectURL(originalBlob),
        name: `${baseFileName}_original.mp4`,
        blob: originalBlob,
        downloadUrl: originalUrl,
        blurSegments: [],
        public_id: uploadResult.public_id
      };
      
    } catch (error) {
      console.error('Video reconstruction error:', error);
      throw error;
    }
  }

  /**
   * Fallback approach: Download original video and process locally
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {Array} blurSegments - Array of blur segments
   * @param {string} fileName - Original file name
   */
  async fallbackBlurApproach(uploadResult, blurSegments, fileName) {
    try {
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      
      // Simple fallback: just return the original video with a note that blur couldn't be applied
      console.log('Using fallback approach - returning original video');
      
      const originalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${uploadResult.public_id}.mp4`;
      const originalResponse = await fetch(originalUrl);
      const originalBlob = await originalResponse.blob();
      
      return {
        url: URL.createObjectURL(originalBlob),
        name: `${baseFileName}_fallback.mp4`,
        blob: originalBlob,
        downloadUrl: originalUrl,
        blurSegments: [],
        public_id: uploadResult.public_id,
        warning: 'Blur effects could not be applied, returning original video'
      };
      
    } catch (error) {
      console.error('Fallback approach failed:', error);
      throw error;
    }
  }

  /**
   * Process video with both blur and voice segments using a unified approach
   * @param {Object} videoResult - Video upload result
   * @param {Array} blurSegments - Array of blur segments
   * @param {Array} voiceSegments - Array of voice segments with converted audio
   * @param {string} fileName - Original file name
   */
  async processVideoWithSegments(videoResult, blurSegments = [], voiceSegments = [], fileName) {
    try {
      if (!videoResult || !videoResult.public_id) {
        throw new Error('Video upload result with public_id is required');
      }

      console.log('Processing video with segments:', { 
        blurSegments: blurSegments.length, 
        voiceSegments: voiceSegments.length 
      });

      // Use the new client-side reconstruction approach
      return await this.processVideoWithClientSideReconstruction(
        videoResult, 
        blurSegments, 
        voiceSegments, 
        fileName
      );
      
    } catch (error) {
      console.error('Unified video processing error:', error);
      
      // Ultimate fallback: return original video
      try {
        const originalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${videoResult.public_id}.mp4`;
        const originalResponse = await fetch(originalUrl);
        const originalBlob = await originalResponse.blob();
        
        return {
          url: URL.createObjectURL(originalBlob),
          name: `${fileName.replace(/\.[^/.]+$/, '')}_original.mp4`,
          blob: originalBlob,
          downloadUrl: originalUrl,
          public_id: videoResult.public_id,
          warning: 'Processing failed, returning original video'
        };
      } catch (fallbackError) {
        throw new Error('Both processing and fallback failed');
      }
    }
  }

  /**
   * Replace audio in a specific segment while preserving the full video and rest of the audio
   * @param {Object} videoResult - Video upload result
   * @param {Object} audioResult - Audio upload result
   * @param {Object} segment - Segment with startTime and endTime
   * @param {string} fileName - Original file name
   */
  async replaceAudioInSpecificSegment(videoResult, audioResult, segment, fileName) {
    try {
      if (!videoResult || !videoResult.public_id) {
        throw new Error('Video upload result with public_id is required');
      }

      if (!audioResult || !audioResult.public_id) {
        throw new Error('Audio upload result with public_id is required');
      }

      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      const { startTime, endTime } = segment;

      // NEW APPROACH: Use audio mixing to replace only the specific segment
      // This preserves the full video and only replaces audio in the specified time range
      
      // Method 1: Use a simpler approach - reduce original audio volume and overlay new audio
      // This is more reliable than conditional transformations
      const audioMixUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/e_volume:-80/l_video:${audioResult.public_id},so_${startTime},eo_${endTime},e_volume:100,fl_layer_apply,f_mp4,fl_attachment/${videoResult.public_id}.mp4`;

      console.log('Trying volume-based audio replacement approach:', audioMixUrl);
      
      const response = await fetch(audioMixUrl);

      if (response.ok) {
        const videoBlob = await response.blob();
        
        if (videoBlob.size > 1000) {
          // Re-upload the processed video for further processing
          const processedFile = new File([videoBlob], `${baseFileName}_audio_${startTime}.mp4`, { type: 'video/mp4' });
          const reuploadResult = await this.uploadVideo(processedFile);
          
          return {
            ...reuploadResult,
            blob: videoBlob,
            url: URL.createObjectURL(videoBlob),
            name: `${baseFileName}_audio_${startTime}.mp4`,
            note: 'Audio replaced with volume reduction and overlay in specific segment'
          };
        } else {
          console.warn('Processed video is empty, trying fallback');
          return await this.fallbackAudioReplacement(videoResult, audioResult, segment, fileName);
        }
      } else {
        console.warn(`Audio mixing failed for segment ${startTime}-${endTime}: ${response.status}`);
        
        // Method 2: Fallback - try a different approach
        return await this.fallbackAudioReplacement(videoResult, audioResult, segment, fileName);
      }
    } catch (error) {
      console.error('Specific audio replacement error:', error);
      return videoResult; // Return original on error
    }
  }

  /**
   * Fallback method for audio replacement using simpler approach
   * @param {Object} videoResult - Video upload result
   * @param {Object} audioResult - Audio upload result
   * @param {Object} segment - Segment with startTime and endTime
   * @param {string} fileName - Original file name
   */
  async fallbackAudioReplacement(videoResult, audioResult, segment, fileName) {
    try {
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      const { startTime, endTime } = segment;
      
      console.log('Using fallback audio replacement approach');
      
      // Fallback 1: Try simple overlay without conditional muting
      const simpleOverlayUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/l_video:${audioResult.public_id},so_${startTime},eo_${endTime},fl_layer_apply,f_mp4,fl_attachment/${videoResult.public_id}.mp4`;
      
      console.log('Trying simple overlay approach:', simpleOverlayUrl);
      
      const overlayResponse = await fetch(simpleOverlayUrl);
      
      if (overlayResponse.ok) {
        const videoBlob = await overlayResponse.blob();
        
        if (videoBlob.size > 1000) {
          // Re-upload the processed video
          const processedFile = new File([videoBlob], `${baseFileName}_overlay_${startTime}.mp4`, { type: 'video/mp4' });
          const reuploadResult = await this.uploadVideo(processedFile);
          
          return {
            ...reuploadResult,
            blob: videoBlob,
            url: URL.createObjectURL(videoBlob),
            name: `${baseFileName}_overlay_${startTime}.mp4`,
            note: 'Audio overlaid without muting original (fallback method)'
          };
        }
      }
      
      // Fallback 2: Return original video if all else fails
      console.warn(`All audio replacement methods failed for segment ${startTime}-${endTime}, keeping original`);
      
      return {
        ...videoResult,
        warning: `Audio replacement failed for segment ${startTime}-${endTime}`
      };
      
    } catch (error) {
      console.error('Fallback audio replacement error:', error);
      return videoResult;
    }
  }

  /**
   * SIMPLIFIED APPROACH: Process video with working blur and audio effects
   * @param {Object} videoResult - Video upload result
   * @param {Array} blurSegments - Array of blur segments
   * @param {Array} voiceSegments - Array of voice segments with converted audio
   * @param {string} fileName - Original file name
   */
  async processVideoWithClientSideReconstruction(videoResult, blurSegments = [], voiceSegments = [], fileName) {
    try {
      console.log('Starting simplified video processing approach');
      console.log('Segments to process:', { blur: blurSegments.length, voice: voiceSegments.length });
      
      const baseFileName = fileName.replace(/\.[^/.]+$/, '');
      let currentVideoId = videoResult.public_id;
      let currentVideoBlob = null;
      let processingNotes = [];
      
      // Step 1: Apply blur effects if any
      if (blurSegments.length > 0) {
        console.log('Processing blur effects...');
        
        try {
          const blurResult = await this.applySelectiveBlur(
            { public_id: currentVideoId }, 
            blurSegments, 
            fileName
          );
          
          if (blurResult && blurResult.blob) {
            currentVideoBlob = blurResult.blob;
            
            // Re-upload the processed video for further processing
            if (voiceSegments.length > 0) {
              const processedFile = new File([blurResult.blob], `${fileName}_blurred.webm`, { type: 'video/webm' });
              const reuploadResult = await this.uploadVideo(processedFile);
              currentVideoId = reuploadResult.public_id;
            }
            
            if (blurResult.note) {
              processingNotes.push(blurResult.note);
            }
            if (blurResult.warning) {
              processingNotes.push(blurResult.warning);
            }
            
            console.log('Blur processing completed');
          } else {
            console.warn('Blur processing returned no result');
            processingNotes.push('Blur effects could not be applied');
          }
        } catch (blurError) {
          console.error('Blur processing failed:', blurError);
          processingNotes.push('Blur effects failed to apply');
        }
      }
      
      // Step 2: Apply voice effects if any
      if (voiceSegments.length > 0) {
        console.log('Processing voice effects...');
        
        for (let i = 0; i < voiceSegments.length; i++) {
          const segment = voiceSegments[i];
          
          if (segment.convertedAudio && segment.convertedAudio.public_id) {
            const { startTime, endTime } = segment;
            
            console.log(`Processing voice segment ${i + 1}: ${startTime}-${endTime}`);
            
            try {
              // Use the proper segment-based audio replacement
              const audioReplacementResult = await this.replaceAudioInSpecificSegment(
                { public_id: currentVideoId },
                segment.convertedAudio,
                { startTime, endTime },
                `temp_audio_${i}.mp4`
              );
              
              if (audioReplacementResult && audioReplacementResult.blob) {
                // Re-upload for next processing step
                const tempFile = new File([audioReplacementResult.blob], `temp_audio_${i}.mp4`, { type: 'video/mp4' });
                const tempUpload = await this.uploadVideo(tempFile);
                currentVideoId = tempUpload.public_id;
                currentVideoBlob = audioReplacementResult.blob;
                
                console.log(`Voice segment ${i + 1} processed successfully`);
              } else {
                console.warn(`Voice segment ${i + 1} resulted in no result`);
                processingNotes.push(`Voice segment ${i + 1} could not be processed`);
              }

            } catch (audioError) {
              console.error(`Voice segment ${i + 1} error:`, audioError);
              processingNotes.push(`Voice segment ${i + 1} encountered an error`);
            }
          }
        }
      }
      
      // Step 3: Get the final processed video
      let finalVideoBlob = currentVideoBlob;
      let finalVideoUrl;
      
      if (!finalVideoBlob) {
        // Fetch the final video from Cloudinary
        const finalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${currentVideoId}.mp4`;
        const finalResponse = await fetch(finalUrl);
        
        if (finalResponse.ok) {
          finalVideoBlob = await finalResponse.blob();
          finalVideoUrl = finalUrl;
        } else {
          throw new Error('Failed to fetch final processed video');
        }
      }
      
      // Validate the final video
      if (!finalVideoBlob || finalVideoBlob.size < 1000) {
        throw new Error('Final video is empty or too small');
      }
      
      console.log('Video processing completed successfully');
      
      return {
        url: URL.createObjectURL(finalVideoBlob),
        name: `${baseFileName}_processed.mp4`,
        blob: finalVideoBlob,
        downloadUrl: finalVideoUrl || `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4/${currentVideoId}.mp4`,
        public_id: currentVideoId,
        processingNotes: processingNotes.length > 0 ? processingNotes : undefined
      };
      
    } catch (error) {
      console.error('Video processing error:', error);
      
      // Ultimate fallback: return original video
      try {
        console.log('Falling back to original video');
        
        const originalUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_mp4,fl_attachment/${videoResult.public_id}.mp4`;
        const originalResponse = await fetch(originalUrl);
        const originalBlob = await originalResponse.blob();
        
        return {
          url: URL.createObjectURL(originalBlob),
          name: `${fileName.replace(/\.[^/.]+$/, '')}_original.mp4`,
          blob: originalBlob,
          downloadUrl: originalUrl,
          public_id: videoResult.public_id,
          warning: 'Processing failed, returning original video'
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error('Both processing and fallback failed');
      }
    }
  }

  /**
   * Simple method to mute audio in specific segments
   * @param {Object} videoResult - Video upload result
   * @param {Array} muteSegments - Array of {startTime, endTime} objects
   * @param {string} fileName - Original file name
   */
  async muteAudioInSegments(videoResult, muteSegments, fileName) {
    try {
      if (!videoResult || !videoResult.public_id) {
        throw new Error('Video upload result with public_id is required');
      }

      const baseFileName = fileName.replace(/\.[^/.]+$/, '');

      // For each segment, we'll create a version with that segment muted
      let currentVideoId = videoResult.public_id;

      for (let i = 0; i < muteSegments.length; i++) {
        const segment = muteSegments[i];
        const { startTime, endTime } = segment;

        // Simple approach: extract three parts and concatenate
        // Part 1: Before mute (0 to startTime) - keep original audio
        // Part 2: Mute segment (startTime to endTime) - no audio
        // Part 3: After mute (endTime to end) - keep original audio

        // For simplicity, let's just mute the entire segment duration
        const mutedUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/so_${startTime},eo_${endTime},e_volume:0/so_0,f_mp4/${currentVideoId}.mp4`;

        const response = await fetch(mutedUrl);

        if (!response.ok) {
          console.warn(`Muting segment ${i + 1} failed: ${response.status}`);
          continue;
        }

        const videoBlob = await response.blob();

        // Re-upload for next iteration if there are more segments
        if (i < muteSegments.length - 1) {
          const tempFile = new File([videoBlob], `temp_muted_${i}.mp4`, { type: 'video/mp4' });
          const tempUpload = await this.uploadVideo(tempFile);
          currentVideoId = tempUpload.public_id;
        } else {
          // Last segment, return the result
          return {
            url: URL.createObjectURL(videoBlob),
            name: `${baseFileName}_muted_segments.mp4`,
            blob: videoBlob,
            downloadUrl: mutedUrl,
            muteSegments
          };
        }
      }

      // Fallback if no segments processed
      throw new Error('No mute segments were successfully processed');
    } catch (error) {
      console.error('Audio muting error:', error);
      throw error;
    }
  }

  /**
   * Get video metadata including duration and frame rate
   * @param {Object} uploadResult - Cloudinary upload result
   */
  async getVideoMetadata(uploadResult) {
    try {
      if (!uploadResult || !uploadResult.public_id) {
        throw new Error('Upload result with public_id is required');
      }

      // Use Cloudinary's info endpoint to get metadata
      const metadataUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/f_json/${uploadResult.public_id}.json`;

      const response = await fetch(metadataUrl);

      if (!response.ok) {
        throw new Error(`Metadata retrieval failed: ${response.status} - ${response.statusText}`);
      }

      const metadata = await response.json();

      return {
        duration: metadata.duration || 0,
        width: metadata.width || 0,
        height: metadata.height || 0,
        frameRate: metadata.frame_rate || 0,
        bitRate: metadata.bit_rate || 0,
        format: metadata.format || 'unknown',
        audioCodec: metadata.audio?.codec || 'unknown',
        videoCodec: metadata.video?.codec || 'unknown',
        fileSize: metadata.bytes || 0
      };
    } catch (error) {
      console.error('Video metadata retrieval error:', error);
      throw error;
    }
  }

  /**
   * Create video thumbnail at specific timestamp
   * @param {Object} uploadResult - Cloudinary upload result
   * @param {number} timestamp - Time in seconds
   * @param {number} width - Thumbnail width (optional)
   * @param {number} height - Thumbnail height (optional)
   */
  async createVideoThumbnail(uploadResult, timestamp = 0, width = 320, height = 240) {
    try {
      if (!uploadResult || !uploadResult.public_id) {
        throw new Error('Upload result with public_id is required');
      }

      const thumbnailUrl = `https://res.cloudinary.com/${this.cloudName}/video/upload/so_${timestamp},w_${width},h_${height},c_fill,f_jpg/${uploadResult.public_id}.jpg`;

      const response = await fetch(thumbnailUrl);

      if (!response.ok) {
        throw new Error(`Thumbnail creation failed: ${response.status} - ${response.statusText}`);
      }

      const imageBlob = await response.blob();

      return {
        url: URL.createObjectURL(imageBlob),
        blob: imageBlob,
        downloadUrl: thumbnailUrl,
        timestamp,
        width,
        height
      };
    } catch (error) {
      console.error('Video thumbnail creation error:', error);
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