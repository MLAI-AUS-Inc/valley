import Link from "next/link"
import Image from "next/image"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
      <Image src="/logo.png" alt="Startup Pulse Logo" width={48} height={48} className="-mt-1" />
      <div className="flex items-baseline gap-2">
        <Image src="/MLAI_textlogo.png" alt="MLAI" width={64} height={24} />
        <span className="text-2xl font-normal text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
          Valley
        </span>
      </div>
    </Link>
  )
} 