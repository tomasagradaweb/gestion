"use client"

import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"
import { GalleryVerticalEnd, Loader2, Github, Mail } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// Schema de validación
const loginSchema = z.object({
  email: z.string()
    .min(1, "El email es requerido")
    .email("Formato de email no válido"),
  password: z.string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  
  // Configuración de react-hook-form con validación de zod
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Manejador para login con credenciales
  async function onSubmit(values: LoginFormValues) {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        callbackUrl: "/dashboard",
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        return
      }
      
      // Redirección manual después de login exitoso
      router.push("/dashboard")
      router.refresh() // Refresca la página para actualizar la sesión
    } catch (error) {
      console.error("Error de inicio de sesión:", error)
      setError("Ocurrió un error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Manejador para login con GitHub
  const handleGithubSignIn = async () => {
    try {
      setIsGithubLoading(true)
      setError(null)
      // El redirect:true aquí hará la redirección automática
      await signIn("github", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Error al iniciar sesión con GitHub:", error)
      setError("Error al iniciar sesión con GitHub")
    } finally {
      setIsGithubLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Acme Inc.</h1>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </div>

          {/* Mostrar errores de autenticación */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Campo para el email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo para password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel htmlFor="password">Password</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    required
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Login"
            )}
          </Button>

          {/* Separador visual */}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>

          {/* Botones OAuth */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* GitHub */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleGithubSignIn}
              disabled={isGithubLoading}
              type="button"
            >
              {isGithubLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-4 w-4" />
              )}
              Iniciar con GitHub
            </Button>

            {/* Google - Conservado de tu formulario original */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              type="button"
            >
              <Mail className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}