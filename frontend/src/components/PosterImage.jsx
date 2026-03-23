import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PosterImage({ posterUrl, alt, style, className }) {
  const [failed, setFailed] = useState(false)

  if (!posterUrl || failed) return null

  const src = posterUrl.startsWith('/poster/') ? `${API_BASE}${posterUrl}` : posterUrl

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
