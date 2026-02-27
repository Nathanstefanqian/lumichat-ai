import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const val = value ? value[0] : (defaultValue ? defaultValue[0] : min)
    
    return (
      <input
        type="range"
        className={cn(
          "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
          className
        )}
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => {
          onValueChange?.([parseFloat(e.target.value)])
        }}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
