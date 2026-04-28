const play = require('play-dl');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

async function test() {
    try {
        console.log('Fetching info...');
        const info = await play.video_info('https://www.youtube.com/watch?v=jNQXAC9IVRw');
        console.log('Title:', info.video_details.title);
        
        // Let's get the highest quality audio stream available
        const stream = await play.stream_from_info(info);
        
        console.log('Streaming to ffmpeg...');
        ffmpeg(stream.stream)
            .audioBitrate(128)
            .save('output.mp3')
            .on('end', () => console.log('Done!'))
            .on('error', (err) => console.error('FFmpeg error:', err));
    } catch(err) {
        console.error('Error:', err.message);
    }
}
test();
