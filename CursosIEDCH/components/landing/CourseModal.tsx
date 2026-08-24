'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, UserPlus, Building2 } from 'lucide-react'
import Link from 'next/link'

interface CourseModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function CourseModal({ isOpen, setIsOpen }: CourseModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-5">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900">
                    ¿Cómo quieres participar?
                  </Dialog.Title>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <Link
                    href="/register?type=instructor"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-slate-900">Soy Instructor</h4>
                      <p className="text-sm text-slate-500">Quiero publicar y vender mis propios cursos.</p>
                    </div>
                  </Link>

                  <Link
                    href="/register?type=institucion"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-slate-900">Soy Institución</h4>
                      <p className="text-sm text-slate-500">Represento a una organización educativa.</p>
                    </div>
                  </Link>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
