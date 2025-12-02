// State
let frames = [];
let draggedIndex = null;

// DOM Elements
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
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const fileSize = document.getElementById('fileSize');

// Settings
const frameDelayInput = document.getElementById('frameDelay');
const loopCountInput = document.getElementById('loopCount');
const gifWidthInput = document.getElementById('gifWidth');
const gifQualityInput = document.getElementById('gifQuality');

// Event Listeners
selectFilesBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);

clearFramesBtn.addEventListener('click', clearFrames);
generateBtn.addEventListener('click', generateGIF);
downloadBtn.addEventListener('click', downloadGIF);
resetBtn.addEventListener('click', reset);

// File handling
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
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
        <div class="frame-item bg-gray-100 rounded-lg p-2 cursor-move" 
             draggable="true" 
             data-index="${index}">
            <img src="${frame.src}" alt="Frame ${index + 1}" class="w-full h-32 object-cover rounded mb-2">
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600">#${index + 1}</span>
                <button class="text-red-600 hover:text-red-800" onclick="removeFrame(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Add drag and drop functionality to frames
    const frameItems = document.querySelectorAll('.frame-item');
    frameItems.forEach(item => {
        item.addEventListener('dragstart', handleFrameDragStart);
        item.addEventListener('dragover', handleFrameDragOver);
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
    draggedIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
}

function handleFrameDragOver(e) {
    e.preventDefault();
}

function handleFrameDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.currentTarget.dataset.index);
    
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
        const draggedFrame = frames[draggedIndex];
        frames.splice(draggedIndex, 1);
        frames.splice(targetIndex, 0, draggedFrame);
        updateFramesList();
    }
}

function handleFrameDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedIndex = null;
}

// GIF generation
async function generateGIF() {
    if (frames.length === 0) {
        alert('최소 1개의 이미지를 업로드해주세요.');
        return;
    }
    
    generateBtn.disabled = true;
    progressSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    
    const delay = parseInt(frameDelayInput.value);
    const repeat = parseInt(loopCountInput.value);
    const width = parseInt(gifWidthInput.value);
    const quality = parseInt(gifQualityInput.value);
    
    try {
        const gif = new GIF({
            workers: 2,
            quality: quality,
            width: width,
            workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js',
            repeat: repeat
        });
        
        // Add frames
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate height to maintain aspect ratio
            const aspectRatio = frame.image.height / frame.image.width;
            canvas.width = width;
            canvas.height = Math.round(width * aspectRatio);
            
            ctx.drawImage(frame.image, 0, 0, canvas.width, canvas.height);
            
            gif.addFrame(canvas, { delay: delay });
            
            const progress = Math.round(((i + 1) / frames.length) * 50);
            updateProgress(progress, `프레임 추가 중... ${i + 1}/${frames.length}`);
        }
        
        gif.on('progress', (p) => {
            const progress = 50 + Math.round(p * 50);
            updateProgress(progress, 'GIF 생성 중...');
        });
        
        gif.on('finished', (blob) => {
            const url = URL.createObjectURL(blob);
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
        
        gif.render();
        
    } catch (error) {
        console.error('GIF 생성 오류:', error);
        alert('GIF 생성 중 오류가 발생했습니다.');
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
    fileInput.value = '';
}
