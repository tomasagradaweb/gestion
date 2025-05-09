// src/components/auth/logout-button.tsx
"use client"

import { signOut } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface LogoutButtonProps {
  user?: {
    name?: string;
    email?: string;
  };
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function LogoutButton({
  user,
  variant = "default",
  size = "default",
  className,
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await signOut({ callbackUrl: "/login" })
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      className={`justify-start text-left ${className}`}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icons.logout className="mr-2 h-4 w-4" />
      )}
      <div className="flex flex-col items-start">
        <span>Cerrar sesión</span>
        {user?.email && (
          <span className="text-xs text-muted-foreground">{user.email}</span>
        )}
      </div>
    </Button>
  )
}
