import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextType>({
  open: false,
  onOpenChange: () => {},
})

export interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Sheet({ open = false, onOpenChange = () => {}, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

export function SheetTrigger({
  asChild = false,
  render,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; render?: React.ReactElement<any> }) {
  const { open, onOpenChange } = React.useContext(SheetContext)
  if (render) {
    return React.cloneElement(render, {
      onClick: () => onOpenChange(!open),
      children,
      ...props
    } as any)
  }
  return (
    <button type="button" onClick={() => onOpenChange(!open)} {...props}>
      {children}
    </button>
  )
}

export function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "bottom" | "left" | "right" }) {
  const { open, onOpenChange } = React.useContext(SheetContext)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-50 h-full w-3/4 max-w-sm border-l border-slate-200 bg-white p-6 shadow-xl animate-in slide-in-from-right duration-200 ml-auto",
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-left mb-4", className)}
      {...props}
    />
  )
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-slate-900", className)}
      {...props}
    />
  )
}
