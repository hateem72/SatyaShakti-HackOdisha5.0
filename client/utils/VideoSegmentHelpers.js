/**
 * Video segment management utilities for Anonymous Editor
 */

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Create a new segment with validation
 * @param {number} start - Start time in seconds
 * @param {number} end - End time in seconds
 * @param {number} videoDuration - Total video duration
 * @param {string} type - Segment type ('blur' or 'voice')
 * @returns {Object} New segment object
 */
export const createSegment = (start, end, videoDuration, type = 'voice') => {
    // Ensure valid times
    const validStart = Math.max(0, Math.min(start, videoDuration));
    const validEnd = Math.max(validStart + 0.5, Math.min(end, videoDuration));
    
    const segment = {
        start: parseFloat(validStart.toFixed(1)),
        end: parseFloat(validEnd.toFixed(1)),
        id: Date.now() + Math.random()
    };

    // Add blur-specific properties
    if (type === 'blur') {
        segment.blurStrength = 15; // Default blur strength
    }

    return segment;
};

/**
 * Validate segment duration
 * @param {number} start - Start time
 * @param {number} end - End time
 * @param {number} minDuration - Minimum duration (default 0.5 seconds)
 * @returns {boolean} Whether segment is valid
 */
export const isValidSegment = (start, end, minDuration = 0.5) => {
    return (end - start) >= minDuration;
};

/**
 * Update segment time with validation
 * @param {Array} segments - Current segments array
 * @param {string} segmentId - ID of segment to update
 * @param {string} field - Field to update ('start' or 'end')
 * @param {number} value - New value
 * @param {number} videoDuration - Total video duration
 * @returns {Array} Updated segments array
 */
export const updateSegmentTime = (segments, segmentId, field, value, videoDuration) => {
    return segments.map(seg => {
        if (seg.id === segmentId) {
            const newSeg = { ...seg, [field]: parseFloat(value) };
            
            // Ensure start < end and within bounds
            if (field === 'start' && newSeg.start >= newSeg.end) {
                newSeg.end = Math.min(newSeg.start + 1, videoDuration);
            }
            if (field === 'end' && newSeg.end <= newSeg.start) {
                newSeg.start = Math.max(newSeg.end - 1, 0);
            }
            
            // Ensure within video bounds
            newSeg.start = Math.max(0, Math.min(newSeg.start, videoDuration));
            newSeg.end = Math.max(0, Math.min(newSeg.end, videoDuration));
            
            return newSeg;
        }
        return seg;
    });
};

/**
 * Update blur strength for a segment
 * @param {Array} segments - Current segments array
 * @param {string} segmentId - ID of segment to update
 * @param {number} blurStrength - New blur strength value
 * @returns {Array} Updated segments array
 */
export const updateSegmentBlurStrength = (segments, segmentId, blurStrength) => {
    return segments.map(seg => 
        seg.id === segmentId ? { ...seg, blurStrength } : seg
    );
};

/**
 * Remove segment by ID
 * @param {Array} segments - Current segments array
 * @param {string} segmentId - ID of segment to remove
 * @returns {Array} Updated segments array
 */
export const removeSegment = (segments, segmentId) => {
    return segments.filter(seg => seg.id !== segmentId);
};

/**
 * Calculate timeline position from mouse event
 * @param {MouseEvent} event - Mouse event
 * @param {HTMLElement} timeline - Timeline element
 * @param {number} videoDuration - Total video duration
 * @returns {number} Time position in seconds
 */
export const calculateTimelinePosition = (event, timeline, videoDuration) => {
    const rect = timeline.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    return Math.max(0, Math.min((x / rect.width) * videoDuration, videoDuration));
};

/**
 * Create segment from drag operation
 * @param {number} startTime - Drag start time
 * @param {number} endTime - Drag end time
 * @param {string} type - Segment type ('blur' or 'voice')
 * @param {number} minDuration - Minimum segment duration
 * @returns {Object|null} New segment or null if invalid
 */
export const createSegmentFromDrag = (startTime, endTime, type, minDuration = 0.5) => {
    const start = Math.min(startTime, endTime);
    const end = Math.max(startTime, endTime);
    
    if (!isValidSegment(start, end, minDuration)) {
        return null;
    }
    
    return createSegment(start, end, end, type);
};

/**
 * Check if video duration exceeds warning threshold
 * @param {number} duration - Video duration in seconds
 * @param {number} threshold - Warning threshold in seconds (default 60)
 * @returns {boolean} Whether warning should be shown
 */
export const shouldShowLengthWarning = (duration, threshold = 60) => {
    return duration > threshold;
};

/**
 * Generate quick segment at current time
 * @param {number} currentTime - Current video time
 * @param {number} videoDuration - Total video duration
 * @param {number} segmentLength - Default segment length (default 5 seconds)
 * @param {string} type - Segment type
 * @returns {Object} New segment object
 */
export const createQuickSegment = (currentTime, videoDuration, segmentLength = 5, type = 'voice') => {
    const start = currentTime;
    const end = Math.min(start + segmentLength, videoDuration);
    
    if (start >= end) {
        throw new Error('Cannot create segment at the end of video');
    }
    
    return createSegment(start, end, videoDuration, type);
};