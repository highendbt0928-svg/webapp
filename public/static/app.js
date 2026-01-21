// Check if gif.js is loaded
console.log('GIF.js loaded:', typeof GIF !== 'undefined');

// Constants
const MAX_IMAGE_SIZE = 2048; // Max dimension for uploaded images
const STORAGE_KEY = 'gifmaker_settings';

// State
let frames = [];
let draggedIndex = null;
let conversionMode = 'image-to-gif'; // Default mode
let currentFilter = 'none'; // Filter state

// Track created object URLs for cleanup
let objectURLs = [];

// ==========================================
// Settings Storage (LocalStorage)
// ==========================================
function saveSettings() {
    const settings = {
        frameSpeed: document.getElementById('frameSpeed')?.value,
        speedDirectInput: document.getElementById('speedDirectInput')?.value,
        gifSizePreset: document.getElementById('gifSizePreset')?.value,
        gifWidth: document.getElementById('gifWidth')?.value,
        qualitySlider: document.getElementById('qualitySlider')?.value,
        loopCount: document.getElementById('loopCount')?.value,
        enableCrossfade: document.getElementById('enableCrossfade')?.checked,
        crossfadeFrames: document.getElementById('crossfadeFrames')?.value,
        currentFilter: currentFilter
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const settings = JSON.parse(saved);
            return settings;
        }
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
    return null;
}

function applySettings(settings) {
    if (!settings) return;

    if (settings.frameSpeed) {
        const el = document.getElementById('frameSpeed');
        if (el) el.value = settings.frameSpeed;
    }
    if (settings.speedDirectInput) {
        const el = document.getElementById('speedDirectInput');
        if (el) el.value = settings.speedDirectInput;
    }
    if (settings.gifSizePreset) {
        const el = document.getElementById('gifSizePreset');
        if (el) {
            el.value = settings.gifSizePreset;
            if (settings.gifSizePreset === 'custom') {
                document.getElementById('gifWidth')?.classList.remove('hidden');
            }
        }
    }
    if (settings.gifWidth) {
        const el = document.getElementById('gifWidth');
        if (el) el.value = settings.gifWidth;
    }
    if (settings.qualitySlider) {
        const el = document.getElementById('qualitySlider');
        if (el) el.value = settings.qualitySlider;
    }
    if (settings.loopCount !== undefined) {
        const el = document.getElementById('loopCount');
        if (el) el.value = settings.loopCount;
    }
    if (settings.enableCrossfade !== undefined) {
        const el = document.getElementById('enableCrossfade');
        if (el) {
            el.checked = settings.enableCrossfade;
            if (settings.enableCrossfade) {
                document.getElementById('crossfadeSettings')?.classList.remove('hidden');
            }
        }
    }
    if (settings.crossfadeFrames) {
        const el = document.getElementById('crossfadeFrames');
        if (el) el.value = settings.crossfadeFrames;
    }
    if (settings.currentFilter) {
        currentFilter = settings.currentFilter;
        const el = document.getElementById('filterSelect');
        if (el) el.value = currentFilter;
    }
}

// ==========================================
// Image Optimization
// ==========================================
async function optimizeImage(file, maxSize = MAX_IMAGE_SIZE) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Check if resize is needed
                if (img.width <= maxSize && img.height <= maxSize) {
                    resolve({ dataUrl: e.target.result, image: img, optimized: false });
                    return;
                }

                // Calculate new dimensions
                let newWidth, newHeight;
                if (img.width > img.height) {
                    newWidth = maxSize;
                    newHeight = Math.round((img.height / img.width) * maxSize);
                } else {
                    newHeight = maxSize;
                    newWidth = Math.round((img.width / img.height) * maxSize);
                }

                // Create optimized canvas
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');

                // Use high quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // Convert to data URL
                const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

                // Create new image from optimized data
                const optimizedImg = new Image();
                optimizedImg.onload = () => {
                    resolve({ dataUrl: optimizedDataUrl, image: optimizedImg, optimized: true });
                };
                optimizedImg.onerror = reject;
                optimizedImg.src = optimizedDataUrl;
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==========================================
// Filter Effects
// ==========================================
const filters = {
    none: (ctx, canvas) => { /* No filter */ },
    grayscale: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
    },
    sepia: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        ctx.putImageData(imageData, 0, 0);
    },
    brightness: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const brightness = 30;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + brightness);
            data[i + 1] = Math.min(255, data[i + 1] + brightness);
            data[i + 2] = Math.min(255, data[i + 2] + brightness);
        }
        ctx.putImageData(imageData, 0, 0);
    },
    contrast: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const factor = 1.3;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
            data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
        }
        ctx.putImageData(imageData, 0, 0);
    },
    vintage: (ctx, canvas) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            data[i] = Math.min(255, r * 0.9 + 40);
            data[i + 1] = Math.min(255, g * 0.7 + 20);
            data[i + 2] = Math.min(255, b * 0.5);
        }
        ctx.putImageData(imageData, 0, 0);
    }
};

function applyFilter(canvas, filterName) {
    if (filterName === 'none' || !filters[filterName]) return canvas;

    const ctx = canvas.getContext('2d');
    filters[filterName](ctx, canvas);
    return canvas;
}

// Cleanup function for object URLs to prevent memory leaks
function cleanupObjectURLs() {
    objectURLs.forEach(url => {
        try {
            URL.revokeObjectURL(url);
        } catch (e) {
            console.warn('Failed to revoke URL:', e);
        }
    });
    objectURLs = [];
}

// Create and track object URL
function createTrackedObjectURL(blob) {
    const url = URL.createObjectURL(blob);
    objectURLs.push(url);
    return url;
}

// Expose removeFrame to global scope for onclick handlers
window.removeFrame = function(index) {
    frames.splice(index, 1);
    updateFramesList();
};

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
const filterSelect = document.getElementById('filterSelect');

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
    saveSettings();
});

// Update crossfade value display
const crossfadeValue = document.getElementById('crossfadeValue');
crossfadeFramesInput.addEventListener('input', (e) => {
    crossfadeValue.textContent = e.target.value;
    saveSettings();
});

// Filter selection
if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        saveSettings();
        // Update preview if frames exist
        if (frames.length > 0) {
            updateFramesList();
        }
    });
}

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
frameSpeedInput.addEventListener('input', () => {
    updateFrameSpeed(false);
    saveSettings();
});

// Update on direct input change
speedDirectInput.addEventListener('input', () => {
    updateFrameSpeed(true);
    saveSettings();
});

// GIF size preset handler
gifSizePreset.addEventListener('change', (e) => {
    const value = e.target.value;
    if (value === 'custom') {
        gifWidthInput.classList.remove('hidden');
    } else {
        gifWidthInput.classList.add('hidden');
        gifWidthInput.value = value;
    }
    saveSettings();
});

// Custom width change
gifWidthInput.addEventListener('input', saveSettings);

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
qualitySlider.addEventListener('input', () => {
    updateQuality();
    saveSettings();
});

// Loop count change
loopCountInput.addEventListener('input', saveSettings);

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
    
    addFiles(files);
}

async function addFiles(files) {
    // Show loading indicator
    const loadingCount = files.length;
    let loadedCount = 0;

    // Process files with optimization
    for (const file of files) {
        try {
            const result = await optimizeImage(file, MAX_IMAGE_SIZE);

            frames.push({
                id: Date.now() + Math.random(),
                src: result.dataUrl,
                image: result.image,
                delay: 500,
                optimized: result.optimized
            });

            loadedCount++;
            updateFramesList();

            // Log optimization info
            if (result.optimized) {
                console.log(`Image optimized: ${file.name}`);
            }
        } catch (error) {
            console.error(`Failed to load image: ${file.name}`, error);
        }
    }

    // Show optimization summary
    const optimizedCount = frames.filter(f => f.optimized).length;
    if (optimizedCount > 0) {
        console.log(`${optimizedCount} images were optimized for better performance`);
    }
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

// removeFrame is now defined in global scope at the top

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

            // Apply filter if selected
            if (currentFilter && currentFilter !== 'none') {
                applyFilter(canvas, currentFilter);
            }

            canvases.push(canvas);
        }

        // Add frames with optional crossfade
        if (enableCrossfade && frames.length > 1) {
            console.log(`크로스페이드 효과 적용 (전환 프레임: ${crossfadeFrames})`);

            // Easing function for smoother transitions (ease-in-out)
            const easeInOutCubic = (t) => {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            };

            // Reusable canvas for transitions - improves performance
            const transitionCanvas = document.createElement('canvas');
            transitionCanvas.width = canvases[0].width;
            transitionCanvas.height = canvases[0].height;
            const transitionCtx = transitionCanvas.getContext('2d');

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

                        // Resize transition canvas if needed
                        if (transitionCanvas.width !== canvases[i].width ||
                            transitionCanvas.height !== canvases[i].height) {
                            transitionCanvas.width = canvases[i].width;
                            transitionCanvas.height = canvases[i].height;
                        }

                        for (let t = 1; t <= crossfadeFrames; t++) {
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
            const url = createTrackedObjectURL(blob);
            resultGif.src = url;
            resultSection.classList.remove('hidden');
            progressSection.classList.add('hidden');
            generateBtn.disabled = false;

            const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
            const sizeKB = (blob.size / 1024).toFixed(2);
            fileSize.textContent = `파일 크기: ${sizeMB > 1 ? sizeMB + ' MB' : sizeKB + ' KB'}`;

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
        const url = URL.createObjectURL(resultGif.blob);
        a.href = url;
        a.download = `gif-${Date.now()}.gif`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Clean up after download
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

function reset() {
    // Clean up memory before resetting
    cleanupObjectURLs();

    // Clear previous results
    if (resultGif.src && resultGif.src.startsWith('blob:')) {
        URL.revokeObjectURL(resultGif.src);
    }
    if (resultVideo.src && resultVideo.src.startsWith('blob:')) {
        URL.revokeObjectURL(resultVideo.src);
    }

    frames = [];
    updateFramesList();
    resultSection.classList.add('hidden');
    resultGif.classList.remove('hidden');
    resultVideo.classList.add('hidden');
    downloadVideoBtn.classList.add('hidden');
    convertToVideoBtn.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
    fileInput.value = '';
}

// Convert GIF to Video using Canvas and MediaRecorder
async function convertToVideo() {
    if (!resultGif.blob) {
        alert('먼저 GIF를 생성해주세요.');
        return;
    }

    // Check MediaRecorder support
    if (typeof MediaRecorder === 'undefined') {
        alert('이 브라우저는 동영상 변환을 지원하지 않습니다.\nChrome 또는 Firefox를 사용해주세요.');
        return;
    }

    try {
        conversionProgress.classList.remove('hidden');
        conversionText.textContent = 'GIF를 분석하는 중...';
        convertToVideoBtn.disabled = true;

        // Create a temporary image to load the GIF
        const img = new Image();
        const gifUrl = createTrackedObjectURL(resultGif.blob);

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('GIF 이미지 로드 실패'));
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
        const fps = Math.max(1, Math.min(30, Math.round(1000 / delay)));

        // Check for MediaRecorder codec support
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }
        }

        // Create video stream from canvas
        const stream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
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
            const videoUrl = createTrackedObjectURL(webmBlob);
            resultVideo.src = videoUrl;
            resultVideo.blob = webmBlob;

            resultGif.classList.add('hidden');
            resultVideo.classList.remove('hidden');
            convertToVideoBtn.classList.add('hidden');
            downloadVideoBtn.classList.remove('hidden');

            conversionProgress.classList.add('hidden');
            convertToVideoBtn.disabled = false;

            const videoSizeMB = (webmBlob.size / 1024 / 1024).toFixed(2);
            const videoSizeKB = (webmBlob.size / 1024).toFixed(2);
            fileSize.textContent = `동영상 크기: ${videoSizeMB > 1 ? videoSizeMB + ' MB' : videoSizeKB + ' KB'}`;
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
        const url = URL.createObjectURL(resultVideo.blob);
        a.href = url;
        a.download = `video-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Clean up after download
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

// Direct GIF to Video conversion
// Note: This uses browser's native GIF rendering for animation
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

        // Create image to load GIF - use an img element to render GIF animation
        const img = document.createElement('img');
        img.style.display = 'none';
        document.body.appendChild(img);

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = gifData;
        });

        updateProgress(50, '동영상으로 변환 중...');

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        // Check for MediaRecorder codec support
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }
        }

        // Start recording at 15 FPS for smoother animation
        const fps = 15;
        const stream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 3000000
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const webmBlob = new Blob(chunks, { type: 'video/webm' });
            const videoUrl = createTrackedObjectURL(webmBlob);

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

            const videoSizeMB = (webmBlob.size / 1024 / 1024).toFixed(2);
            const videoSizeKB = (webmBlob.size / 1024).toFixed(2);
            fileSize.textContent = `동영상 크기: ${videoSizeMB > 1 ? videoSizeMB + ' MB' : videoSizeKB + ' KB'}`;

            // Clean up temporary image element
            document.body.removeChild(img);
        };

        mediaRecorder.start(100); // Request data every 100ms for smoother encoding

        updateProgress(70, '녹화 중...');

        // Draw GIF frames (animate for 4 seconds for better coverage)
        const duration = 4000;
        const frameTime = Math.floor(1000 / fps);
        const totalFrames = Math.ceil(duration / frameTime);

        for (let i = 0; i < totalFrames; i++) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            await new Promise(resolve => setTimeout(resolve, frameTime));

            // Update progress
            if (i % 5 === 0) {
                const progress = 70 + Math.round((i / totalFrames) * 20);
                updateProgress(progress, `녹화 중... ${Math.round((i / totalFrames) * 100)}%`);
            }
        }

        updateProgress(95, '마무리 중...');
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

    // Check MediaRecorder support
    if (typeof MediaRecorder === 'undefined') {
        alert('이 브라우저는 동영상 생성을 지원하지 않습니다.\nChrome 또는 Firefox를 사용해주세요.');
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

            // Apply filter if selected
            if (currentFilter && currentFilter !== 'none') {
                applyFilter(canvas, currentFilter);
            }

            canvases.push(canvas);
        }

        updateProgress(30, '동영상 생성 중...');

        // Create recording canvas
        const recordCanvas = document.createElement('canvas');
        recordCanvas.width = canvases[0].width;
        recordCanvas.height = canvases[0].height;
        const recordCtx = recordCanvas.getContext('2d');

        const fps = Math.max(1, Math.min(30, Math.round(1000 / delay)));

        // Check for MediaRecorder codec support
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }
        }

        const stream = recordCanvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
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
            const videoUrl = createTrackedObjectURL(webmBlob);

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

            const videoSizeMB = (webmBlob.size / 1024 / 1024).toFixed(2);
            const videoSizeKB = (webmBlob.size / 1024).toFixed(2);
            fileSize.textContent = `동영상 크기: ${videoSizeMB > 1 ? videoSizeMB + ' MB' : videoSizeKB + ' KB'}`;

            resultSection.scrollIntoView({ behavior: 'smooth' });
        };

        mediaRecorder.start(100); // Request data every 100ms

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

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    const savedSettings = loadSettings();
    if (savedSettings) {
        applySettings(savedSettings);
        // Update displays after applying settings
        updateFrameSpeed();
        updateQuality();
        console.log('Settings loaded from localStorage');
    }

    // Register keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to generate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (frames.length > 0 && !generateBtn.disabled) {
                e.preventDefault();
                handleGenerate();
            }
        }
        // Escape to close/reset
        if (e.key === 'Escape') {
            if (!resultSection.classList.contains('hidden')) {
                reset();
            }
        }
        // Delete to remove selected frame (when focused)
        if (e.key === 'Delete' && document.activeElement?.closest('.frame-item')) {
            const index = parseInt(document.activeElement.closest('.frame-item').dataset.index);
            if (!isNaN(index)) {
                window.removeFrame(index);
            }
        }
    });

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.warn('Service Worker registration failed:', error);
            });
    }

    // Handle online/offline status
    window.addEventListener('online', () => {
        console.log('App is online');
    });
    window.addEventListener('offline', () => {
        console.log('App is offline - using cached resources');
    });

    console.log('GIF Maker initialized');
});
