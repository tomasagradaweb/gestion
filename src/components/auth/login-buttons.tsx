// src/components/auth/login-buttons.tsx
"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Icons } from "@/components/icons"

interface AuthButtonProps {
  provider: string
  text: string
  callbackUrl?: string
  className?: string
  icon?: React.ReactNode
}

export function AuthButton({
  provider,
  text,
  callbackUrl = "/dashboard",
  className,
  icon
}: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
      {text}
    </Button>
  )
}

export function GitHubLoginButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <AuthButton
      provider="github"
      text="Iniciar sesión con GitHub"
      callbackUrl={callbackUrl}
      icon={<Icons.github className="mr-2 h-4 w-4" />}
    />
  )
}

export function CredentialsLoginButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <AuthButton
      provider="credentials"
      text="Iniciar sesión con Email"
      callbackUrl={callbackUrl}
      icon={<Icons.mail className="mr-2 h-4 w-4" />}
    />
  )
}