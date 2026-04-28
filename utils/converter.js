const youtubedl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Ensure ffmpeg has execute permissions on cloud environments like Render
try {
    fs.chmodSync(ffmpegPath, 0o777);
} catch (e) {
    console.log('Could not change ffmpeg permissions:', e.message);
}

// Common yt-dlp flags to bypass bot protection on cloud servers
const baseOptions = {
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    forceIpv4: true,
    addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    ]
};

async function convertToMp3(url, tempDir) {
    const fileId = uuidv4();
    const finalFile = path.join(tempDir, `${fileId}.mp3`);
    const downloadTemplate = path.join(tempDir, `${fileId}.%(ext)s`);

    try {
        // 1. Get info to check duration
        const info = await youtubedl(url, {
            dumpJson: true,
            ...baseOptions
        });

        // 2. Limit duration (10 minutes = 600 seconds)
        const MAX_DURATION = 600;
        if (info.duration > MAX_DURATION) {
            throw new Error(`Video exceeds maximum duration of ${MAX_DURATION / 60} minutes.`);
        }

        // 3. Download and extract audio as MP3
        // We use yt-dlp's built-in extraction, pointing it to ffmpeg-static
        await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            ffmpegLocation: ffmpegPath,
            output: downloadTemplate,
            ...baseOptions
        });

        // The file is saved as <fileId>.mp3 because of --audio-format mp3
        
        // Double check if file exists
        if (!fs.existsSync(finalFile)) {
            throw new Error('Failed to create MP3 file. The file might be blocked or conversion failed.');
        }

        return { fileId, title: info.title };
    } catch (error) {
        console.error('youtube-dl-exec error:', error);
        // Clean up any partial files if they exist
        if (fs.existsSync(finalFile)) {
            fs.unlinkSync(finalFile);
        }
        
        // Provide a clearer error message
        let errorMessage = error.message || 'Conversion failed.';
        if (errorMessage.includes('HTTP Error 403') || errorMessage.includes('Sign in to confirm')) {
             errorMessage = 'YouTube blocked the request. Please try again later or try a different video.';
        }
        
        throw new Error(errorMessage);
    }
}

module.exports = { convertToMp3 };
