import { LoginForm } from '../components/login-form';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center theme-page p-4">
      <div className="w-full max-w-md bg-card/80 text-card-foreground backdrop-blur-md rounded-3xl shadow-xl p-8 border border-border">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl shadow-lg transform -rotate-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              欢迎回来!
            </h1>
            <p className="text-sm theme-subtle mt-2">
              登录以开启您的 AI 创意之旅 ✨
            </p>
          </div>
        </div>
        
        <LoginForm />
        
        <div className="mt-8 text-center text-xs theme-subtle">
          <p>
            还没有账号? <Link to="/register" className="text-purple-500 hover:text-purple-600 font-medium">立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
