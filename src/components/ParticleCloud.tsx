import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { seededRandom } from '../utils/seededRandom'
import type { Point3 } from '../utils/sampleTextToPoints'

const vertexShader = `
  attribute float aSize;
  attribute float aTwinkle;
  uniform float uTime;
  uniform float uScale;
  varying float vGlow;
  void main() {
    float pulse = 0.84 + 0.18 * sin(uTime * aTwinkle + aTwinkle * 4.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uScale * pulse * (8.0 / max(1.0, -mvPosition.z));
    vGlow = pulse;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uCoreColor;
  uniform float uOpacity;
  varying float vGlow;
  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(centered);
    if (distanceToCenter > 0.5) discard;
    float halo = smoothstep(0.5, 0.0, distanceToCenter);
    float core = smoothstep(0.16, 0.0, distanceToCenter);
    vec3 color = mix(uColor, uCoreColor, core);
    gl_FragColor = vec4(color, (halo * 0.68 + core * 0.5) * uOpacity * vGlow);
  }
`

type Props = {
  targets: Point3[]
  seed: string
  progressRef: React.MutableRefObject<number>
  offsetRef?: React.MutableRefObject<{ x: number; y: number }>
  scatterWidth?: number
  scatterHeight?: number
  color?: string
  coreColor?: string
  scale?: number
  breathe?: boolean
}

export function ParticleCloud({
  targets,
  seed,
  progressRef,
  offsetRef,
  scatterWidth = 5,
  scatterHeight = 5,
  color = '#8fd9ff',
  coreColor = '#ffffff',
  scale = 1,
  breathe = true,
}: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const randomData = useMemo(() => {
    const random = seededRandom(seed)
    const starts = new Float32Array(targets.length * 3)
    const curves = new Float32Array(targets.length * 2)
    const sizes = new Float32Array(targets.length)
    const twinkles = new Float32Array(targets.length)
    for (let index = 0; index < targets.length; index += 1) {
      const angle = random() * Math.PI * 2
      const radius = Math.sqrt(random())
      starts[index * 3] = Math.cos(angle) * radius * scatterWidth * 0.5
      starts[index * 3 + 1] = Math.sin(angle) * radius * scatterHeight * 0.5
      starts[index * 3 + 2] = (random() - 0.5) * 1.8
      curves[index * 2] = (random() - 0.5) * 0.9
      curves[index * 2 + 1] = (random() - 0.5) * 0.9
      sizes[index] = 1.5 + random() * 2.7
      twinkles[index] = 0.8 + random() * 2.8
    }
    return { starts, curves, sizes, twinkles }
  }, [scatterHeight, scatterWidth, seed, targets])

  const geometry = useMemo(() => {
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(new Float32Array(targets.length * 3), 3))
    next.setAttribute('aSize', new THREE.BufferAttribute(randomData.sizes, 1))
    next.setAttribute('aTwinkle', new THREE.BufferAttribute(randomData.twinkles, 1))
    return next
  }, [randomData, targets.length])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: scale },
          uOpacity: { value: 1 },
          uColor: { value: new THREE.Color(color) },
          uCoreColor: { value: new THREE.Color(coreColor) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color, coreColor, scale],
  )

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((state) => {
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute
    const positions = attribute.array as Float32Array
    const rawProgress = THREE.MathUtils.clamp(progressRef.current, 0, 1)
    const eased = rawProgress * rawProgress * (3 - 2 * rawProgress)
    const curveStrength = Math.sin(rawProgress * Math.PI)
    const breathing = breathe && rawProgress > 0.995 ? 1 + Math.sin(state.clock.elapsedTime * 1.35) * 0.006 : 1
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index]
      const startIndex = index * 3
      const curveIndex = index * 2
      positions[startIndex] = THREE.MathUtils.lerp(randomData.starts[startIndex], target.x * breathing, eased)
        + randomData.curves[curveIndex] * curveStrength
      positions[startIndex + 1] = THREE.MathUtils.lerp(randomData.starts[startIndex + 1], target.y * breathing, eased)
        + randomData.curves[curveIndex + 1] * curveStrength
      positions[startIndex + 2] = THREE.MathUtils.lerp(randomData.starts[startIndex + 2], target.z, eased)
        + Math.sin(state.clock.elapsedTime * 0.7 + index * 0.13) * 0.012 * (1 - eased)
    }
    attribute.needsUpdate = true
    material.uniforms.uTime.value = state.clock.elapsedTime
    if (pointsRef.current && offsetRef) {
      pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, offsetRef.current.x, 0.22)
      pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, offsetRef.current.y, 0.22)
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
