import { useState } from 'react';
import { PlaneShooterGame } from '../components/plane-shooter-game';
import { GomokuGame } from '../components/gomoku/gomoku-game';
import { WatermelonGame } from '../components/watermelon/watermelon-game';
import { BilliardsGame } from '../components/billiards/billiards-game';
import { FlappyBirdGame } from '../components/flappy-bird-game';
import { ZumaGame } from '../components/zuma/zuma-game';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2, Grid3X3, Circle, CircleDot, Bird } from 'lucide-react';
import { CartoonFlame } from '@/components/ui/cartoon-flame';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type GameType = 'plane-shooter' | 'gomoku' | 'watermelon' | 'billiards' | 'flappy-bird' | 'zuma';

interface GameInfo {
  id: GameType;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const GAMES: GameInfo[] = [
  {
    id: 'zuma',
    title: '幻彩祖玛',
    description: '精准射击，消除彩色球串！',
    icon: CircleDot,
    color: 'text-purple-500',
  },
  {
    id: 'flappy-bird',
    title: '笨鸟先飞',
    description: '挑战极限，你能飞多远？',
    icon: Bird,
    color: 'text-yellow-500',
  },
  {
    id: 'plane-shooter',
    title: '星际战机',
    description: '驾驶战机，击退敌人的进攻！',
    icon: Gamepad2,
    color: 'text-orange-500',
  },
  {
    id: 'gomoku',
    title: '五子棋',
    description: '经典五子棋对战，支持在线联机。',
    icon: Grid3X3,
    color: 'text-emerald-500',
  },
  {
    id: 'watermelon',
    title: '合成大西瓜',
    description: '趣味物理合成游戏，合成最大的西瓜！',
    icon: Circle,
    color: 'text-lime-500',
  },
  {
    id: 'billiards',
    title: '3D 台球',
    description: '真实物理引擎的 3D 台球体验。',
    icon: CircleDot,
    color: 'text-teal-500',
  },
];

export function GameCenter() {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);

  const handleBack = () => {
    setActiveGame(null);
  };

  if (activeGame) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="absolute top-4 left-4 z-50">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleBack}
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full shadow-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 h-full overflow-hidden">
          {activeGame === 'plane-shooter' && <PlaneShooterGame />}
          {activeGame === 'gomoku' && <GomokuGame />}
          {activeGame === 'watermelon' && <WatermelonGame />}
          {activeGame === 'billiards' && <BilliardsGame />}
          {activeGame === 'flappy-bird' && <FlappyBirdGame />}
          {activeGame === 'zuma' && <ZumaGame />}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto relative">
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          游戏中心
        </h1>
        <CartoonFlame className="-mt-12 scale-75 md:scale-100" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {GAMES.map((game) => (
          <Card 
            key={game.id} 
            className="group hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer overflow-hidden relative flex flex-col h-full"
            onClick={() => setActiveGame(game.id)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={cn("p-2.5 md:p-3 rounded-xl bg-secondary group-hover:scale-110 transition-transform duration-300", game.color)}>
                    <game.icon className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <CardTitle className="text-lg md:text-xl group-hover:text-primary transition-colors">
                    {game.title}
                  </CardTitle>
                </div>
                {game.id === 'zuma' && (
                  <CartoonFlame className="scale-50 -mr-4" />
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-4 md:p-6 pt-0 md:pt-0">
              <CardDescription className="text-sm md:text-base line-clamp-2">
                {game.description}
              </CardDescription>
            </CardContent>
            
            <CardFooter className="mt-auto p-4 md:p-6 pt-0 md:pt-0">
              <Button className="w-full h-9 md:h-10 text-sm md:text-base bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                开始游戏
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
