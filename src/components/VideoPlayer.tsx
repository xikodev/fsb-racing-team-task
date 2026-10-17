'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  title: string
  poster?: string
  autoplay: boolean
  loop: boolean
}

export function VideoPlayer({ src, title, poster, autoplay, loop }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateAutoplay = () => {
      const shouldPlay = autoplay && !motion.matches
      video.autoplay = shouldPlay
      if (shouldPlay) {
        video.muted = true
        void video.play().catch(() => {
          // Native controls remain available when the browser blocks autoplay.
        })
      } else {
        video.pause()
      }
    }
    updateAutoplay()
    motion.addEventListener('change', updateAutoplay)
    return () => motion.removeEventListener('change', updateAutoplay)
  }, [autoplay, src])

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        aria-label={title}
        controls
        playsInline
        muted={autoplay}
        loop={loop}
        preload="metadata"
        onError={() => setFailed(true)}
        onLoadedData={() => setFailed(false)}
      >
        Your browser does not support video playback. <a href={src}>Download the video</a>.
      </video>
      {failed && (
        <p className="video-error" role="alert">
          This video could not be played. <a href={src}>Download the video</a> or try another
          browser.
        </p>
      )}
    </>
  )
}
