import type { CSSProperties } from "react"
import { getImageProps } from "next/image"

import logo from "../../../public/brand/elora-logo.png"

import { ShopPreloaderDismiss } from "./shop-preloader-dismiss"

import "./shop-preloader.css"

/** Twinkles around the logo: [left %, top %, size px, delay s] */
const SPARKLES: [number, number, number, number][] = [
  [8, 58, 14, 1.08],
  [24, 6, 10, 1.28],
  [47, -4, 12, 1.16],
  [70, 10, 16, 1.4],
  [93, 46, 11, 1.2],
  [84, 88, 9, 1.48],
  [30, 92, 10, 1.56],
]

/**
 * Six faint gold butterflies in mirrored pairs near the edges, drifting
 * slowly sideways, kept away from the centered logo:
 * [left %, bottom %, size px, delay s, duration s, dx px, dy px, sway px, tilt deg, flap s]
 */
const BUTTERFLIES: [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
][] = [
  // mirrored pairs, low opacity, slow drift — deliberate, not random
  [5, 22, 26, 0.2, 2.1, 70, -24, 6, 10, 0.5],
  [95, 22, 26, 0.3, 2.1, -70, -24, 6, -10, 0.5],
  [10, 50, 20, 0.35, 2.0, 55, -18, 5, 8, 0.46],
  [90, 50, 20, 0.45, 2.0, -55, -18, 5, -8, 0.46],
  [4, 76, 16, 0.5, 1.9, 40, -12, 4, 6, 0.42],
  [96, 76, 16, 0.6, 1.9, -40, -12, 4, -6, 0.42],
]

/**
 * "Shop opening" intro: awning drops, the "Welcome / We're Open" sign swings in,
 * light sweeps the logo, then the shutter rolls up to reveal the page.
 *
 * Server-rendered markup with pure CSS animation (transform/opacity only, so
 * it stays on the compositor), so it starts before hydration and still
 * finishes (ends hidden) without JS. It plays on every full page load (first
 * visit or refresh); in-site navigation keeps the shop layout mounted.
 */
export function ShopPreloader() {
  // One fixed size (~2.4x of the 340px display) so the <img> and the sheen
  // mask share a single URL — one download, no srcset mismatch.
  const {
    props: { src: logoSrc, width, height },
  } = getImageProps({ src: logo, alt: "", width: 400 })

  return (
    <>
      <div id="shop-preloader" className="shop-preloader">
        <span role="status" aria-live="polite" className="sr-only">
          Loading Elora
        </span>
        <div className="sp-shutter" aria-hidden="true">
          <div className="sp-spotlight" />

          <div className="sp-flight">
            <svg width="0" height="0" className="absolute">
              <defs>
                {/* polished-gold rim, like the logo's bevel */}
                <linearGradient id="sp-bf-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff4cf" />
                  <stop offset="30%" stopColor="#f0cf7c" />
                  <stop offset="55%" stopColor="#b9862c" />
                  <stop offset="78%" stopColor="#f3d68b" />
                  <stop offset="100%" stopColor="#8a5b0b" />
                </linearGradient>
                {/* glassy wing membrane */}
                <linearGradient id="sp-bf-glass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff8e4" stopOpacity="0.85" />
                  <stop offset="55%" stopColor="#ecc874" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#c99438" stopOpacity="0.45" />
                </linearGradient>
                {/* marquise diamond body */}
                <linearGradient id="sp-bf-gem" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="45%" stopColor="#e8eef5" />
                  <stop offset="70%" stopColor="#b9c4d0" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
            {BUTTERFLIES.map(
              ([left, bottom, size, delay, dur, dx, dy, sway, tilt, flap], i) => (
                <span
                  key={i}
                  className="sp-bf"
                  style={
                    {
                      left: `${left}%`,
                      bottom: `${bottom}%`,
                      "--size": `${size}px`,
                      "--delay": `${delay}s`,
                      "--dur": `${dur}s`,
                      "--dx": `${dx}px`,
                      "--dy": `${dy}px`,
                      "--sway": `${sway}px`,
                      "--tilt": `${tilt}deg`,
                      "--flap": `${flap}s`,
                    } as CSSProperties
                  }
                >
                  <span className="sp-bf-sway">
                    <ButterflyIcon />
                  </span>
                </span>
              )
            )}
          </div>

          <div className="sp-awning">
            <div className="sp-awning-body" />
            <div className="sp-awning-scallops" />
          </div>

          <div className="sp-sign-wrap">
            <div className="sp-sign-swing">
              <span className="sp-string sp-string-l" />
              <span className="sp-string sp-string-r" />
              <div className="sp-sign">
                <div className="sp-sign-face sp-sign-welcome">
                  <span className="sp-sign-small">Welcome</span>
                  <span className="sp-sign-big">We&apos;re Open</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sp-brand">
            <div className="sp-logo">
              <div className="sp-logo-halo" />
              {/* eslint-disable-next-line @next/next/no-img-element -- optimized URL from getImageProps, shared with the sheen mask */}
              <img
                src={logoSrc}
                alt=""
                width={width}
                height={height}
                fetchPriority="high"
                decoding="async"
                className="sp-logo-img"
              />
              <div
                className="sp-logo-sheen"
                style={{ "--logo-url": `url("${logoSrc}")` } as CSSProperties}
              >
                <span />
              </div>
              {SPARKLES.map(([left, top, size, delay], i) => (
                <span
                  key={i}
                  className="sp-sparkle"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: size,
                    height: size,
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
            <p className="sp-tagline">
              <span className="sp-rule" />
              Fashion &amp; Lifestyle
              <span className="sp-rule" />
            </p>
            <span className="sp-progress">
              <span />
            </span>
          </div>

          <div className="sp-bottom">
            <span className="sp-light-leak" />
            <div className="sp-lip" />
            <div className="sp-bar">
              <span className="sp-bar-sheen" />
              <span className="sp-rivet" style={{ left: "6%" }} />
              <span className="sp-rivet" style={{ right: "6%" }} />
              <span className="sp-grip sp-grip-l" />
              <span className="sp-grip sp-grip-r" />
              <span className="sp-lock">
                <span className="sp-keyhole" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <ShopPreloaderDismiss />
    </>
  )
}

/** Left half of the butterfly; the right half is the same shape mirrored. */
function ButterflyWing() {
  return (
    <>
      {/* upper wing: long sweep to a sharp tip, like the logo */}
      <path
        d="M19.2 13.6C15.4 9.4 9.6 3.8 1.8 1.4c1.2 4.6 2.9 9.6 7.4 12.2 3 1.7 6.6 1.6 10 1Z"
        fill="url(#sp-bf-glass)"
        stroke="url(#sp-bf-gold)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* lower wing: teardrop pointing down */}
      <path
        d="M19.4 15.8c-4.2.4-8.6 2.4-9.4 6.6-.4 2.4.8 4.8 2.6 6.2.8-3.6 3-8.4 6.8-11.8Z"
        fill="url(#sp-bf-glass)"
        stroke="url(#sp-bf-gold)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* inner filigree: bevel line + small leaf near the body */}
      <path
        d="M17.6 13.4C14 10.8 9.4 7 5 4M17.8 17.2c-2.6 2.4-4.4 5.4-5 8.6"
        fill="none"
        stroke="#fff6d8"
        strokeWidth="0.55"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M18.4 14c-2.2-1.8-4.8-2.4-6.6-1.6 1.8 1.4 4.2 1.8 6.6 1.6Z"
        fill="url(#sp-bf-gold)"
      />
    </>
  )
}

function ButterflyIcon() {
  return (
    <svg viewBox="0 0 40 30">
      <g className="sp-bf-wing sp-bf-wing-l">
        <ButterflyWing />
      </g>
      <g className="sp-bf-wing sp-bf-wing-r">
        <g transform="matrix(-1 0 0 1 40 0)">
          <ButterflyWing />
        </g>
      </g>
      {/* curled antennae with tiny jewels */}
      <path
        d="M19.5 10C19 7.2 17.6 5 15.6 4.4c-.9-.2-1.4.6-.9 1.2M20.5 10c.5-2.8 1.9-5 3.9-5.6.9-.2 1.4.6.9 1.2"
        fill="none"
        stroke="url(#sp-bf-gold)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
      <circle
        cx="15.6"
        cy="4.4"
        r="0.85"
        fill="#fffaf0"
        stroke="#c99438"
        strokeWidth="0.4"
      />
      <circle
        cx="24.4"
        cy="4.4"
        r="0.85"
        fill="#fffaf0"
        stroke="#c99438"
        strokeWidth="0.4"
      />
      {/* marquise diamond body in a gold setting */}
      <path
        d="M20 9.2 21.7 15.6 20 22.6 18.3 15.6Z"
        fill="url(#sp-bf-gem)"
        stroke="url(#sp-bf-gold)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 9.2v13.4M18.3 15.6h3.4M20 9.2l-.9 6.4.9 7M20 9.2l.9 6.4-.9 7"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.3"
        opacity="0.8"
      />
      {/* tail point under the gem, like the logo */}
      <path d="M20 22.6 20.5 24.6 20 26.4 19.5 24.6Z" fill="url(#sp-bf-gold)" />
    </svg>
  )
}
