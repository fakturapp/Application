'use client'

import { useEffect } from 'react'

const FILTER_ID = 'faktur-liquid-glass'
const MAP_WIDTH = 480
const MAP_HEIGHT = 320
const MAP_RADIUS = 20
const MAP_BORDER = 0.07
const MAP_BRIGHTNESS = 50
const MAP_OPACITY = 0.9
const MAP_BLUR = 14
const DISTORTION_SCALE = -150
const RED_OFFSET = 0
const GREEN_OFFSET = 8
const BLUE_OFFSET = 16

function buildDisplacementMap(): string {
  const edge = Math.min(MAP_WIDTH, MAP_HEIGHT) * (MAP_BORDER * 0.5)
  const svgContent = `<svg viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="flg-red" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="red"/><stop offset="50%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="flg-green" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="lime"/><stop offset="50%" stop-color="#0000"/><stop offset="100%" stop-color="lime"/></linearGradient><radialGradient id="flg-core" cx="50%" cy="50%" r="62%"><stop offset="0%" stop-color="hsl(0 0% ${MAP_BRIGHTNESS}% / ${MAP_OPACITY})"/><stop offset="62%" stop-color="hsl(0 0% ${MAP_BRIGHTNESS}% / ${MAP_OPACITY})"/><stop offset="100%" stop-color="hsl(0 0% ${MAP_BRIGHTNESS}% / 0)"/></radialGradient></defs><rect x="0" y="0" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" fill="black"></rect><rect x="0" y="0" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" rx="${MAP_RADIUS}" fill="url(#flg-red)" /><rect x="0" y="0" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" rx="${MAP_RADIUS}" fill="url(#flg-green)" style="mix-blend-mode: screen" /><rect x="${edge}" y="${edge}" width="${MAP_WIDTH - edge * 2}" height="${MAP_HEIGHT - edge * 2}" rx="${MAP_RADIUS}" fill="url(#flg-core)" style="filter:blur(${MAP_BLUR}px)" /></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`
}

const DISPLACEMENT_MAP = buildDisplacementMap()

export function LiquidGlassDefs() {
  useEffect(() => {
    const root = document.documentElement
    const ua = navigator.userAgent
    const isWebkit = /Safari/.test(ua) && !/Chrome/.test(ua)
    const isFirefox = /Firefox/.test(ua)
    let supported = false
    if (!isWebkit && !isFirefox) {
      const probe = document.createElement('div')
      probe.style.backdropFilter = `url(#${FILTER_ID})`
      supported = probe.style.backdropFilter !== ''
    }
    if (supported) {
      root.dataset.liquidReady = '1'
    } else {
      delete root.dataset.liquidReady
    }
  }, [])

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter
          id={FILTER_ID}
          colorInterpolationFilters="sRGB"
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
        >
          <feImage
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            href={DISPLACEMENT_MAP}
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={DISTORTION_SCALE + RED_OFFSET}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispRed"
          />
          <feColorMatrix
            in="dispRed"
            type="matrix"
            values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
            result="red"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={DISTORTION_SCALE + GREEN_OFFSET}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispGreen"
          />
          <feColorMatrix
            in="dispGreen"
            type="matrix"
            values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
            result="green"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={DISTORTION_SCALE + BLUE_OFFSET}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispBlue"
          />
          <feColorMatrix
            in="dispBlue"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
            result="blue"
          />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur in="output" stdDeviation="0.7" />
        </filter>
      </defs>
    </svg>
  )
}
