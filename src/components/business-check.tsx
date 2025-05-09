"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

export default function BusinessCheck() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Solo verificar cuando la sesión está cargada y el usuario está autenticado
    if (status === "authenticated" && session?.user) {
      // Verificar si el usuario tiene un Business asociado
      fetch("/api/check-business")
        .then((res) => res.json())
        .then((data) => {
          if (!data.hasBusiness && !pathname.includes("/setup-business")) {
            router.push("/setup-business")
          }
        })
        .catch((error) => {
          console.error("Error verificando Business:", error)
        })
    }
  }, [session, status, router, pathname])

  return null // Este componente no renderiza nada
}

