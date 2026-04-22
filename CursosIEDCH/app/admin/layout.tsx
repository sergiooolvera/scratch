import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
        <div className="bg-gray-800 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap gap-2 md:gap-6 py-4 text-sm font-medium">
                    <Link href="/admin/usuarios" className="px-3 py-2 rounded-md hover:bg-gray-700 transition">Gestión de Usuarios</Link>
                    <Link href="/admin/cursos" className="px-3 py-2 rounded-md hover:bg-gray-700 transition">Revisión de Cursos</Link>
                    <Link href="/admin/cupones" className="px-3 py-2 rounded-md hover:bg-gray-700 transition">Cupones y Bonos</Link>
                    <Link href="/admin/pagos-manuales" className="px-3 py-2 rounded-md hover:bg-gray-700 transition text-green-300">Pagos Transferencia</Link>
                    <Link href="/admin/pagos-oxxo" className="px-3 py-2 rounded-md bg-red-900/50 hover:bg-red-800 transition text-red-100 border border-red-800">Pagos Oxxo</Link>
                    <Link href="/admin/transacciones" className="px-3 py-2 rounded-md hover:bg-gray-700 transition">Transacciones Stripe</Link>
                    <Link href="/admin/actividad" className="px-3 py-2 rounded-md hover:bg-gray-700 transition">Estadísticas</Link>
                </div>
            </div>
        </div>
            {children}
        </div>
    )
}
