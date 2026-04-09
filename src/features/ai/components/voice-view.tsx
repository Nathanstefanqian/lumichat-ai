import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Sparkles, Volume2, Type, AudioLines, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { ParticleLoader } from '@/components/ui/particle-loader';

export function VoiceView() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'asr' | 'tts'>('asr');
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [ttsInput, setTtsInput] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const waveHistoryRef = useRef<number[]>([]);

  // 清理动画和计时器
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 10);
    }, 10);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const drawWaveform = (analyser: AnalyserNode) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (mediaRecorderRef.current?.state !== 'recording') return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const average = sum / bufferLength;
      
      waveHistoryRef.current.push(average);
      const maxBars = Math.floor(canvas.width / 5);
      if (waveHistoryRef.current.length > maxBars) waveHistoryRef.current.shift();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerY = canvas.height / 2;
      const barWidth = 3;
      const gap = 2;
      
      waveHistoryRef.current.forEach((val, i) => {
        const x = i * (barWidth + gap);
        const barHeight = Math.max(2, (val / 255) * canvas.height * 0.8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      });

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    draw();
  };

  const handleAsr = async (blob: Blob) => {
    setStatus('thinking');
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://nest.hopai.cn';
      
      // 1. 先进行 ASR 识别文字
      const asrResponse = await fetch(`${apiUrl}/common/asr`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const asrResult = await asrResponse.json();
      const asrData = asrResult.data || asrResult;
      const text = typeof asrData === 'string' ? asrData : (asrData.text || '');

      if (!text) {
        toast.error('未能识别出文字');
        setStatus('idle');
        return;
      }

      setTranscribedText(text);
      
      // 2. 调用 voice-chat 接口获取 AI 回复并朗读
      const chatResponse = await fetch(`${apiUrl}/ai/voice-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      const chatResult = await chatResponse.json();
      const chatData = chatResult.data || chatResult;

      if (chatData.audioUrl) {
        setStatus('speaking');
        const audio = new Audio(chatData.audioUrl);
        audio.onended = () => setStatus('idle');
        await audio.play();
        toast.success('欣妍回复啦');
      } else {
        toast.error('获取 AI 回复失败');
        setStatus('idle');
      }
    } catch (err: any) {
      console.error('Voice chat failed', err);
      toast.error('流程失败: ' + err.message);
      setStatus('idle');
    }
  };

  const handleTts = async () => {
    if (!ttsInput.trim()) {
      toast.error('请输入文字');
      return;
    }

    setStatus('thinking');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://nest.hopai.cn';
      const response = await fetch(`${apiUrl}/ai/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: ttsInput })
      });

      const result = await response.json();
      const data = result.data || result;
      
      if (data.audioUrl) {
        setStatus('speaking');
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setStatus('idle');
        await audio.play();
      } else {
        toast.error('合成语音失败');
        setStatus('idle');
      }
    } catch (err: any) {
      console.error('TTS failed', err);
      toast.error('合成失败: ' + err.message);
      setStatus('idle');
    }
  };

  const startRecording = async () => {
    try {
      setTranscribedText('');
      waveHistoryRef.current = [];
      setStatus('listening');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopTimer();
        setIsRecording(false);
        if (chunks.length === 0) {
          toast.error('未能采集到音频数据，请重试');
          setStatus('idle');
          return;
        }
        const audioBlob = new Blob(chunks, { type: mimeType });
        await handleAsr(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      startTimer();
      drawWaveform(analyser);
    } catch (err) {
      console.error('Failed to start recording', err);
      toast.error('无法访问麦克风，请检查权限设置');
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  return (
    <div className="flex-1 flex flex-col theme-bg theme-text relative overflow-hidden font-mono">
      {/* 顶部 Tab 切换 */}
      <div className="pt-8 flex justify-center z-10">
        <div className="bg-black/5 dark:bg-white/5 p-1 rounded-xl border theme-border flex gap-1">
          <button
            onClick={() => setActiveTab('asr')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'asr' ? "bg-primary text-primary-foreground shadow-sm" : "opacity-60 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <AudioLines className="w-4 h-4" />
            语音转文字
          </button>
          <button
            onClick={() => setActiveTab('tts')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'tts' ? "bg-primary text-primary-foreground shadow-sm" : "opacity-60 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Type className="w-4 h-4" />
            文字转语音
          </button>
        </div>
      </div>

      {/* 状态指示 */}
      <div className="pt-8 pb-4 text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          {status === 'idle' && <Sparkles className="w-4 h-4 text-gray-400" />}
          {status === 'listening' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          {status === 'thinking' && (
            <div className="w-4 h-4 relative">
              <Loader2 className="w-full h-full text-primary animate-spin" />
            </div>
          )}
          {status === 'speaking' && <Volume2 className="w-4 h-4 text-green-500 animate-bounce" />}
          <span className="text-xs font-medium uppercase tracking-widest opacity-60">
            {status === 'idle' && '欣妍 Ready'}
            {status === 'listening' && '欣妍 is Listening'}
            {status === 'thinking' && '欣妍 is Working'}
            {status === 'speaking' && '欣妍 is Speaking'}
          </span>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 gap-8">
        {status === 'thinking' ? (
          <div className="w-64 h-64 relative">
            <ParticleLoader />
          </div>
        ) : activeTab === 'asr' ? (
          /* ASR Tab 内容 */
          <>
            <div className="w-full max-w-4xl h-40 bg-black/5 dark:bg-white/5 rounded-2xl border theme-border relative overflow-hidden">
              <canvas ref={canvasRef} width={1200} height={200} className="w-full h-full opacity-80" />
              {!isRecording && status === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-20 gap-2">
                  <Mic className="w-5 h-5" />
                  <span>点击下方按钮开始录音识别</span>
                </div>
              )}
            </div>

            <div className="w-full max-w-2xl min-h-[100px] p-6 bg-black/5 dark:bg-white/5 rounded-2xl border theme-border relative">
              <div className="absolute top-3 left-4 text-[10px] uppercase tracking-widest opacity-30 font-bold">Transcription</div>
              <p className="text-sm leading-relaxed pt-4">
                {isRecording ? '正在录音...' : (transcribedText || (status === ('thinking' as any) ? '正在识别...' : '识别结果将显示在这里'))}
              </p>
              {transcribedText && (
                <button 
                  onClick={() => setTranscribedText('')}
                  className="absolute bottom-3 right-4 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg opacity-40 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-4xl font-light tracking-tighter tabular-nums opacity-80">
              {formatTime(recordingTime)}
            </div>
          </>
        ) : (
          /* TTS Tab 内容 */
          <div className="w-full max-w-2xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full p-6 bg-black/5 dark:bg-white/5 rounded-2xl border theme-border relative min-h-[200px] flex flex-col">
              <div className="absolute top-3 left-4 text-[10px] uppercase tracking-widest opacity-30 font-bold">Input Text</div>
              <textarea
                value={ttsInput}
                onChange={(e) => setTtsInput(e.target.value)}
                placeholder="输入想要 MOSS 朗读的文字..."
                className="w-full flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed pt-4 placeholder:opacity-20"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-[10px] opacity-30 font-bold uppercase">{ttsInput.length} chars</span>
                <button 
                  onClick={() => setTtsInput('')}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg opacity-40 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleTts}
              disabled={(status as any) === 'thinking' || status === 'speaking' || !ttsInput.trim()}
              className={cn(
                "w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                "bg-primary text-primary-foreground shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              )}
            >
              {(status as any) === 'thinking' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Let MOSS Speak
            </button>
          </div>
        )}
      </div>

      {/* 底部录制按钮 (仅 ASR Tab 显示) */}
      {activeTab === 'asr' && (
        <div className="pb-16 flex flex-col items-center gap-6 z-10">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={status === 'thinking' || status === 'speaking'}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative",
              isRecording 
                ? "bg-red-500 hover:bg-red-600 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)] text-white" 
                : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl"
            )}
          >
            {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
            {isRecording && <div className="absolute inset-0 -m-2 rounded-full border border-red-500/30 animate-ping" />}
          </button>
          
          <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
            {isRecording ? 'Tap to stop' : 'Tap to record'}
          </p>
        </div>
      )}
    </div>
  );
}
