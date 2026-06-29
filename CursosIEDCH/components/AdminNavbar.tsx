'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
    Users, 
    ShieldCheck, 
    BookOpen, 
    Ticket, 
    Landmark, 
    Store, 
    CreditCard, 
    FileSpreadsheet, 
    BarChart3,
    MessageSquare
} from 'lucide-react'

interface AdminNavbarProps {
    rol: string
    permisos: string[]
}

export default function AdminNavbar({ rol, permisos }: AdminNavbarProps) {
    const pathname = usePathname()

    const hasAccess = (subpath: string) => {
        if (rol === 'admin') return true
        return permisos.includes(subpath)
    }

    const menuItems = [
        { id: 'usuarios', label: 'Gestión de Usuarios', href: '/admin/usuarios', icon: Users },
        { id: 'validaciones', label: 'Validar Identidades', href: '/admin/validaciones', icon: ShieldCheck },
        { id: 'cursos', label: 'Revisión de Cursos', href: '/admin/cursos', icon: BookOpen },
        { id: 'cupones', label: 'Cupones y Bonos', href: '/admin/cupones', icon: Ticket },
        { id: 'pagos-manuales', label: 'Pagos Transferencia', href: '/admin/pagos-manuales', icon: Landmark },
        { id: 'pagos-oxxo', label: 'Pagos Oxxo', href: '/admin/pagos-oxxo', icon: Store },
        { id: 'transacciones', label: 'Transacciones Stripe', href: '/admin/transacciones', icon: CreditCard },
        { id: 'solicitudes', label: 'Solicitudes Ajuste', href: '/admin/solicitudes', icon: FileSpreadsheet },
        { id: 'comentarios', label: 'Comentarios', href: '/admin/comentarios', icon: MessageSquare },
        { id: 'actividad', label: 'Estadísticas', href: '/admin/actividad', icon: BarChart3 },
    ]

    const activeItems = menuItems.filter(item => hasAccess(item.id))

    return (
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Contenedor con scroll horizontal táctil suave y ocultación de scrollbars */}
                <div className="flex space-x-1.5 overflow-x-auto scrollbar-none py-3 -mb-px">
                    {activeItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer ${
                                    isActive
                                        ? 'bg-slate-800 text-white shadow-inner border border-slate-700/50'
                                        : 'hover:bg-slate-800/40 hover:text-slate-100 text-slate-400'
                                }`}
                            >
                                <Icon className={`h-4.5 w-4.5 transition-all duration-200 ${isActive ? 'text-blue-400 scale-110' : 'text-slate-500'}`} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
