import { useState } from 'react'

export default function PosterImage({ posterUrl, alt, style, className }) {
  const [failed, setFailed] = useState(false)

  if (!posterUrl || failed) return null

  return (
    <img
      src={posterUrl}
      alt={alt}
      style={style}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
