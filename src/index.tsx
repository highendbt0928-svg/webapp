import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GIF Maker - 이미지를 GIF로 변환</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🎬</text></svg>">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .drop-zone {
                border: 2px dashed #cbd5e0;
                transition: all 0.3s ease;
            }
            .drop-zone.drag-over {
                border-color: #4299e1;
                background-color: #ebf8ff;
            }
            .frame-item {
                transition: all 0.2s ease;
                position: relative;
            }
            .frame-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(147, 51, 234, 0.3);
            }
            .frame-item.dragging {
                opacity: 0.5;
                transform: scale(0.95);
            }
            .frame-item.drag-over {
                border-color: #9333ea !important;
                transform: scale(1.05);
                box-shadow: 0 8px 16px rgba(147, 51, 234, 0.4);
            }
            .mode-card {
                border-width: 3px;
            }
            .mode-radio:checked + .mode-card {
                border-color: #9333ea;
                background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
                box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
                transform: scale(1.05);
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 py-6">
                <h1 class="text-3xl font-bold text-gray-900">
                    <i class="fas fa-magic mr-2 text-purple-600"></i>
                    GIF Maker
                </h1>
                <p class="text-gray-600 mt-1">이미지를 업로드하여 애니메이션 GIF를 만들어보세요</p>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8">
            <!-- Mode Selection -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4 text-center">
                    <i class="fas fa-magic mr-2 text-purple-600"></i>
                    변환 모드 선택
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Image to GIF -->
                    <label class="cursor-pointer">
                        <input type="radio" name="conversionMode" value="image-to-gif" class="hidden mode-radio" checked>
                        <div class="mode-card border-3 border-purple-300 rounded-lg p-6 text-center transition hover:shadow-lg bg-white">
                            <div class="text-5xl mb-3">🖼️</div>
                            <h3 class="font-bold text-lg mb-2 text-gray-800">이미지 → GIF</h3>
                            <p class="text-sm text-gray-600">여러 이미지를<br>GIF 애니메이션으로</p>
                        </div>
                    </label>
                    
                    <!-- Image to Video -->
                    <label class="cursor-pointer">
                        <input type="radio" name="conversionMode" value="image-to-video" class="hidden mode-radio">
                        <div class="mode-card border-3 border-gray-300 rounded-lg p-6 text-center transition hover:shadow-lg bg-white">
                            <div class="text-5xl mb-3">🎬</div>
                            <h3 class="font-bold text-lg mb-2 text-gray-800">이미지 → 동영상</h3>
                            <p class="text-sm text-gray-600">여러 이미지를<br>MP4 동영상으로</p>
                        </div>
                    </label>
                    
                    <!-- GIF to Video -->
                    <label class="cursor-pointer">
                        <input type="radio" name="conversionMode" value="gif-to-video" class="hidden mode-radio">
                        <div class="mode-card border-3 border-gray-300 rounded-lg p-6 text-center transition hover:shadow-lg bg-white">
                            <div class="text-5xl mb-3">🎥</div>
                            <h3 class="font-bold text-lg mb-2 text-gray-800">GIF → 동영상</h3>
                            <p class="text-sm text-gray-600">GIF 파일을<br>MP4 동영상으로</p>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Upload Section -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">
                    <i class="fas fa-upload mr-2 text-blue-600"></i>
                    <span id="uploadTitle">이미지 업로드</span>
                </h2>
                
                <div id="dropZone" class="drop-zone rounded-lg p-12 text-center cursor-pointer mb-4">
                    <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
                    <p class="text-lg text-gray-700 mb-2" id="dropZoneText">이미지를 드래그 앤 드롭하거나 클릭하여 선택</p>
                    <p class="text-sm text-gray-500" id="dropZoneSubtext">JPG, PNG, GIF 파일 지원</p>
                    <input type="file" id="fileInput" class="hidden" accept="image/*" multiple>
                </div>

                <button id="selectFilesBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                    <i class="fas fa-folder-open mr-2"></i>
                    파일 선택
                </button>
            </div>

            <!-- Frames Section -->
            <div id="framesSection" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
                <h2 class="text-xl font-semibold mb-4">
                    <i class="fas fa-images mr-2 text-green-600"></i>
                    프레임 관리
                    <span id="frameCount" class="text-sm text-gray-500 ml-2">(0개)</span>
                </h2>
                
                <div class="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 rounded">
                    <p class="text-sm text-purple-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>드래그 앤 드롭으로 순서 변경:</strong> 프레임을 클릭한 채로 드래그하여 원하는 위치로 이동시키세요!
                    </p>
                </div>
                
                <div id="framesList" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    <!-- Frames will be inserted here -->
                </div>

                <div class="flex gap-2">
                    <button id="clearFramesBtn" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                        <i class="fas fa-trash mr-2"></i>
                        모두 삭제
                    </button>
                </div>
            </div>

            <!-- Settings Section -->
            <div id="settingsSection" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
                <h2 class="text-xl font-semibold mb-4">
                    <i class="fas fa-cog mr-2 text-orange-600"></i>
                    GIF 설정
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Frame Speed -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            애니메이션 속도
                        </label>
                        <div class="space-y-3">
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-500 w-12">빠름</span>
                                <input type="range" id="frameSpeed" value="5" min="1" max="20" step="1"
                                    class="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer">
                                <span class="text-xs text-gray-500 w-12 text-right">느림</span>
                            </div>
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-gray-600">현재: <span id="speedDisplay" class="font-bold text-blue-600">보통 (0.5초)</span></span>
                                <span class="text-gray-500">각 프레임이 표시되는 시간</span>
                            </div>
                        </div>
                        <input type="hidden" id="frameDelay" value="500">
                    </div>

                    <!-- Loop Count -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            반복 횟수
                        </label>
                        <input type="number" id="loopCount" value="0" min="0" max="100" 
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">0 = 무한 반복</p>
                    </div>

                    <!-- GIF Size -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            GIF 크기
                        </label>
                        <select id="gifSizePreset" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            <option value="320">작음 (320px - SNS 최적화)</option>
                            <option value="480" selected>보통 (480px - 권장)</option>
                            <option value="640">큼 (640px - 고품질)</option>
                            <option value="800">매우 큼 (800px)</option>
                            <option value="custom">사용자 정의</option>
                        </select>
                        <input type="number" id="gifWidth" value="480" min="100" max="1920" step="10"
                            class="hidden w-full border border-gray-300 rounded-lg px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">높이는 비율에 맞춰 자동 조정됩니다</p>
                    </div>

                    <!-- Quality -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            화질
                        </label>
                        <div class="space-y-3">
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-500 w-16">빠르게</span>
                                <input type="range" id="qualitySlider" value="10" min="1" max="30" step="1"
                                    class="flex-1 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer">
                                <span class="text-xs text-gray-500 w-16 text-right">고품질</span>
                            </div>
                            <div class="text-xs text-gray-600">
                                현재: <span id="qualityDisplay" class="font-bold text-green-600">보통 품질</span>
                            </div>
                        </div>
                        <input type="hidden" id="gifQuality" value="10">
                    </div>

                    <!-- Crossfade Effect -->
                    <div class="md:col-span-2">
                        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                            <label class="flex items-start cursor-pointer mb-3">
                                <input type="checkbox" id="enableCrossfade" class="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mr-3 mt-0.5">
                                <div class="flex-1">
                                    <span class="text-sm font-semibold text-gray-800 flex items-center">
                                        <i class="fas fa-film mr-2 text-purple-600"></i>
                                        부드러운 전환 효과 (크로스페이드)
                                    </span>
                                    <p class="text-xs text-gray-600 mt-1">
                                        프레임이 서서히 페이드되어 자연스럽게 전환됩니다
                                        <br>
                                        <span class="text-purple-700 font-medium">💡 사진 슬라이드쇼나 부드러운 애니메이션에 적합</span>
                                    </p>
                                </div>
                            </label>
                            
                            <div id="crossfadeSettings" class="hidden pl-8 border-l-2 border-purple-300 ml-2">
                                <div class="flex items-center gap-4">
                                    <div class="flex-1">
                                        <label class="block text-xs font-medium text-gray-700 mb-2">
                                            전환 부드러움 정도
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">빠름</span>
                                            <input type="range" id="crossfadeFrames" value="5" min="2" max="10" step="1"
                                                class="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer">
                                            <span class="text-xs text-gray-500">부드러움</span>
                                            <span id="crossfadeValue" class="text-sm font-bold text-purple-600 min-w-[2rem]">5</span>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-1">값이 높을수록 전환이 더 부드럽지만 파일 크기가 커집니다</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Generate Button -->
            <div id="generateSection" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
                <button id="generateBtn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg">
                    <i class="fas fa-magic mr-2"></i>
                    <span id="generateBtnText">GIF 생성하기</span>
                </button>
                
                <div id="progressSection" class="hidden mt-4">
                    <div class="bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div id="progressBar" class="bg-purple-600 h-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p id="progressText" class="text-center text-sm text-gray-600 mt-2">처리 중...</p>
                </div>
            </div>

            <!-- Result Section -->
            <div id="resultSection" class="bg-white rounded-lg shadow-md p-6 hidden">
                <h2 class="text-xl font-semibold mb-4">
                    <i class="fas fa-check-circle mr-2 text-green-600"></i>
                    완성된 GIF
                </h2>
                
                <div class="text-center">
                    <div id="mediaPreview" class="max-w-full mx-auto mb-4">
                        <img id="resultGif" src="" alt="Generated GIF" class="max-w-full mx-auto rounded-lg shadow-lg">
                        <video id="resultVideo" class="max-w-full mx-auto rounded-lg shadow-lg hidden" controls loop autoplay muted></video>
                    </div>
                    
                    <div class="flex flex-wrap gap-3 justify-center mb-4">
                        <button id="downloadBtn" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                            <i class="fas fa-download mr-2"></i>
                            GIF 다운로드
                        </button>
                        <button id="convertToVideoBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                            <i class="fas fa-video mr-2"></i>
                            MP4로 변환
                        </button>
                        <button id="downloadVideoBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition hidden">
                            <i class="fas fa-download mr-2"></i>
                            MP4 다운로드
                        </button>
                        <button id="resetBtn" class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                            <i class="fas fa-redo mr-2"></i>
                            다시 만들기
                        </button>
                    </div>
                    
                    <div id="conversionProgress" class="hidden mb-4">
                        <div class="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
                            <p class="text-sm text-blue-800">
                                <i class="fas fa-spinner fa-spin mr-2"></i>
                                <span id="conversionText">동영상 변환 중...</span>
                            </p>
                        </div>
                    </div>
                    
                    <p id="fileSize" class="text-sm text-gray-600"></p>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t mt-12">
            <div class="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
                <p>© 2025 GIF Maker. Made with Hono + Cloudflare Pages</p>
            </div>
        </footer>

        <!-- gif.js Library -->
        <script src="https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
