import React, { useState, useEffect, useRef } from 'react';
import { analyzePlasticImage } from './services/geminiService';
import { AnalysisResult, AppState, HistoryItem, User } from './types';
import AnalysisView from './components/AnalysisView';
import { Upload, Loader2, Leaf, Camera, Moon, Sun, History, LogOut, User as UserIcon, X, ChevronRight, LayoutDashboard, Ruler, BrickWall, AlertCircle, Circle } from 'lucide-react';

// Helper to create small thumbnails for history storage
const createThumbnail = async (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          resolve(base64); // Fallback
          return;
      }
      
      // Calculate new dimensions (max height 100px)
      const scale = 100 / img.height;
      canvas.height = 100;
      canvas.width = img.width * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Use lower quality jpeg for thumbnail
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(base64); // Fallback on error
    img.src = base64;
  });
};

const App: React.FC = () => {
  // Initialize state from local storage where possible
  const [state, setState] = useState<AppState>(() => {
    const savedUser = localStorage.getItem('ecobrick_user');
    const savedHistory = localStorage.getItem('ecobrick_history');
    const savedTheme = localStorage.getItem('ecobrick_theme');
    
    return {
      view: savedUser ? 'dashboard' : 'login',
      isAnalyzing: false,
      error: null,
      result: null,
      currentImage: null,
      user: savedUser ? JSON.parse(savedUser) : null,
      history: savedHistory ? JSON.parse(savedHistory) : [],
      darkMode: savedTheme === 'dark'
    };
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Theme Effect
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ecobrick_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ecobrick_theme', 'light');
    }
  }, [state.darkMode]);

  // History Persistence Effect
  useEffect(() => {
    try {
        localStorage.setItem('ecobrick_history', JSON.stringify(state.history));
    } catch (e) {
        console.error("Failed to save history:", e);
    }
  }, [state.history]);

  // Camera Setup Effect
  // This ensures the video element gets the stream once both the modal is open (element exists) and stream is ready.
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [showCamera, cameraStream]);

  // Login Handler (Mock)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
        const user: User = { email, name: email.split('@')[0] };
        localStorage.setItem('ecobrick_user', JSON.stringify(user));
        setState(prev => ({ ...prev, user, view: 'dashboard' }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ecobrick_user');
    setState(prev => ({ ...prev, user: null, view: 'login' }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        startAnalysis(file, base64);
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = (file: File, base64: string) => {
    setState(prev => ({ 
        ...prev, 
        currentImage: base64, 
        isAnalyzing: true, 
        error: null,
        view: 'analysis' 
    }));
    processAnalysis(file, base64);
  };

  const processAnalysis = async (file: File, base64Img: string) => {
    try {
      const result = await analyzePlasticImage(file);
      
      // Generate a small thumbnail for storage to avoid LocalStorage limits
      const thumbnail = await createThumbnail(base64Img);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        result,
        thumbnail: thumbnail
      };

      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        result,
        history: [newHistoryItem, ...prev.history] 
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message || "Something went wrong during analysis."
      }));
    }
  };

  // --- Camera Logic ---
  const startCamera = async () => {
    setShowCamera(true);
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      // Set stream to state to trigger the useEffect
      setCameraStream(stream);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Could not access camera. Please allow camera permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            const base64 = canvas.toDataURL('image/jpeg');
            stopCamera();
            startAnalysis(file, base64);
          }
        }, 'image/jpeg');
      }
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setState(prev => ({
        ...prev,
        result: item.result,
        currentImage: item.thumbnail,
        view: 'analysis'
    }));
    setShowHistory(false);
  };

  // --- Views ---

  if (state.view === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300 font-sans">
        
        {/* Main Login Card */}
        <div className="bg-white dark:bg-slate-900 w-full max-w-[350px] border border-gray-300 dark:border-slate-800 flex flex-col items-center py-10 px-10 mb-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
             <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
                <Leaf className="w-6 h-6 fill-current" />
             </div>
             <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">EcoBrickAI</span>
          </div>
  
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-2">
              <input 
                  type="email" 
                  required
                  className="w-full px-2 py-2.5 rounded-[3px] border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-xs placeholder-gray-500 focus:ring-1 focus:ring-gray-400 outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
              />
              <input 
                  type="password" 
                  required
                  className="w-full px-2 py-2.5 rounded-[3px] border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-xs placeholder-gray-500 focus:ring-1 focus:ring-gray-400 outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
              />
              
              <button 
                  type="submit" 
                  disabled={!email || !password}
                  className="w-full py-1.5 mt-2 bg-[#86efac] hover:bg-emerald-400 text-white font-bold rounded-[4px] text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                  Log in
              </button>
          </form>
  
          <div className="w-full flex items-center gap-4 my-6">
              <div className="h-px bg-gray-300 dark:bg-slate-700 flex-1"></div>
              <span className="text-xs text-gray-400 font-bold">OR</span>
              <div className="h-px bg-gray-300 dark:bg-slate-700 flex-1"></div>
          </div>
  
          <button type="button" className="text-[#385185] dark:text-blue-400 font-semibold text-sm mb-4 hover:underline">
              Log in with Google
          </button>
  
          <button type="button" className="text-[#00376b] dark:text-blue-300 text-xs hover:underline">
              Forgot password?
          </button>
        </div>
  
        {/* Sign Up Card */}
        <div className="bg-white dark:bg-slate-900 w-full max-w-[350px] border border-gray-300 dark:border-slate-800 py-5 text-center mb-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <p className="text-sm text-gray-800 dark:text-slate-200">
              Don't have an account? <button type="button" className="text-emerald-500 font-bold hover:underline">Sign up</button>
          </p>
        </div>
  
        {/* Get the app */}
        <div className="text-center">
          <p className="text-sm text-gray-800 dark:text-slate-200 mb-4">Get the app.</p>
          <div className="flex justify-center gap-2">
              <button className="bg-black text-white px-3 py-1.5 rounded flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <svg viewBox="0 0 384 512" fill="currentColor" className="w-5 h-5"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 46.9 126.7 89.8 126.7 19.6 0 38.5-16.8 53.3-16.8s33.6 16.8 54.7 16.8c29.6 0 60.8-79.3 82.8-126.7 20.3-43.4 20.5-61.7 5.2-82.3-9.9-13.2-22.9-20.3-39.8-20.3z"/></svg>
                  <div className="text-left">
                      <div className="text-[10px] leading-tight">Download on the</div>
                      <div className="text-sm font-semibold leading-tight">App Store</div>
                  </div>
              </button>
               <button className="bg-black text-white px-3 py-1.5 rounded flex items-center gap-2 hover:opacity-80 transition-opacity">
                   <svg viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                  <div className="text-left">
                      <div className="text-[10px] leading-tight">GET IT ON</div>
                      <div className="text-sm font-semibold leading-tight">Google Play</div>
                  </div>
              </button>
          </div>
        </div>
  
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div 
                onClick={() => setState(prev => ({ ...prev, view: 'dashboard', result: null, currentImage: null }))}
                className="flex items-center gap-2 cursor-pointer group"
            >
                <div className="bg-emerald-600 p-2 rounded-lg text-white group-hover:bg-emerald-500 transition-colors">
                    <Leaf className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-emerald-900 dark:text-emerald-500">EcoBrick AI</span>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <button 
                    onClick={() => setShowHistory(true)}
                    className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                    title="History"
                >
                    <History className="w-5 h-5" />
                    {state.history.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
                <button 
                    onClick={() => setState(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                    className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    {state.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{state.user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">Engineer</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative">
        
        {/* Camera Modal */}
        {showCamera && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-auto aspect-[3/4] object-cover"
                    />
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
                        <button 
                            onClick={stopCamera}
                            className="p-3 rounded-full bg-gray-800/50 text-white hover:bg-gray-700/50 backdrop-blur"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={capturePhoto}
                            className="p-1 rounded-full border-4 border-white/30 hover:border-white/60 transition-colors"
                        >
                            <div className="w-16 h-16 bg-white rounded-full"></div>
                        </button>
                        <div className="w-12"></div> {/* Spacer for alignment */}
                    </div>
                </div>
            </div>
        )}

        {/* History Sidebar Overlay */}
        {showHistory && (
             <div className="fixed inset-0 z-50 flex justify-end">
                <div 
                    className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowHistory(false)}
                ></div>
                <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-right">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-emerald-600" />
                            Scan History
                        </h3>
                        <button 
                            onClick={() => setShowHistory(false)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {state.history.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-slate-500 py-10">No history found.</p>
                        ) : (
                            state.history.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => loadHistoryItem(item)}
                                    className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer group transition-all"
                                >
                                    <img src={item.thumbnail} className="w-16 h-16 rounded-lg object-cover" alt="thumbnail" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{item.result.category}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(item.date).toLocaleDateString()} • {item.result.brickType}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
             </div>
        )}

        {state.view === 'analysis' && state.result ? (
             <AnalysisView 
                result={state.result} 
                imageSrc={state.currentImage} 
                onReset={() => setState(prev => ({ ...prev, view: 'dashboard', result: null, currentImage: null }))}
                onBack={() => setState(prev => ({ ...prev, view: 'dashboard' }))}
             />
        ) : (
             /* Dashboard View */
             <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                  <span className="text-emerald-600 dark:text-emerald-500">Scan Plastic</span> to Build Better
                </h1>
                <p className="text-lg text-gray-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
                  Upload an image of plastic waste to instantly identify its type (LDPE, HDPE, PET, etc.) and get AI-optimized brick manufacturing recipes.
                </p>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl dark:shadow-emerald-900/10 border-2 border-emerald-100/50 dark:border-emerald-900/30 relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors max-w-xl mx-auto">
                    
                    {state.isAnalyzing ? (
                        <div className="flex flex-col items-center py-12">
                            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                            <p className="text-lg font-medium text-gray-700 dark:text-slate-200">Analyzing molecular visual cues...</p>
                            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">Classifying plastic & estimating thickness</p>
                        </div>
                    ) : (
                        <>
                            <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-slate-800/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer relative group-hover:border-emerald-400 dark:group-hover:border-emerald-600">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileUpload} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-md mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Upload Plastic Image</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Drag & drop or click to browse</p>
                                
                                <div className="mt-6 flex items-center gap-4 w-full">
                                    <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
                                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase font-bold">Or</span>
                                    <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering file input
                                        startCamera();
                                    }}
                                    className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 px-6 py-2.5 rounded-full transition-colors z-20 relative"
                                >
                                    <Camera className="w-4 h-4" />
                                    Use Camera
                                </button>
                            </div>
                        </>
                    )}

                    {state.error && (
                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2 text-sm border border-red-100 dark:border-red-900/30">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {state.error}
                        </div>
                    )}
                </div>

                 <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                           <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">AI Classification</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Identifies 7+ plastic types using advanced vision models.</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 dark:text-orange-400">
                           <Ruler className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Micron Estimator</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Visually estimates thickness to ensure brick durability.</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                           <BrickWall className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Mix Calculator</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Auto-calculates sand, soil, and cement ratios.</p>
                    </div>
                </div>
             </div>
        )}
      </main>
    </div>
  );
};

export default App;