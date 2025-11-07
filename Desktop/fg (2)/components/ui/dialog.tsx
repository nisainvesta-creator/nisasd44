// Simplified dialog component without external dependencies
import * as React from "react"

export const Dialog: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export const DialogTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  return <>{children}</>
}

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return <div className={className}>{children}</div>
}

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return <div className={className}>{children}</div>
}

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return <div className={className}>{children}</div>
}