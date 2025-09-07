
export const createSegmentFromDrag = (startTime, endTime, type, minDuration = 0.5) => {
    const start = Math.min(startTime, endTime);
    const end = Math.max(startTime, endTime);
    
    if (!isValidSegment(start, end, minDuration)) {
        return null;
    }
    
    return createSegment(start, end, end, type);
};



export const createQuickSegment = (currentTime, videoDuration, segmentLength = 5, type = 'voice') => {
    const start = currentTime;
    const end = Math.min(start + segmentLength, videoDuration);
    
    if (start >= end) {
        throw new Error('Cannot create segment at the end of video');
    }
    
    return createSegment(start, end, videoDuration, type);
};