'use client'

import { Search } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function DashboardSearch({ defaultValue, activeCategory }: { defaultValue: string, activeCategory: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value
        const params = new URLSearchParams(searchParams.toString())
        
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }

        if (activeCategory !== 'todas') {
            params.set('category', activeCategory)
        }

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
    }

    return (
        <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 ${isPending ? 'text-indigo-400' : 'text-gray-400'}`} />
            </div>
            <input
                type="text"
                defaultValue={defaultValue}
                onChange={handleSearch}
                placeholder="Buscar curso o instructor..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black shadow-sm"
            />
        </div>
    )
}
