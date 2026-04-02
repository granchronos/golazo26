import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0f1a] via-[#2A398D]/20 to-[#0f0f1a]">
      <div className="text-center">
        <p className="font-display text-[120px] leading-none gradient-text">404</p>
        <h1 className="font-display text-3xl text-white mt-2">Fuera de juego</h1>
        <p className="font-body text-gray-400 mt-2">Esta página no existe en nuestro fixture</p>
        <Link href="/" className="inline-flex mt-6 btn-fwc">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
