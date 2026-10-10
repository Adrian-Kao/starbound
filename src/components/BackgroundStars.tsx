import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { seededRandom } from '../utils/seededRandom'
import type { PointerField } from '../utils/pointerField'

const vertexShader = `
  attribute float aSize;
  attribute float aTwinkle;
  attribute float aBrightness;
  uniform float uTime;
  uniform float uPointScale;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  varying float vBrightness;
  void main() {
    vec3 transformed = position;
    vec2 delta = transformed.xy - uPointer;
    float repel = smoothstep(0.9, 0.0, length(delta)) * uPointerStrength;
    transformed.xy += normalize(delta + vec2(0.0001)) * repel * 0.16;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float twinkle = 0.82 + 0.2 * sin(uTime * aTwinkle + aBrightness * 9.0);
    gl_PointSize = max(0.85, aSize * uPointScale * twinkle * (11.0 / max(3.0, -mvPosition.z)));
    vBrightness = aBrightness * twinkle;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vBrightness;
  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceToCenter > 0.5) discard;
    float core = smoothstep(0.23, 0.02, distanceToCenter);
    float halo = smoothstep(0.5, 0.18, distanceToCenter) * 0.18;
    gl_FragColor = vec4(uColor, (core + halo) * uOpacity * vBrightness);
  }
`

type Props = {
  seed: string
  count?: number
  radius?: number
  color?: string
  drift?: number
  opacity?: number
  pointScale?: number
  depth?: [number, number]
  parallax?: number
  pointerRef?: React.MutableRefObject<PointerField>
  interactive?: boolean
}

export function BackgroundStars({
  seed,
  count = 900,
  radius = 8,
  color = '#cfe8ff',
  drift = 0.006,
  opacity = 0.76,
  pointScale = 1,
  depth = [1.5, 10],
  parallax = 0.008,
  pointerRef,
  interactive = false,
}: Props) {
  const depthNear = depth[0]
  const depthFar = depth[1]
  const ref = useRef<THREE.Points>(null)
  const smoothPointer = useRef(new THREE.Vector2(20, 20))
  const smoothStrength = useRef(0)
  const geometry = useMemo(() => {
    const random = seededRandom(seed)
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const twinkles = new Float32Array(count)
    const brightness = new Float32Array(count)
    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2
      const radial = Math.sqrt(random()) * radius
      positions[index * 3] = Math.cos(angle) * radial
      positions[index * 3 + 1] = Math.sin(angle) * radial
      positions[index * 3 + 2] = -THREE.MathUtils.lerp(depthNear, depthFar, random())
      sizes[index] = 0.72 + random() * 1.45
      twinkles[index] = 0.35 + random() * 2.2
      brightness[index] = 0.48 + random() * 0.52
    }
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    next.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    next.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 1))
    next.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
    return next
  }, [count, depthFar, depthNear, radius, seed])

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPointScale: { value: pointScale },
      uPointer: { value: new THREE.Vector2(20, 20) },
      uPointerStrength: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  }), [color, opacity, pointScale])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.z += delta * drift
    const targetX = interactive ? pointerRef?.current.x ?? 0 : 0
    const targetY = interactive ? pointerRef?.current.y ?? 0 : 0
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, -targetX * parallax, 4, delta)
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, -targetY * parallax, 4, delta)
    smoothPointer.current.x = THREE.MathUtils.damp(smoothPointer.current.x, interactive ? targetX : 20, 8, delta)
    smoothPointer.current.y = THREE.MathUtils.damp(smoothPointer.current.y, interactive ? targetY : 20, 8, delta)
    smoothStrength.current = THREE.MathUtils.damp(smoothStrength.current, interactive ? pointerRef?.current.strength ?? 0 : 0, 6, delta)
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uPointer.value.copy(smoothPointer.current)
    material.uniforms.uPointerStrength.value = smoothStrength.current
  })

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}
