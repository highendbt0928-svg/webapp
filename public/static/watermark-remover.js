// AI Eraser Watermark Remover - Canvas-based brush system
let images = [];
let currentImageIndex = 0;
let savedMaskData = null; // Save first image's mask to apply to others
let isDragging = false;
let draggedImageId = null;

// Canvas and drawing variables
let canvas, ctx, maskCanvas, maskCtx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let brushSize = 30;
let history = [];
let historyStep = -1;

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const imagesSection = document.getElementById('imagesSection');
const imagesList = document.getElementById('imagesList');
const imageCount = document.getElementById('imageCount');
const clearImagesBtn = document.getElementById('clearImagesBtn');
const canvasSection = document.getElementById('canvasSection');
const canvasContainer = document.getElementById('canvasContainer');
const currentImageInfo = document.getElementById('currentImageInfo');
const prevImageBtn = document.getElementById('prevImageBtn');
const nextImageBtn = document.getElementById('nextImageBtn');

// Brush controls
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearMaskBtn = document.getElementById('clearMaskBtn');
const applyMaskToAllBtn = document.getElementById('applyMaskToAllBtn');

// Action buttons
const removeAllWatermarksBtn = document.getElementById('removeAllWatermarksBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const resultsGrid = document.getElementById('resultsGrid');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const resetBtn = document.getElementById('resetBtn');

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
selectFileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
clearImagesBtn.addEventListener('click', clearAllImages);
prevImageBtn.addEventListener('click', () => navigateImage(-1));
nextImageBtn.addEventListener('click', () => navigateImage(1));
brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize + 'px';
});
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
clearMaskBtn.addEventListener('click', clearMask);
applyMaskToAllBtn.addEventListener('click', applyMaskToAll);
removeAllWatermarksBtn.addEventListener('click', handleRemoveAllWatermarks);
downloadAllBtn.addEventListener('click', handleDownloadAll);
resetBtn.addEventListener('click', handleReset);

// Drag and Drop for file upload
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

// File Selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    const validFiles = files.filter(file => 
        file.type.match('image/jpeg') || file.type.match('image/png')
    );

    if (validFiles.length === 0) {
        alert('JPG 또는 PNG 파일만 지원됩니다.');
        return;
    }

    validFiles.forEach(file => addImage(file));
}

function addImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const id = Date.now() + Math.random();
        const imageData = {
            id: id,
            file: file,
            dataUrl: e.target.result,
            processed: false,
            resultUrl: null,
            maskData: savedMaskData ? savedMaskData : null
        };
        
        images.push(imageData);
        renderImagesList();
        
        if (images.length === 1) {
            showImage(0);
        }
        
        updateUI();
    };
    reader.readAsDataURL(file);
}

function renderImagesList() {
    imagesList.innerHTML = '';
    
    images.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'image-item border-2 rounded-lg overflow-hidden cursor-move relative';
        div.dataset.id = img.id;
        div.draggable = true;
        
        if (index === currentImageIndex) {
            div.classList.add('border-purple-500', 'ring-2', 'ring-purple-300');
        } else {
            div.classList.add('border-gray-300');
        }
        
        div.innerHTML = `
            <img src="${img.dataUrl}" alt="Image ${index + 1}" class="w-full h-full object-cover">
            <div class="absolute top-1 right-1 flex gap-1">
                ${img.processed ? '<span class="bg-green-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-check"></i></span>' : ''}
                ${img.maskData ? '<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded"><i class="fas fa-paint-brush"></i></span>' : ''}
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded" onclick="deleteImage('${img.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                ${index + 1}
            </div>
        `;
        
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-btn')) {
                showImage(index);
            }
        });
        
        // Drag and drop for reordering
        div.addEventListener('dragstart', (e) => {
            draggedImageId = img.id;
            div.classList.add('opacity-50');
        });
        
        div.addEventListener('dragend', () => {
            div.classList.remove('opacity-50');
        });
        
        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            div.classList.add('border-purple-500');
        });
        
        div.addEventListener('dragleave', () => {
            div.classList.remove('border-purple-500');
        });
        
        div.addEventListener('drop', (e) => {
            e.preventDefault();
            div.classList.remove('border-purple-500');
            
            if (draggedImageId && draggedImageId !== img.id) {
                const draggedIndex = images.findIndex(i => i.id === draggedImageId);
                const targetIndex = index;
                
                const [draggedItem] = images.splice(draggedIndex, 1);
                images.splice(targetIndex, 0, draggedItem);
                
                if (draggedIndex === currentImageIndex) {
                    currentImageIndex = targetIndex;
                } else if (draggedIndex < currentImageIndex && targetIndex >= currentImageIndex) {
                    currentImageIndex--;
                } else if (draggedIndex > currentImageIndex && targetIndex <= currentImageIndex) {
                    currentImageIndex++;
                }
                
                renderImagesList();
            }
        });
        
        imagesList.appendChild(div);
    });
    
    imageCount.textContent = `(${images.length}개)`;
}

function deleteImage(id) {
    const index = images.findIndex(img => img.id === id);
    if (index === -1) return;
    
    images.splice(index, 1);
    
    if (images.length === 0) {
        imagesSection.classList.add('hidden');
        canvasSection.classList.add('hidden');
        currentImageIndex = 0;
    } else {
        if (currentImageIndex >= images.length) {
            currentImageIndex = images.length - 1;
        }
        showImage(currentImageIndex);
    }
    
    renderImagesList();
    updateUI();
}

function clearAllImages() {
    if (!confirm('모든 이미지를 삭제하시겠습니까?')) return;
    
    images = [];
    currentImageIndex = 0;
    savedMaskData = null;
    imagesSection.classList.add('hidden');
    canvasSection.classList.add('hidden');
    fileInput.value = '';
    updateUI();
}

function showImage(index) {
    if (index < 0 || index >= images.length) return;
    
    // Save current mask before switching
    if (canvas && images[currentImageIndex]) {
        saveMask();
    }
    
    currentImageIndex = index;
    const img = images[index];
    
    canvasSection.classList.remove('hidden');
    
    // Load image and setup canvas
    const image = new Image();
    image.onload = () => {
        setupCanvas(image, img);
    };
    image.src = img.dataUrl;
    
    updateNavigationButtons();
    renderImagesList();
}

function setupCanvas(image, imgData) {
    // Clear container
    canvasContainer.innerHTML = `
        <div style="position: relative; display: inline-block; max-width: 100%;">
            <canvas id="mainCanvas" style="border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></canvas>
            <canvas id="maskCanvas" style="position: absolute; top: 0; left: 0; border-radius: 0.5rem; cursor: crosshair;"></canvas>
        </div>
    `;
    
    canvas = document.getElementById('mainCanvas');
    maskCanvas = document.getElementById('maskCanvas');
    ctx = canvas.getContext('2d');
    maskCtx = maskCanvas.getContext('2d');
    
    // Set canvas size to match image (max 800px width)
    const maxWidth = 800;
    let width = image.width;
    let height = image.height;
    
    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }
    
    canvas.width = maskCanvas.width = width;
    canvas.height = maskCanvas.height = height;
    
    // Draw image on main canvas
    ctx.drawImage(image, 0, 0, width, height);
    
    // Load saved mask if exists
    if (imgData.maskData) {
        const maskImg = new Image();
        maskImg.onload = () => {
            maskCtx.drawImage(maskImg, 0, 0, width, height);
        };
        maskImg.src = imgData.maskData;
    } else {
        // Clear mask canvas with transparent
        maskCtx.clearRect(0, 0, width, height);
    }
    
    // Initialize history
    history = [maskCanvas.toDataURL()];
    historyStep = 0;
    updateHistoryButtons();
    
    // Setup drawing events
    setupDrawingEvents();
}

function setupDrawingEvents() {
    // Mouse events
    maskCanvas.addEventListener('mousedown', startDrawing);
    maskCanvas.addEventListener('mousemove', draw);
    maskCanvas.addEventListener('mouseup', stopDrawing);
    maskCanvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    maskCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = maskCanvas.getBoundingClientRect();
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
        isDrawing = true;
    });
    
    maskCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const rect = maskCanvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        drawLine(lastX, lastY, x, y);
        lastX = x;
        lastY = y;
    });
    
    maskCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopDrawing();
    });
}

function startDrawing(e) {
    isDrawing = true;
    const rect = maskCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = maskCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawLine(lastX, lastY, x, y);
    
    lastX = x;
    lastY = y;
}

function drawLine(x1, y1, x2, y2) {
    maskCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    maskCtx.lineWidth = brushSize;
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    
    maskCtx.beginPath();
    maskCtx.moveTo(x1, y1);
    maskCtx.lineTo(x2, y2);
    maskCtx.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    // Save to history
    historyStep++;
    history = history.slice(0, historyStep);
    history.push(maskCanvas.toDataURL());
    updateHistoryButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        loadHistoryState();
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        loadHistoryState();
    }
}

function loadHistoryState() {
    const img = new Image();
    img.onload = () => {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.drawImage(img, 0, 0);
    };
    img.src = history[historyStep];
    updateHistoryButtons();
}

function updateHistoryButtons() {
    undoBtn.disabled = historyStep <= 0;
    redoBtn.disabled = historyStep >= history.length - 1;
}

function clearMask() {
    if (!maskCanvas) return;
    
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Save to history
    historyStep++;
    history = history.slice(0, historyStep);
    history.push(maskCanvas.toDataURL());
    updateHistoryButtons();
}

function saveMask() {
    if (!maskCanvas || !images[currentImageIndex]) return;
    
    images[currentImageIndex].maskData = maskCanvas.toDataURL();
    
    // If this is the first image, save as default
    if (currentImageIndex === 0) {
        savedMaskData = maskCanvas.toDataURL();
    }
}

function applyMaskToAll() {
    if (!maskCanvas) {
        alert('먼저 마스크를 그려주세요.');
        return;
    }
    
    if (!confirm('현재 마스크를 모든 이미지에 적용하시겠습니까?')) return;
    
    const maskData = maskCanvas.toDataURL();
    images.forEach((img, index) => {
        img.maskData = maskData;
    });
    
    savedMaskData = maskData;
    renderImagesList();
    alert('모든 이미지에 마스크가 적용되었습니다!');
}

function navigateImage(direction) {
    const newIndex = currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < images.length) {
        showImage(newIndex);
    }
}

function updateNavigationButtons() {
    prevImageBtn.disabled = currentImageIndex === 0;
    nextImageBtn.disabled = currentImageIndex === images.length - 1;
    
    if (images.length > 0) {
        currentImageInfo.textContent = `${currentImageIndex + 1} / ${images.length}`;
    }
}

async function handleRemoveAllWatermarks() {
    if (images.length === 0) {
        alert('이미지를 먼저 업로드해주세요.');
        return;
    }
    
    // Check if any image has mask
    const imagesWithMask = images.filter(img => img.maskData);
    if (imagesWithMask.length === 0) {
        alert('워터마크를 칠해주세요.');
        return;
    }
    
    // Save current mask
    saveMask();
    
    try {
        removeAllWatermarksBtn.disabled = true;
        canvasSection.classList.add('hidden');
        progressSection.classList.remove('hidden');
        progressBar.style.width = '0%';
        
        const totalImages = imagesWithMask.length;
        let processedCount = 0;
        
        for (let i = 0; i < imagesWithMask.length; i++) {
            const img = imagesWithMask[i];
            
            progressText.textContent = `이미지 ${i + 1} / ${totalImages} 처리 중...`;
            progressBar.style.width = ((i / totalImages) * 100) + '%';
            
            try {
                const resultUrl = await removeWatermarkFromImage(img);
                img.resultUrl = resultUrl;
                img.processed = true;
                processedCount++;
            } catch (error) {
                console.error(`Error processing image ${i + 1}:`, error);
                img.processed = false;
            }
        }
        
        progressBar.style.width = '100%';
        progressText.textContent = `완료! ${processedCount} / ${totalImages} 이미지 처리됨`;
        
        setTimeout(() => {
            progressSection.classList.add('hidden');
            displayResults();
        }, 1000);
        
    } catch (error) {
        console.error('Error:', error);
        alert('워터마크 제거 중 오류가 발생했습니다: ' + error.message);
        progressSection.classList.add('hidden');
        removeAllWatermarksBtn.disabled = false;
    }
}

async function removeWatermarkFromImage(img) {
    if (!img.maskData) {
        throw new Error('마스크 데이터가 없습니다.');
    }
    
    // Convert red mask to white mask on black background
    const maskImage = await createBinaryMask(img.maskData);
    
    const response = await fetch('https://www.genspark.ai/api/moa/image_generation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            aspect_ratio: 'auto',
            image_urls: [img.dataUrl, maskImage],
            model: 'fal-ai/flux-2',
            query: 'Remove the watermark, text, logo, or marked area completely. Fill the area naturally by intelligently analyzing and extending the surrounding patterns, textures, colors, and structures. The inpainted area should blend seamlessly with the rest of the image, maintaining consistent lighting, perspective, and style. No visible boundaries, artifacts, or inconsistencies.',
            task_summary: 'AI inpainting to remove watermark naturally'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.generated_images && data.generated_images.length > 0) {
        const resultImageUrl = data.generated_images[0].image_urls_nowatermark?.[0] || 
                              data.generated_images[0].image_urls?.[0];
        
        if (resultImageUrl) {
            return resultImageUrl;
        }
    }
    
    throw new Error('결과 이미지를 찾을 수 없습니다.');
}

async function createBinaryMask(maskDataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            
            // Fill with black
            tempCtx.fillStyle = 'black';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw original mask
            tempCtx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            // Convert to binary: any red becomes white, rest stays black
            for (let i = 0; i < data.length; i += 4) {
                const red = data[i];
                const alpha = data[i + 3];
                
                if (red > 100 && alpha > 100) {
                    // Red area -> White
                    data[i] = 255;     // R
                    data[i + 1] = 255; // G
                    data[i + 2] = 255; // B
                    data[i + 3] = 255; // A
                } else {
                    // Other -> Black
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                    data[i + 3] = 255;
                }
            }
            
            tempCtx.putImageData(imageData, 0, 0);
            resolve(tempCanvas.toDataURL());
        };
        img.src = maskDataUrl;
    });
}

function displayResults() {
    resultsGrid.innerHTML = '';
    
    const processedImages = images.filter(img => img.processed && img.resultUrl);
    
    if (processedImages.length === 0) {
        resultSection.classList.add('hidden');
        alert('처리된 이미지가 없습니다.');
        return;
    }
    
    processedImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'result-item bg-white rounded-lg shadow-md overflow-hidden';
        
        div.innerHTML = `
            <div class="p-4">
                <h3 class="font-semibold text-gray-800 mb-2">이미지 ${images.indexOf(img) + 1}</h3>
                <div class="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Before</p>
                        <img src="${img.dataUrl}" alt="Before" class="w-full rounded border">
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">After</p>
                        <img src="${img.resultUrl}" alt="After" class="w-full rounded border">
                    </div>
                </div>
                <button onclick="downloadSingleImage('${img.resultUrl}', ${images.indexOf(img) + 1})" 
                        class="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded transition">
                    <i class="fas fa-download mr-1"></i>
                    다운로드
                </button>
            </div>
        `;
        
        resultsGrid.appendChild(div);
    });
    
    resultSection.classList.remove('hidden');
}

async function downloadSingleImage(url, index) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `ai-eraser-result-${index}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        console.error('Download error:', error);
        alert('다운로드 중 오류가 발생했습니다.');
    }
}

async function handleDownloadAll() {
    const processedImages = images.filter(img => img.processed && img.resultUrl);
    
    if (processedImages.length === 0) {
        alert('다운로드할 이미지가 없습니다.');
        return;
    }
    
    for (let i = 0; i < processedImages.length; i++) {
        const img = processedImages[i];
        const index = images.indexOf(img) + 1;
        await downloadSingleImage(img.resultUrl, index);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

function handleReset() {
    if (images.length > 0 && !confirm('모든 작업을 초기화하시겠습니까?')) {
        return;
    }
    
    images = [];
    currentImageIndex = 0;
    savedMaskData = null;
    fileInput.value = '';
    imagesSection.classList.add('hidden');
    canvasSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    removeAllWatermarksBtn.disabled = false;
    history = [];
    historyStep = -1;
    updateUI();
}

function updateUI() {
    if (images.length > 0) {
        imagesSection.classList.remove('hidden');
    } else {
        imagesSection.classList.add('hidden');
        canvasSection.classList.add('hidden');
    }
    
    imageCount.textContent = `(${images.length}개)`;
}

// Make functions global for onclick handlers
window.deleteImage = deleteImage;
window.downloadSingleImage = downloadSingleImage;
