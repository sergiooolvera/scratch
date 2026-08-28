'use client'

import React from 'react'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function ExploreBanner() {
    return (
        <div className="mt-6 mb-4">
            <Link
                href="/cursos"
                className="group flex items-center justify-between gap-4 p-4 sm:p-5 bg-[#2510a3] hover:bg-[#1f0d8b] rounded-2xl text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm sm:text-base font-extrabold tracking-tight">
                            Explorar todos los cursos
                        </h4>
                        <p className="text-xs text-indigo-200 font-medium">
                            Descubre más capacitaciones y sigue aprendiendo.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform pr-2">
                    <ArrowRight className="w-5 h-5" />
                </div>
            </Link>
        </div>
    )
}
