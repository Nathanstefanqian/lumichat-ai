import { useState } from 'react';
import { useGomokuSocket } from '../../hooks/use-gomoku-socket';
import { GomokuBoard } from './gomoku-board';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function GomokuGame() {
  const [roomId, setRoomId] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const { gameState, isConnected, error, createRoom, joinRoom, joinGame, makeMove, restartGame, leaveGame } = useGomokuSocket();
  const user = useAuthStore(state => state.user);

  const handleCreate = () => {
      createRoom();
  };

  const handleJoin = () => {
    if (roomId.trim()) {
      joinRoom(roomId.trim());
    }
  };
  
  const handleLeave = () => {
      if (gameState) {
        leaveGame(gameState.roomId);
        setRoomId('');
        setShowJoinInput(false);
      }
  }

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 p-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">五子棋 (Gomoku)</h1>
        
        {!showJoinInput ? (
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button size="lg" onClick={handleCreate} className="w-full text-lg h-14 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg">
                    创建房间
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowJoinInput(true)} className="w-full text-lg h-14 border-2">
                    加入房间
                </Button>
            </div>
        ) : (
            <div className="flex flex-col gap-4 w-full max-w-xs animate-in fade-in slide-in-from-bottom-4">
                <Input 
                    placeholder="输入 6 位房间号..." 
                    value={roomId} 
                    onChange={(e) => setRoomId(e.target.value)}
                    className="h-12 text-center text-lg bg-background/50 backdrop-blur"
                    maxLength={6}
                />
                <Button size="lg" onClick={handleJoin} disabled={!roomId.trim()} className="w-full h-12">
                    进入房间
                </Button>
                <Button variant="ghost" onClick={() => setShowJoinInput(false)}>
                    返回
                </Button>
            </div>
        )}

        {error && (
            <div className="text-destructive bg-destructive/10 px-4 py-2 rounded-lg animate-pulse">
                {error === 'Room not found' ? '房间不存在，请检查房间号' : error}
            </div>
        )}
        
        {!isConnected && <p className="text-sm text-muted-foreground">正在连接服务器...</p>}
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.userId === user?.userId);
  const isSpectator = !currentPlayer;
  const isMyTurn = gameState.currentTurn === currentPlayer?.color;
  
  let statusText = '';
  if (gameState.status === 'waiting') {
      statusText = '等待玩家加入...';
  } else if (gameState.status === 'playing') {
      statusText = `当前回合: ${gameState.currentTurn === 'black' ? '黑棋' : '白棋'} ${isMyTurn ? '(你)' : ''}`;
  } else if (gameState.status === 'finished') {
      if (gameState.winner === 'draw') {
          statusText = '平局!';
      } else {
          statusText = `${gameState.winner === 'black' ? '黑棋' : '白棋'} 获胜!`;
      }
  }

  const handleJoinGame = () => {
    if (gameState) {
        joinGame(gameState.roomId);
    }
  };

  return (
    <div className="flex flex-col items-center h-full p-4 overflow-y-auto w-full">
      <div className="flex justify-between w-full max-w-2xl mb-6 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div>
           <h2 className="text-lg font-bold flex items-center gap-2">
               <span className="select-all">房间: {gameState.roomId}</span>
               <span className={`px-2 py-0.5 rounded-full text-xs ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {isConnected ? '已连接' : '断开'}
               </span>
           </h2>
           <div className="text-sm text-muted-foreground mt-1">
             <div className="flex flex-col gap-1">
                 {gameState.players.map(p => (
                     <span key={p.userId} className="flex items-center gap-1">
                         <span className={`w-3 h-3 rounded-full inline-block ${p.color === 'black' ? 'bg-black' : 'bg-white border border-gray-400'}`}></span>
                         {p.username} {p.userId === user?.userId && '(你)'}
                     </span>
                 ))}
                 {gameState.players.length === 0 && <span>暂无玩家</span>}
             </div>
           </div>
        </div>
        <div className="flex gap-2">
             {isSpectator && gameState.players.length < 2 && (
                 <Button size="sm" onClick={handleJoinGame}>加入对局</Button>
             )}
             <Button variant="outline" size="sm" onClick={handleLeave}>离开</Button>
             {gameState.status === 'finished' && !isSpectator && (
                 <Button size="sm" onClick={() => restartGame(gameState.roomId)}>再来一局</Button>
             )}
        </div>
      </div>

      <div className="mb-6 text-xl font-bold">
        {gameState.status === 'finished' ? (
            <span className={gameState.winner === 'draw' ? 'text-gray-500' : 'text-primary'}>{statusText}</span>
        ) : (
            <span>{statusText}</span>
        )}
      </div>
      
      {error && <div className="text-destructive mb-4 bg-destructive/10 p-2 rounded px-4">{error}</div>}

      <div className="relative">
          <GomokuBoard 
            board={gameState.board} 
            onMove={(x, y) => makeMove(x, y, gameState.roomId)}
            disabled={isSpectator || (!isMyTurn && gameState.status === 'playing') || gameState.status !== 'playing'} 
          />
          {gameState.status === 'waiting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-lg">
                  <div className="bg-background/90 p-6 rounded-xl shadow-xl text-center border max-w-sm mx-4">
                      <div className="mb-4">
                          <div className="text-4xl font-mono font-bold tracking-widest text-primary mb-2 select-all cursor-pointer" onClick={() => {
                              navigator.clipboard.writeText(gameState.roomId);
                          }}>
                              {gameState.roomId}
                          </div>
                          <p className="text-sm text-muted-foreground">房间号 (点击复制)</p>
                      </div>
                      <p className="font-semibold mb-2">等待对手加入...</p>
                      <p className="text-sm text-muted-foreground">请将房间号发送给好友</p>
                  </div>
              </div>
          )}
      </div>
      
      <div className="mt-8 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-xl border shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>玩家</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{gameState.players.length}/2</span>
              </h3>
              <ul className="space-y-2">
                  {gameState.players.map(p => (
                      <li key={p.userId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <span className={`w-4 h-4 rounded-full shadow-sm ${p.color === 'black' ? 'bg-black' : 'bg-white border border-gray-300'}`}></span>
                          <span className="font-medium">{p.username}</span>
                          {p.userId === user?.userId && <span className="text-xs text-muted-foreground">(你)</span>}
                          {gameState.currentTurn === p.color && gameState.status === 'playing' && (
                              <span className="ml-auto text-xs text-primary animate-pulse">思考中...</span>
                          )}
                      </li>
                  ))}
                  {gameState.players.length === 0 && <li className="text-muted-foreground text-sm">等待玩家加入...</li>}
              </ul>
          </div>
          
          <div className="bg-card p-4 rounded-xl border shadow-sm">
               <h3 className="font-semibold mb-3 flex items-center gap-2">
                   <span>观众</span>
                   <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{gameState.spectators.length}</span>
               </h3>
               <ul className="space-y-2 text-sm">
                   {gameState.spectators.map(s => (
                       <li key={s.userId} className="p-2 rounded-lg bg-muted/30 flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                           {s.username}
                       </li>
                   ))}
                   {gameState.spectators.length === 0 && <li className="text-muted-foreground text-sm italic">暂无观众</li>}
               </ul>
          </div>
      </div>
    </div>
  );
}
