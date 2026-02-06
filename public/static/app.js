// Check if gif.js is loaded
console.log('GIF.js loaded:', typeof GIF !== 'undefined');

// State
let frames = [];
let draggedIndex = null;
let conversionMode = 'image-to-gif'; // Default mode

// DOM Elements
const modeRadios = document.querySelectorAll('.mode-radio');
const uploadTitle = document.getElementById('uploadTitle');
const dropZoneText = document.getElementById('dropZoneText');
const dropZoneSubtext = document.getElementById('dropZoneSubtext');
const generateBtnText = document.getElementById('generateBtnText');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const framesSection = document.getElementById('framesSection');
const framesList = document.getElementById('framesList');
const frameCount = document.getElementById('frameCount');
const clearFramesBtn = document.getElementById('clearFramesBtn');
const settingsSection = document.getElementById('settingsSection');
const generateSection = document.getElementById('generateSection');
const generateBtn = document.getElementById('generateBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const resultGif = document.getElementById('resultGif');
const resultVideo = document.getElementById('resultVideo');
const downloadBtn = document.getElementById('downloadBtn');
const convertToVideoBtn = document.getElementById('convertToVideoBtn');
const downloadVideoBtn = document.getElementById('downloadVideoBtn');
const resetBtn = document.getElementById('resetBtn');
const fileSize = document.getElementById('fileSize');
const conversionProgress = document.getElementById('conversionProgress');
const conversionText = document.getElementById('conversionText');

// Settings
const frameSpeedInput = document.getElementById('frameSpeed');
const speedDisplay = document.getElementById('speedDisplay');
const speedDirectInput = document.getElementById('speedDirectInput');
const frameDelayInput = document.getElementById('frameDelay');
const loopCountInput = document.getElementById('loopCount');
const gifSizePreset = document.getElementById('gifSizePreset');
const gifWidthInput = document.getElementById('gifWidth');
const qualitySlider = document.getElementById('qualitySlider');
const qualityDisplay = document.getElementById('qualityDisplay');
const gifQualityInput = document.getElementById('gifQuality');
const enableCrossfadeInput = document.getElementById('enableCrossfade');
const crossfadeFramesInput = document.getElementById('crossfadeFrames');
const crossfadeSettings = document.getElementById('crossfadeSettings');

// Event Listeners
// Mode selection
modeRadios.forEach(radio => {
    radio.addEventListener('change', handleModeChange);
});

selectFilesBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);

clearFramesBtn.addEventListener('click', clearFrames);
generateBtn.addEventListener('click', handleGenerate);
downloadBtn.addEventListener('click', downloadGIF);
convertToVideoBtn.addEventListener('click', convertToVideo);
downloadVideoBtn.addEventListener('click', downloadVideo);
resetBtn.addEventListener('click', reset);

// Crossfade toggle
enableCrossfadeInput.addEventListener('change', (e) => {
    if (e.target.checked) {
        crossfadeSettings.classList.remove('hidden');
    } else {
        crossfadeSettings.classList.add('hidden');
    }
});

// Update crossfade value display
const crossfadeValue = document.getElementById('crossfadeValue');
crossfadeFramesInput.addEventListener('input', (e) => {
    crossfadeValue.textContent = e.target.value;
});

// Frame speed converter
function updateFrameSpeed(fromDirect = false) {
    let delayMs;
    let displayText;
    
    if (fromDirect) {
        // Update from direct input (seconds)
        const seconds = parseFloat(speedDirectInput.value);
        delayMs = Math.round(seconds * 1000);
        
        // Update slider position
        if (delayMs <= 1000) {
            frameSpeedInput.value = Math.round(delayMs / 100);
        } else {
            frameSpeedInput.value = 10 + Math.round((delayMs - 1000) / 200);
        }
    } else {
        // Update from slider
        const speed = parseInt(frameSpeedInput.value);
        
        if (speed <= 10) {
            // 1-10: 100ms to 1000ms (linear)
            delayMs = speed * 100;
        } else {
            // 11-20: 1200ms to 3000ms
            delayMs = 1000 + ((speed - 10) * 200);
        }
        
        // Update direct input
        speedDirectInput.value = (delayMs / 1000).toFixed(1);
    }
    
    frameDelayInput.value = delayMs;
    
    // Display text
    const seconds = (delayMs / 1000).toFixed(1);
    const speed = parseInt(frameSpeedInput.value);
    
    if (speed <= 3) {
        displayText = `매우 빠름 (${seconds}초)`;
    } else if (speed <= 6) {
        displayText = `빠름 (${seconds}초)`;
    } else if (speed <= 10) {
        displayText = `보통 (${seconds}초)`;
    } else if (speed <= 15) {
        displayText = `느림 (${seconds}초)`;
    } else {
        displayText = `매우 느림 (${seconds}초)`;
    }
    
    speedDisplay.textContent = displayText;
}

// Initialize speed display
updateFrameSpeed();

// Update on slider change
frameSpeedInput.addEventListener('input', () => updateFrameSpeed(false));

// Update on direct input change
speedDirectInput.addEventListener('input', () => updateFrameSpeed(true));

// GIF size preset handler
gifSizePreset.addEventListener('change', (e) => {
    const value = e.target.value;
    if (value === 'custom') {
        gifWidthInput.classList.remove('hidden');
    } else {
        gifWidthInput.classList.add('hidden');
        gifWidthInput.value = value;
    }
});

// Quality slider handler
function updateQuality() {
    const quality = parseInt(qualitySlider.value);
    gifQualityInput.value = quality;
    
    let displayText;
    if (quality <= 5) {
        displayText = '최고 품질 (느림)';
    } else if (quality <= 10) {
        displayText = '고품질 (권장)';
    } else if (quality <= 15) {
        displayText = '보통 품질';
    } else if (quality <= 20) {
        displayText = '빠른 생성';
    } else {
        displayText = '매우 빠름 (낮은 품질)';
    }
    
    qualityDisplay.textContent = displayText;
}

// Initialize quality display
updateQuality();

// Update on slider change
qualitySlider.addEventListener('input', updateQuality);

// Mode handling
function handleModeChange(e) {
    conversionMode = e.target.value;
    
    // Update UI based on mode
    if (conversionMode === 'image-to-gif') {
        uploadTitle.textContent = '이미지 업로드';
        dropZoneText.textContent = '여러 이미지를 드래그 앤 드롭하거나 클릭하여 선택';
        dropZoneSubtext.textContent = 'JPG, PNG 파일 지원';
        generateBtnText.textContent = 'GIF 생성하기';
        fileInput.setAttribute('accept', 'image/*');
        fileInput.setAttribute('multiple', 'multiple');
    } else if (conversionMode === 'image-to-video') {
        uploadTitle.textContent = '이미지 업로드';
        dropZoneText.textContent = '여러 이미지를 드래그 앤 드롭하거나 클릭하여 선택';
        dropZoneSubtext.textContent = 'JPG, PNG 파일 지원';
        generateBtnText.textContent = '동영상 생성하기';
        fileInput.setAttribute('accept', 'image/*');
        fileInput.setAttribute('multiple', 'multiple');
    } else if (conversionMode === 'gif-to-video') {
        uploadTitle.textContent = 'GIF 파일 업로드';
        dropZoneText.textContent = 'GIF 파일을 드래그 앤 드롭하거나 클릭하여 선택';
        dropZoneSubtext.textContent = 'GIF 파일만 지원 (자동으로 동영상 변환)';
        generateBtnText.textContent = 'GIF → 동영상 변환';
        fileInput.setAttribute('accept', 'image/gif');
        fileInput.removeAttribute('multiple');
    }
    
    // Reset state
    frames = [];
    updateFramesList();
    resultSection.classList.add('hidden');
}

// File handling
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    
    if (conversionMode === 'gif-to-video') {
        handleGifToVideo(files[0]);
    } else {
        addFiles(files);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
    );

    if (conversionMode === 'gif-to-video') {
        handleGifToVideo(files[0]);
    } else {
        addFiles(files);
    }
}

function addFiles(files) {
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                frames.push({
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    image: img,
                    delay: 500
                });
                updateFramesList();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function updateFramesList() {
    frameCount.textContent = `(${frames.length}개)`;
    
    if (frames.length > 0) {
        framesSection.classList.remove('hidden');
        settingsSection.classList.remove('hidden');
        generateSection.classList.remove('hidden');
    } else {
        framesSection.classList.add('hidden');
        settingsSection.classList.add('hidden');
        generateSection.classList.add('hidden');
    }
    
    framesList.innerHTML = frames.map((frame, index) => `
        <div class="frame-item bg-white border-2 border-gray-300 rounded-lg p-2 cursor-move hover:border-purple-400 transition-all" 
             draggable="true" 
             data-index="${index}"
             title="드래그하여 순서 변경">
            <div class="relative">
                <div class="absolute top-1 left-1 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    ${index + 1}
                </div>
                <div class="absolute top-1 right-1 bg-gray-800 bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    <i class="fas fa-grip-vertical"></i>
                </div>
            </div>
            <img src="${frame.src}" alt="Frame ${index + 1}" class="w-full h-32 object-cover rounded mb-2">
            <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-gray-500">
                    <i class="fas fa-arrows-alt mr-1"></i>
                    드래그로 이동
                </span>
                <button class="text-red-600 hover:text-red-800 transition" onclick="removeFrame(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Add drag and drop functionality to frames
    const frameItems = document.querySelectorAll('.frame-item');
    frameItems.forEach(item => {
        item.addEventListener('dragstart', handleFrameDragStart);
        item.addEventListener('dragover', handleFrameDragOver);
        item.addEventListener('dragleave', handleFrameDragLeave);
        item.addEventListener('drop', handleFrameDrop);
        item.addEventListener('dragend', handleFrameDragEnd);
    });
}

function removeFrame(index) {
    frames.splice(index, 1);
    updateFramesList();
}

function clearFrames() {
    if (confirm('모든 프레임을 삭제하시겠습니까?')) {
        frames = [];
        updateFramesList();
    }
}

// Frame drag and drop
function handleFrameDragStart(e) {
    draggedIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.add('dragging');
    e.currentTarget.style.opacity = '0.5';
}

function handleFrameDragOver(e) {
    e.preventDefault();
    const targetItem = e.currentTarget;
    if (targetItem.classList.contains('frame-item') && !targetItem.classList.contains('dragging')) {
        targetItem.classList.add('drag-over');
        targetItem.style.borderColor = '#9333ea';
        targetItem.style.transform = 'scale(1.05)';
    }
}

function handleFrameDragLeave(e) {
    const targetItem = e.currentTarget;
    targetItem.classList.remove('drag-over');
    targetItem.style.borderColor = '';
    targetItem.style.transform = '';
}

function handleFrameDrop(e) {
    e.preventDefault();
    const targetItem = e.currentTarget;
    const targetIndex = parseInt(targetItem.dataset.index);
    
    // Remove visual feedback
    targetItem.classList.remove('drag-over');
    targetItem.style.borderColor = '';
    targetItem.style.transform = '';
    
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
        const draggedFrame = frames[draggedIndex];
        frames.splice(draggedIndex, 1);
        frames.splice(targetIndex, 0, draggedFrame);
        updateFramesList();
    }
}

function handleFrameDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    e.currentTarget.style.opacity = '';
    
    // Remove any remaining drag-over classes
    document.querySelectorAll('.frame-item').forEach(item => {
        item.classList.remove('drag-over');
        item.style.borderColor = '';
        item.style.transform = '';
    });
    
    draggedIndex = null;
}

// Handle generate based on mode
async function handleGenerate() {
    if (conversionMode === 'image-to-video') {
        await generateVideoDirectly();
    } else {
        await generateGIF();
    }
}

// GIF generation
async function generateGIF() {
    if (frames.length === 0) {
        alert('최소 1개의 이미지를 업로드해주세요.');
        return;
    }
    
    // Check if GIF library is loaded
    if (typeof GIF === 'undefined') {
        alert('GIF 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        return;
    }
    
    generateBtn.disabled = true;
    progressSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    
    const delay = parseInt(frameDelayInput.value);
    const repeat = parseInt(loopCountInput.value);
    const width = parseInt(gifWidthInput.value);
    const quality = parseInt(gifQualityInput.value);
    const enableCrossfade = enableCrossfadeInput.checked;
    const crossfadeFrames = parseInt(crossfadeFramesInput.value);
    
    try {
        console.log('GIF 생성 시작:', { delay, repeat, width, quality, frameCount: frames.length });
        
        const gif = new GIF({
            workers: 2,
            quality: quality,
            width: width,
            workerScript: '/static/gif.worker.js',
            repeat: repeat
        });
        
        // Prepare canvases for all frames
        const canvases = [];
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const aspectRatio = frame.image.height / frame.image.width;
            canvas.width = width;
            canvas.height = Math.round(width * aspectRatio);
            
            ctx.drawImage(frame.image, 0, 0, canvas.width, canvas.height);
            canvases.push(canvas);
        }
        
        // Add frames with optional crossfade
        if (enableCrossfade && frames.length > 1) {
            console.log(`크로스페이드 효과 적용 (전환 프레임: ${crossfadeFrames})`);
            
            // Easing function for smoother transitions (ease-in-out)
            const easeInOutCubic = (t) => {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            };
            
            for (let i = 0; i < frames.length; i++) {
                try {
                    // Add main frame with longer display time
                    const mainFrameDelay = Math.floor(delay * 0.7); // 70% of total delay for main frame
                    gif.addFrame(canvases[i], { delay: mainFrameDelay, copy: true });
                    
                    // Add crossfade frames between this and next frame
                    if (i < frames.length - 1) {
                        const nextCanvas = canvases[i + 1];
                        const transitionTotalDelay = delay - mainFrameDelay; // 30% for transition
                        const transitionDelay = Math.floor(transitionTotalDelay / crossfadeFrames);
                        
                        for (let t = 1; t <= crossfadeFrames; t++) {
                            const transitionCanvas = document.createElement('canvas');
                            transitionCanvas.width = canvases[i].width;
                            transitionCanvas.height = canvases[i].height;
                            const transitionCtx = transitionCanvas.getContext('2d');
                            
                            // Apply easing function for smoother transition
                            const progress = t / (crossfadeFrames + 1);
                            const easedProgress = easeInOutCubic(progress);
                            
                            // Clear canvas
                            transitionCtx.clearRect(0, 0, transitionCanvas.width, transitionCanvas.height);
                            
                            // Draw current frame
                            transitionCtx.globalAlpha = 1 - easedProgress;
                            transitionCtx.globalCompositeOperation = 'source-over';
                            transitionCtx.drawImage(canvases[i], 0, 0);
                            
                            // Draw next frame with blending
                            transitionCtx.globalAlpha = easedProgress;
                            transitionCtx.globalCompositeOperation = 'source-over';
                            transitionCtx.drawImage(nextCanvas, 0, 0);
                            
                            transitionCtx.globalAlpha = 1.0;
                            
                            gif.addFrame(transitionCanvas, { delay: transitionDelay, copy: true });
                        }
                    } else {
                        // Last frame - no transition needed, use full delay
                        // Already added with mainFrameDelay above
                    }
                    
                    const progress = Math.round(((i + 1) / frames.length) * 50);
                    updateProgress(progress, `프레임 처리 중... ${i + 1}/${frames.length}`);
                } catch (frameError) {
                    console.error(`Frame ${i + 1} processing error:`, frameError);
                    throw new Error(`프레임 ${i + 1} 처리 중 오류: ${frameError.message}`);
                }
            }
        } else {
            // Normal mode without crossfade
            for (let i = 0; i < frames.length; i++) {
                try {
                    gif.addFrame(canvases[i], { delay: delay, copy: true });
                    
                    const progress = Math.round(((i + 1) / frames.length) * 50);
                    updateProgress(progress, `프레임 추가 중... ${i + 1}/${frames.length}`);
                } catch (frameError) {
                    console.error(`Frame ${i + 1} processing error:`, frameError);
                    throw new Error(`프레임 ${i + 1} 처리 중 오류: ${frameError.message}`);
                }
            }
        }
        
        console.log('All frames added, starting render...');
        
        gif.on('progress', (p) => {
            console.log('Render progress:', Math.round(p * 100) + '%');
            const progress = 50 + Math.round(p * 50);
            updateProgress(progress, 'GIF 생성 중...');
        });
        
        gif.on('finished', (blob) => {
            console.log('GIF finished! Size:', blob.size, 'bytes');
            const url = URL.createObjectURL(blob);
            resultGif.src = url;
            resultSection.classList.remove('hidden');
            progressSection.classList.add('hidden');
            generateBtn.disabled = false;
            
            const sizeBytes = blob.size;
            const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
            const sizeKB = (sizeBytes / 1024).toFixed(2);
            fileSize.textContent = `파일 크기: ${sizeBytes > 1024 * 1024 ? sizeMB + ' MB' : sizeKB + ' KB'}`;
            
            // Store blob for download
            resultGif.blob = blob;
            
            // Scroll to result
            resultSection.scrollIntoView({ behavior: 'smooth' });
        });
        
        gif.on('error', (err) => {
            console.error('GIF render error:', err);
            throw new Error('GIF 렌더링 실패: ' + err.message);
        });
        
        console.log('Starting gif.render()...');
        gif.render();
        
    } catch (error) {
        console.error('GIF 생성 오류:', error);
        alert(`GIF 생성 중 오류가 발생했습니다.\n\n오류 내용: ${error.message || error}\n\n브라우저 콘솔(F12)에서 자세한 내용을 확인하세요.`);
        generateBtn.disabled = false;
        progressSection.classList.add('hidden');
    }
}

function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = text;
}

function downloadGIF() {
    if (resultGif.blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(resultGif.blob);
        a.download = `gif-${Date.now()}.gif`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

function reset() {
    frames = [];
    updateFramesList();
    resultSection.classList.add('hidden');
    resultGif.classList.remove('hidden');
    resultVideo.classList.add('hidden');
    downloadVideoBtn.classList.add('hidden');
    convertToVideoBtn.classList.remove('hidden');
    fileInput.value = '';
}

// Convert GIF to Video using Canvas and MediaRecorder
async function convertToVideo() {
    if (!resultGif.blob) {
        alert('먼저 GIF를 생성해주세요.');
        return;
    }
    
    try {
        conversionProgress.classList.remove('hidden');
        conversionText.textContent = 'GIF를 분석하는 중...';
        convertToVideoBtn.disabled = true;
        
        // Create a temporary image to load the GIF
        const img = new Image();
        const gifUrl = URL.createObjectURL(resultGif.blob);
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = gifUrl;
        });
        
        conversionText.textContent = '동영상으로 변환 중...';
        
        // Create canvas with same dimensions as GIF
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Get frame delay from settings
        const delay = parseInt(frameDelayInput.value);
        const fps = Math.round(1000 / delay);
        
        // Create video stream from canvas
        const stream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const webmBlob = new Blob(chunks, { type: 'video/webm' });
            
            // Display video
            const videoUrl = URL.createObjectURL(webmBlob);
            resultVideo.src = videoUrl;
            resultVideo.blob = webmBlob;
            
            resultGif.classList.add('hidden');
            resultVideo.classList.remove('hidden');
            convertToVideoBtn.classList.add('hidden');
            downloadVideoBtn.classList.remove('hidden');
            
            conversionProgress.classList.add('hidden');
            convertToVideoBtn.disabled = false;
            
            const videoSizeBytes = webmBlob.size;
            const videoSizeMB = (videoSizeBytes / 1024 / 1024).toFixed(2);
            const videoSizeKB = (videoSizeBytes / 1024).toFixed(2);
            fileSize.textContent = `동영상 크기: ${videoSizeBytes > 1024 * 1024 ? videoSizeMB + ' MB' : videoSizeKB + ' KB'}`;

            URL.revokeObjectURL(gifUrl);
        };
        
        // Start recording
        mediaRecorder.start();
        
        // Draw frames from canvas (simulate GIF animation)
        const totalFrames = frames.length;
        const frameDelay = delay;
        
        for (let i = 0; i < totalFrames * 2; i++) { // Loop twice for better video
            const frameIndex = i % totalFrames;
            
            // Clear and draw frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Use the original frame images
            if (frames[frameIndex] && frames[frameIndex].image) {
                ctx.drawImage(frames[frameIndex].image, 0, 0, canvas.width, canvas.height);
            }
            
            // Wait for frame delay
            await new Promise(resolve => setTimeout(resolve, frameDelay));
        }
        
        // Stop recording
        mediaRecorder.stop();
        
    } catch (error) {
        console.error('동영상 변환 오류:', error);
        alert(`동영상 변환 중 오류가 발생했습니다.\n\n${error.message}`);
        conversionProgress.classList.add('hidden');
        convertToVideoBtn.disabled = false;
    }
}

function downloadVideo() {
    if (resultVideo.blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(resultVideo.blob);
        a.download = `video-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Direct GIF to Video conversion
async function handleGifToVideo(file) {
    if (!file || file.type !== 'image/gif') {
        alert('GIF 파일만 업로드 가능합니다.');
        return;
    }
    
    try {
        // Hide frames section, show result preparation
        framesSection.classList.add('hidden');
        settingsSection.classList.add('hidden');
        generateSection.classList.add('hidden');
        
        progressSection.classList.remove('hidden');
        updateProgress(10, 'GIF 파일 로드 중...');
        
        // Read GIF file
        const reader = new FileReader();
        const gifData = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        
        updateProgress(30, 'GIF 분석 중...');
        
        // Create image to load GIF
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = gifData;
        });
        
        updateProgress(50, '동영상으로 변환 중...');
        
        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Start recording
        const stream = canvas.captureStream(10); // 10 FPS
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const webmBlob = new Blob(chunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(webmBlob);
            
            resultVideo.src = videoUrl;
            resultVideo.blob = webmBlob;
            
            // Show result
            resultGif.classList.add('hidden');
            resultVideo.classList.remove('hidden');
            resultSection.classList.remove('hidden');
            progressSection.classList.add('hidden');
            
            convertToVideoBtn.classList.add('hidden');
            downloadVideoBtn.classList.remove('hidden');
            downloadBtn.classList.add('hidden');
            
            const videoSizeBytes = webmBlob.size;
            const videoSizeMB = (videoSizeBytes / 1024 / 1024).toFixed(2);
            const videoSizeKB = (videoSizeBytes / 1024).toFixed(2);
            fileSize.textContent = `동영상 크기: ${videoSizeBytes > 1024 * 1024 ? videoSizeMB + ' MB' : videoSizeKB + ' KB'}`;
        };

        mediaRecorder.start();

        updateProgress(70, '녹화 중...');
        
        // Draw GIF frames (animate for 3 seconds)
        const duration = 3000;
        const frameTime = 100;
        const totalFrames = duration / frameTime;
        
        for (let i = 0; i < totalFrames; i++) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            await new Promise(resolve => setTimeout(resolve, frameTime));
        }
        
        updateProgress(90, '마무리 중...');
        mediaRecorder.stop();
        
    } catch (error) {
        console.error('GIF to Video 변환 오류:', error);
        alert(`변환 중 오류가 발생했습니다.\n\n${error.message}`);
        progressSection.classList.add('hidden');
    }
}

// Generate video directly from images
async function generateVideoDirectly() {
    if (frames.length === 0) {
        alert('최소 1개의 이미지를 업로드해주세요.');
        return;
    }
    
    try {
        generateBtn.disabled = true;
        progressSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        
        const delay = parseInt(frameDelayInput.value);
        const width = parseInt(gifWidthInput.value);
        
        updateProgress(10, '이미지 준비 중...');
        
        // Prepare canvases
        const canvases = [];
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const aspectRatio = frame.image.height / frame.image.width;
            canvas.width = width;
            canvas.height = Math.round(width * aspectRatio);
            
            ctx.drawImage(frame.image, 0, 0, canvas.width, canvas.height);
            canvases.push(canvas);
        }
        
        updateProgress(30, '동영상 생성 중...');
        
        // Create recording canvas
        const recordCanvas = document.createElement('canvas');
        recordCanvas.width = canvases[0].width;
        recordCanvas.height = canvases[0].height;
        const recordCtx = recordCanvas.getContext('2d');
        
        const fps = Math.round(1000 / delay);
        const stream = recordCanvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const webmBlob = new Blob(chunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(webmBlob);
            
            resultVideo.src = videoUrl;
            resultVideo.blob = webmBlob;
            
            resultGif.classList.add('hidden');
            resultVideo.classList.remove('hidden');
            resultSection.classList.remove('hidden');
            progressSection.classList.add('hidden');
            
            convertToVideoBtn.classList.add('hidden');
            downloadVideoBtn.classList.remove('hidden');
            downloadBtn.classList.add('hidden');
            
            generateBtn.disabled = false;
            
            const videoSizeBytes = webmBlob.size;
            const videoSizeMB = (videoSizeBytes / 1024 / 1024).toFixed(2);
            const videoSizeKB = (videoSizeBytes / 1024).toFixed(2);
            fileSize.textContent = `동영상 크기: ${videoSizeBytes > 1024 * 1024 ? videoSizeMB + ' MB' : videoSizeKB + ' KB'}`;

            resultSection.scrollIntoView({ behavior: 'smooth' });
        };
        
        mediaRecorder.start();
        
        updateProgress(50, '녹화 중...');
        
        // Render frames
        const totalFrames = frames.length * 2; // Loop twice
        for (let i = 0; i < totalFrames; i++) {
            const frameIndex = i % frames.length;
            
            recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);
            recordCtx.drawImage(canvases[frameIndex], 0, 0);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const progress = 50 + Math.round(((i + 1) / totalFrames) * 40);
            updateProgress(progress, `녹화 중... ${i + 1}/${totalFrames}`);
        }
        
        updateProgress(95, '마무리 중...');
        mediaRecorder.stop();
        
    } catch (error) {
        console.error('동영상 생성 오류:', error);
        alert(`동영상 생성 중 오류가 발생했습니다.\n\n${error.message}`);
        generateBtn.disabled = false;
        progressSection.classList.add('hidden');
    }
}
