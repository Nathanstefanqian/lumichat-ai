import React from 'react';
import { cn } from '@/lib/utils';

interface GomokuBoardProps {
  board: (string | null)[][];
  onMove: (x: number, y: number) => void;
  disabled?: boolean;
}

export function GomokuBoard({ board, onMove, disabled }: GomokuBoardProps) {
  return (
    <div className="bg-[#e4c590] p-1 md:p-4 rounded-lg shadow-xl select-none w-full max-w-[min(90vw,600px)] aspect-square mx-auto">
      <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-0 border-2 border-black bg-[#e4c590] w-full h-full">
        {board.map((row, y) => (
            <React.Fragment key={y}>
                {row.map((cell, x) => (
                    <div
                        key={`${x}-${y}`}
                        className={cn(
                            "w-full aspect-square border-[0.5px] border-black/40 flex items-center justify-center cursor-pointer relative",
                            !disabled && "hover:bg-black/5"
                        )}
                        onClick={() => !disabled && onMove(x, y)}
                    >
                        {cell === 'black' && (
                        <div className="w-[80%] h-[80%] bg-black rounded-full shadow-sm" />
                        )}
                        {cell === 'white' && (
                        <div className="w-[80%] h-[80%] bg-white rounded-full shadow-sm border border-gray-300" />
                        )}
                        
                        {/* Dot points for standard board feel (optional, simplified) */}
                        {((x === 3 && y === 3) || (x === 11 && y === 3) || (x === 7 && y === 7) || (x === 3 && y === 11) || (x === 11 && y === 11)) && !cell && (
                            <div className="absolute w-1.5 h-1.5 bg-black rounded-full opacity-50"></div>
                        )}
                    </div>
                ))}
            </React.Fragment>
        ))}
      </div>
    </div>
  );
}
