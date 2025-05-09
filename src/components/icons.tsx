// src/components/icons.tsx
import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Command,
    CreditCard,
    File,
    FileText,
    HelpCircle,
    Image as LucideImage, // Renombramos para evitar conflicto
    Laptop,
    LayoutDashboard,
    Loader2,
    LogOut,
    Mail,
    Moon,
    MoreVertical,
    Pizza,
    Plus,
    Settings,
    SunMedium,
    Trash,
    Twitter,
    User,
    X,
  } from "lucide-react"
  import * as React from "react"
  
  export type IconProps = React.HTMLAttributes<SVGElement>
  
  // Componente personalizado para el icono de GitHub
  const GithubIcon = (props: React.HTMLAttributes<HTMLElement>) => (
    <span className={props.className}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.891 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.481C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
  
  export const Icons = {
    logo: Command,
    spinner: Loader2,
    chevronLeft: ChevronLeft,
    chevronRight: ChevronRight,
    trash: Trash,
    settings: Settings,
    user: User,
    creditCard: CreditCard,
    plus: Plus,
    arrowRight: ArrowRight,
    help: HelpCircle,
    pizza: Pizza,
    sun: SunMedium,
    moon: Moon,
    laptop: Laptop,
    twitter: Twitter,
    check: CheckCircle,
    warning: AlertCircle,
    dashboard: LayoutDashboard,
    close: X,
    file: File,
    fileText: FileText,
    image: LucideImage, // Usamos el renombrado
    moreVertical: MoreVertical,
    logout: LogOut,
    mail: Mail,
    github: GithubIcon, // Usamos nuestro componente personalizado
  }