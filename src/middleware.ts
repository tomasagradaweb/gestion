// middleware.ts
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: Request) {
  // Obtenemos el token JWT directamente
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
  })

  const { pathname } = new URL(request.url)

  // Listas de rutas públicas y protegidas
  const isAuthRoute = pathname.startsWith("/api/auth") || pathname === "/login"
  const isPublicRoute = ["/", "/login", "/register", "/about"].includes(pathname)
  const isApiRoute = pathname.startsWith("/api/")
  const isSetupBusinessRoute = pathname === "/setup-business"

  // Siempre permitimos acceso a rutas públicas, auth API y otras APIs
  if (isAuthRoute || isPublicRoute || isApiRoute) {
    return NextResponse.next()
  }

  // Si no hay token y la ruta no es pública, redirigimos al login
  if (!token) {
    const loginUrl = new URL("/login", request.url)

    // Guardamos la URL original como parámetro para redireccionar después del login
    loginUrl.searchParams.append("callbackUrl", pathname)

    return NextResponse.redirect(loginUrl)
  }

  // Verificación adicional de roles para rutas administrativas
  if (pathname.startsWith("/admin") && token.role !== "admin") {
    // Si el usuario no es admin, redirigimos al dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // El usuario tiene token válido, permitimos el acceso
  return NextResponse.next()
}

export const config = {
  // Matcher para todas las rutas excepto recursos estáticos, API pública, etc.
  matcher: [
    // Estas rutas requieren autenticación
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/setup-business",
    // Excluye recursos estáticos, favicon, etc.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

