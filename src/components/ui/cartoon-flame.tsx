import React from 'react';

/**
 * 极简扁平化卡通火焰组件
 * 
 * 风格：极简扁平化卡通
 * 颜色：#FFE566 (黄), #FF7A00 (橙), #E63900 (红)
 * 尺寸：60px x 80px
 * 动画：上下轻微跳动
 */
export const CartoonFlame: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`relative inline-block w-[60px] h-[80px] ${className}`}>
      <style>
        {`
          @keyframes flame-jump {
            0%, 100% { transform: translateY(0) scaleY(1); }
            50% { transform: translateY(-4px) scaleY(1.05); }
          }
          .animate-flame {
            animation: flame-jump 1.5s ease-in-out infinite;
            transform-origin: bottom center;
          }
        `}
      </style>
      <svg
        width="60"
        height="80"
        viewBox="0 0 60 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-flame"
      >
        {/* 外层火焰 (红) */}
        <path
          d="M30 80C10 80 0 60 0 40C0 25 10 15 15 5C18 12 22 8 25 18C28 8 38 12 42 22C48 10 55 20 58 35C62 55 50 80 30 80Z"
          fill="#E63900"
        />
        {/* 中层火焰 (橙) */}
        <path
          d="M30 75C18 75 10 60 10 45C10 35 15 28 18 20C22 28 25 25 28 32C32 22 38 28 40 35C45 25 48 32 50 40C52 55 42 75 30 75Z"
          fill="#FF7A00"
        />
        {/* 内层火焰 (黄) */}
        <path
          d="M30 65C22 65 18 55 18 45C18 38 22 35 24 30C26 35 28 33 30 38C32 30 36 35 38 40C40 35 42 38 42 45C42 55 38 65 30 65Z"
          fill="#FFE566"
        />
      </svg>
    </div>
  );
};

export default CartoonFlame;
