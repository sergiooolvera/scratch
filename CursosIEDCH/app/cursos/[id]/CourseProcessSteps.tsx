'use client'

import React from 'react'
import { UserPlus, CreditCard, Play, CheckCircle2, Award, ArrowRight } from 'lucide-react'

export default function CourseProcessSteps() {
    const steps = [
        {
            number: 1,
            title: 'Regístrate',
            description: 'Elige tu método de pago.',
            icon: UserPlus
        },
        {
            number: 2,
            title: 'Realiza tu pago',
            description: 'Pago 100% seguro por el método de tu preferencia.',
            icon: CreditCard
        },
        {
            number: 3,
            title: 'Accede al curso',
            description: 'Inicia sesión y comienza tu capacitación en línea.',
            icon: Play
        },
        {
            number: 4,
            title: 'Finaliza y aprueba',
            description: 'Completa todas las lecciones y actividades del curso.',
            icon: CheckCircle2
        },
        {
            number: 5,
            title: 'Obtén tu constancia',
            description: 'Descarga tu constancia con valor curricular y código verificable.',
            icon: Award
        }
    ]

    return (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#1e1b4b] mb-5">
                Así obtienes tu constancia verificable
            </h3>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {steps.map((step, idx) => {
                    const Icon = step.icon
                    return (
                        <React.Fragment key={idx}>
                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                {/* Icono redondo outline */}
                                <div className="w-10 h-10 rounded-full border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 stroke-[1.75]" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded-full bg-[#1e1b4b] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                            {step.number}
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                            {step.title}
                                        </h4>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5 max-w-[170px]">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {/* Flecha conectora entre pasos */}
                            {idx < steps.length - 1 && (
                                <div className="hidden lg:flex items-center justify-center text-slate-300 px-1">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
