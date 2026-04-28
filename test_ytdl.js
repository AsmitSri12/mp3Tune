const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

async function test() {
    try {
        console.log('Fetching info...');
        const info = await ytdl.getInfo('https://www.youtube.com/watch?v=jNQXAC9IVRw');
        console.log('Title:', info.videoDetails.title);
        
        const stream = ytdl('https://www.youtube.com/watch?v=jNQXAC9IVRw', { quality: 'highestaudio' });
        
        console.log('Streaming to ffmpeg...');
        ffmpeg(stream)
            .audioBitrate(128)
            .save('output.mp3')
            .on('end', () => console.log('Done!'))
            .on('error', (err) => console.error('FFmpeg error:', err));
    } catch(err) {
        console.error('Error:', err.message);
    }
}
test();
