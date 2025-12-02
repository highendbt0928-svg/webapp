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
            }
            .frame-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .frame-item.dragging {
                opacity: 0.5;
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
            <!-- Upload Section -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">
                    <i class="fas fa-upload mr-2 text-blue-600"></i>
                    이미지 업로드
                </h2>
                
                <div id="dropZone" class="drop-zone rounded-lg p-12 text-center cursor-pointer mb-4">
                    <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
                    <p class="text-lg text-gray-700 mb-2">이미지를 드래그 앤 드롭하거나 클릭하여 선택</p>
                    <p class="text-sm text-gray-500">JPG, PNG, GIF 파일 지원</p>
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
                    <!-- Frame Delay -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            프레임 지연 시간 (밀리초)
                        </label>
                        <input type="number" id="frameDelay" value="500" min="10" max="5000" step="10"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">각 프레임이 표시되는 시간 (낮을수록 빠름)</p>
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

                    <!-- GIF Width -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            GIF 너비 (픽셀)
                        </label>
                        <input type="number" id="gifWidth" value="480" min="100" max="1920" step="10"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">높이는 비율에 맞춰 자동 조정됩니다</p>
                    </div>

                    <!-- Quality -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            품질 (1-30)
                        </label>
                        <input type="number" id="gifQuality" value="10" min="1" max="30"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <p class="text-xs text-gray-500 mt-1">낮을수록 고품질 (처리 시간 증가)</p>
                    </div>
                </div>
            </div>

            <!-- Generate Button -->
            <div id="generateSection" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
                <button id="generateBtn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg">
                    <i class="fas fa-magic mr-2"></i>
                    GIF 생성하기
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
                    <img id="resultGif" src="" alt="Generated GIF" class="max-w-full mx-auto rounded-lg shadow-lg mb-4">
                    
                    <div class="flex gap-4 justify-center">
                        <button id="downloadBtn" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                            <i class="fas fa-download mr-2"></i>
                            다운로드
                        </button>
                        <button id="resetBtn" class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                            <i class="fas fa-redo mr-2"></i>
                            다시 만들기
                        </button>
                    </div>
                    
                    <p id="fileSize" class="text-sm text-gray-600 mt-4"></p>
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
