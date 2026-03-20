import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <div className="bg-gray-800 text-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto whitespace-nowrap">
                    <div className="flex space-x-6 py-3 text-sm font-medium">
                        <Link href="/admin/usuarios" className="hover:text-gray-300">Gestión de Usuarios</Link>
                        <Link href="/admin/cursos" className="hover:text-gray-300">Revisión de Cursos</Link>
                        <Link href="/admin/cupones" className="hover:text-gray-300">Cupones y Bonos</Link>
                        <Link href="/admin/pagos-manuales" className="hover:text-gray-300">Pagos Manuales</Link>
                        <Link href="/admin/actividad" className="hover:text-gray-300">Estadísticas</Link>
                    </div>
                </div>
            </div>
            {children}
        </div>
    )
}
