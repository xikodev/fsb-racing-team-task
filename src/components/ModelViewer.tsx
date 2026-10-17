'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '@google/model-viewer'

type Props = { src: string; alt: string; rotate: boolean; speed: number }

export function ModelViewer({ src, alt, rotate, speed }: Props) {
  const ref = useRef<ModelViewerElement>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const viewer = ref.current
    if (!viewer) return
    let disposed = false
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateRotation = () => {
      setReducedMotion(motion.matches)
      viewer.autoRotate = rotate && !paused && !motion.matches
      viewer.setAttribute('rotation-per-second', `${speed}deg`)
    }
    const loaded = () => setStatus('loaded')
    const failed = () => setStatus('error')
    viewer.addEventListener('load', loaded)
    viewer.addEventListener('error', failed)
    motion.addEventListener('change', updateRotation)
    void import('@google/model-viewer')
      .then(() => {
        if (!disposed) updateRotation()
      })
      .catch(() => {
        if (!disposed) failed()
      })
    return () => {
      disposed = true
      viewer.removeEventListener('load', loaded)
      viewer.removeEventListener('error', failed)
      motion.removeEventListener('change', updateRotation)
    }
  }, [src, rotate, speed, paused])

  return (
    <div className="model-viewer-frame">
      {createElement('model-viewer', {
        ref,
        src,
        alt,
        'camera-controls': '',
        'touch-action': 'pan-y',
        'interaction-prompt': 'none',
        'shadow-intensity': '1',
        'aria-label': alt,
        'aria-busy': status === 'loading',
      })}
      {status === 'loading' && <p role="status">Loading 3D model...</p>}
      {status === 'error' && (
        <p role="alert">The 3D model could not be loaded. Try another browser or GLB file.</p>
      )}
      <div className="model-controls">
        <p>Drag to rotate. Scroll or pinch to zoom. Use arrow keys when the viewer is focused.</p>
        {rotate && status === 'loaded' && (
          <button type="button" disabled={reducedMotion} onClick={() => setPaused(!paused)}>
            {reducedMotion
              ? 'Rotation disabled: reduced motion'
              : paused
                ? 'Resume rotation'
                : 'Pause rotation'}
          </button>
        )}
        <a href={src} download>
          Download GLB model
        </a>
      </div>
      <noscript>Enable JavaScript to explore the model in 3D, or download the GLB file.</noscript>
    </div>
  )
}
