"use client";

import { useEffect, useRef } from "react";

// WebGL mesh gradient — vanilla WebGL2, no three.js dependency.
// Runs a fragment shader that blends 3 noise layers + 4 colour stops drifting
// over time, with mouse position feeding a uniform so the gradient subtly
// reacts to the pointer. Falls back gracefully (renders nothing) when WebGL
// isn't supported.
//
// Bundle cost: ~3 KB gzipped (no deps). Performance: 60fps on integrated GPUs
// because we run a single full-screen quad with a low-resolution buffer.
//
// Usage:
//   <section className="relative isolate overflow-hidden">
//     <MeshGradient3D colors={["#0c1024","#1e3a8a","#7c3aed","#f5d6a3"]} />
//     ... content ...
//   </section>

type Props = {
  colors?: [string, string, string, string];
  speed?: number; // 0 = frozen, 1 = normal, 2 = double
  intensity?: number; // 0–1 opacity multiplier
  className?: string;
  resolutionScale?: number; // 0.5 = half-res buffer (faster), 1 = full
};

const DEFAULT_COLORS: [string, string, string, string] = [
  "#06070d", // obsidian base
  "#1e3a8a", // deep blue
  "#7c3aed", // royal violet
  "#f5d6a3", // warm gold
];

const VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uTime;
uniform vec2  uMouse;
uniform vec2  uRes;
uniform float uIntensity;
uniform vec3  uC0;
uniform vec3  uC1;
uniform vec3  uC2;
uniform vec3  uC3;
out vec4 fragColor;

// Hash + value noise — small footprint, smooth output.
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.05; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 ar = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (uv - 0.5) * ar;
  vec2 mouse = (uMouse - 0.5) * ar;

  float t = uTime * 0.07;
  float n1 = fbm(p * 2.4 + vec2(t, -t * 0.7));
  float n2 = fbm(p * 1.6 + vec2(-t * 0.6, t) + mouse * 0.4);
  float n3 = fbm(p * 3.0 + vec2(t * 0.5, t * 0.9));

  // 3-layer blend: layer1 controls warm/cool axis, layer2 controls violet bias,
  // layer3 adds a subtle highlight bloom.
  vec3 col = mix(uC0, uC1, smoothstep(0.20, 0.85, n1));
  col = mix(col, uC2, smoothstep(0.30, 0.95, n2 * 0.85));
  col = mix(col, uC3, smoothstep(0.55, 1.05, n3 * 0.65));

  // Mouse-following bloom — soft radial highlight.
  float d = length(p - mouse * 0.55);
  col += uC3 * 0.18 * smoothstep(0.55, 0.0, d);

  // Vignette to keep edges grounded.
  float vig = smoothstep(1.4, 0.4, length(p));
  col *= mix(0.7, 1.0, vig);

  fragColor = vec4(col, uIntensity);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace("#", "");
  const v = parseInt(cleaned.length === 3 ? cleaned.replace(/(.)/g, "$1$1") : cleaned, 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff].map((c) => c / 255) as [
    number,
    number,
    number,
  ];
}

function compileShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[MeshGradient3D] shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function MeshGradient3D({
  colors = DEFAULT_COLORS,
  speed = 1,
  intensity = 0.85,
  className = "",
  resolutionScale = 0.6,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[MeshGradient3D] link error:", gl.getProgramInfoLog(program));
      return;
    }

    // Full-screen quad (two triangles).
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uRes = gl.getUniformLocation(program, "uRes");
    const uIntensity = gl.getUniformLocation(program, "uIntensity");
    const uC0 = gl.getUniformLocation(program, "uC0");
    const uC1 = gl.getUniformLocation(program, "uC1");
    const uC2 = gl.getUniformLocation(program, "uC2");
    const uC3 = gl.getUniformLocation(program, "uC3");

    const c0 = hexToRgb(colors[0]);
    const c1 = hexToRgb(colors[1]);
    const c2 = hexToRgb(colors[2]);
    const c3 = hexToRgb(colors[3]);

    const mouse = { x: 0.5, y: 0.5 };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = 1 - (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr * resolutionScale;
      const h = canvas.clientHeight * dpr * resolutionScale;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = Math.max(1, Math.floor(w));
        canvas.height = Math.max(1, Math.floor(h));
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    const draw = () => {
      resize();
      gl.useProgram(program);
      const t = reduced ? 0 : ((performance.now() - start) / 1000) * speed;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uIntensity, intensity);
      gl.uniform3f(uC0, c0[0], c0[1], c0[2]);
      gl.uniform3f(uC1, c1[0], c1[1], c1[2]);
      gl.uniform3f(uC2, c2[0], c2[1], c2[2]);
      gl.uniform3f(uC3, c3[0], c3[1], c3[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [colors, speed, intensity, resolutionScale]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ display: "block" }}
    />
  );
}
