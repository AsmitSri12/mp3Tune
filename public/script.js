document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('convert-form');
    const urlInput = document.getElementById('youtube-url');
    const submitBtn = document.getElementById('convert-btn');
    
    const statusArea = document.getElementById('status-area');
    const loader = document.getElementById('loader');
    const errorContainer = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const successArea = document.getElementById('success-area');
    const videoTitle = document.getElementById('video-title');
    const downloadLink = document.getElementById('download-link');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        if (!url) return;

        // Reset UI
        statusArea.classList.remove('hidden');
        loader.classList.remove('hidden');
        errorContainer.classList.add('hidden');
        successArea.classList.add('hidden');
        
        submitBtn.disabled = true;
        urlInput.disabled = true;

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Conversion failed. Please try again.');
            }

            // Show success
            loader.classList.add('hidden');
            successArea.classList.remove('hidden');
            
            videoTitle.textContent = data.title || 'Your audio file is ready';
            downloadLink.href = `/api/download/${data.fileId}?title=${encodeURIComponent(data.title || 'audio')}`;
            
            // Clear input
            urlInput.value = '';

        } catch (error) {
            // Show error
            loader.classList.add('hidden');
            errorContainer.classList.remove('hidden');
            errorText.textContent = error.message;
        } finally {
            submitBtn.disabled = false;
            urlInput.disabled = false;
            urlInput.focus();
        }
    });
});
