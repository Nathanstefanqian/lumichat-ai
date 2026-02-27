import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWechatCallback } from '../api/wechat';
import { Loader2 } from 'lucide-react';

export const WechatCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const { mutate: login, error } = useWechatCallback();

  useEffect(() => {
    if (code) {
      login(code);
    } else {
      navigate('/login');
    }
  }, [code, login, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-500 mb-4">登录失败</div>
        <button 
          onClick={() => navigate('/login')}
          className="text-blue-500 hover:underline"
        >
          返回登录
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-4" />
      <div className="text-gray-600">正在登录中...</div>
    </div>
  );
};
