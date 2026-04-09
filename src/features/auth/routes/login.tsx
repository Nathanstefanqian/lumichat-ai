import { useMemo } from 'react';
import { LoginForm } from '../components/login-form';
import { RegisterForm } from '../components/register-form';
import { OceanBackground } from '@/components/ui/ocean-background';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('mode') === 'register' ? 'register' : 'login';

  // 性能优化：检测移动端以调整渲染复杂度
  const isMobile = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0f172a]">
      <OceanBackground />
      
      {/* Decorative Orbs - 移动端减少模糊半径以提升性能 */}
      <div className={cn(
        "absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full pointer-events-none",
        isMobile ? "blur-[60px]" : "blur-[120px]"
      )} />
      <div className={cn(
        "absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/20 rounded-full pointer-events-none",
        isMobile ? "blur-[60px]" : "blur-[120px]"
      )} />

      <div className="w-full max-w-[380px] z-10 relative animate-in fade-in zoom-in duration-700">
        {/* 性能关键：移动端减弱 backdrop-blur，这是移动端卡顿的主要原因 */}
        <div className={cn(
          "bg-card/30 rounded-[2.5rem] p-1 border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]",
          isMobile ? "backdrop-blur-xl" : "backdrop-blur-3xl"
        )}>
          <div className="bg-gradient-to-b from-white/5 to-transparent rounded-[2.4rem] p-6 md:p-8">
            <div className="flex flex-col items-center space-y-4 mb-8">
              <div className="relative group">
                {/* 移动端减弱光晕模糊 */}
                <div className={cn(
                  "absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200",
                  isMobile ? "blur-sm" : "blur"
                )} />
                <div className="relative w-16 h-16 rounded-2xl shadow-2xl transform -rotate-6 overflow-hidden border border-white/10 p-1 bg-black/20 backdrop-blur-sm transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110">
                  <img src="/logo.jpg" alt="Lumi" className="w-full h-full object-cover rounded-xl" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
                  Lumi
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <span className="h-px w-3 bg-indigo-500/50" />
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                    Personalized AI Agent Hub
                  </p>
                  <span className="h-px w-3 bg-indigo-500/50" />
                </div>
              </div>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-black/40 p-1 mb-8 border border-white/5">
                <TabsTrigger 
                  value="login" 
                  className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-500 font-bold text-xs"
                >
                  登录
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-500 font-bold text-xs"
                >
                  注册
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                <LoginForm />
              </TabsContent>
              
              <TabsContent value="register" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                <RegisterForm />
              </TabsContent>
            </Tabs>

            <div className="mt-10 text-center">
              <p className="text-[10px] text-white/30 font-medium leading-relaxed max-w-[240px] mx-auto">
                登录即代表您同意 <span className="text-white/50 underline cursor-pointer hover:text-indigo-400 transition-colors">服务协议</span> 和 <span className="text-white/50 underline cursor-pointer hover:text-indigo-400 transition-colors">隐私政策</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
