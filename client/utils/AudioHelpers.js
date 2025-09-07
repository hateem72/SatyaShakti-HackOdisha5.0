export const createAudioUrl = (file) => {
    return URL.createObjectURL(file);
  };
  
  export const revokeAudioUrl = (url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };
  
  export const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };
  
  export const isAudioFile = (file) => {
    return file && file.type.startsWith('audio/');
  };

export const isVideoFile = (file) => {
  return file && file.type.startsWith('video/');
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

export const formatDuration = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const extractAudioFromVideo = async (videoFile, onProgress = () => {}) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.muted = true;
    
    video.onloadedmetadata = async () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        
        source.connect(destination);
        
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          resolve({
            blob: audioBlob,
            url: audioUrl,
            name: videoFile.name.replace(/\.[^/.]+$/, '.webm'),
            duration: video.duration
          });
          
          URL.revokeObjectURL(videoUrl);
          audioContext.close();
        };
        
        mediaRecorder.onerror = (error) => {
          reject(error);
          URL.revokeObjectURL(videoUrl);
          audioContext.close();
        };
        
        video.ontimeupdate = () => {
          if (video.duration) {
            const progress = (video.currentTime / video.duration) * 100;
            onProgress(progress);
          }
        };
        
        video.onended = () => {
          mediaRecorder.stop();
        };
        
        mediaRecorder.start();
        video.play();
        
      } catch (error) {
        reject(error);
        URL.revokeObjectURL(videoUrl);
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video file'));
      URL.revokeObjectURL(videoUrl);
    };
  });
};