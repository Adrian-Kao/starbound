import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { seededRandom } from '../utils/seededRandom'
import type { Point3 } from '../utils/sampleTextToPoints'
import type { PointerField } from '../utils/pointerField'

const vertexShader = `
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute vec2 aCurve;
  attribute float aSize;
  attribute float aTwinkle;
  attribute float aDelay;
  attribute float aEdge;
  uniform float uTime;
  uniform float uScale;
  uniform float uProgress;
  uniform float uResonance;
  uniform float uFlash;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  varying float vGlow;
  varying float vCore;

  float easeInOut(float value) {
    return value * value * (3.0 - 2.0 * value);
  }

  void main() {
    float localProgress = clamp((uProgress - aDelay * 0.13) / max(0.001, 1.0 - aDelay * 0.13), 0.0, 1.0);
    float eased = easeInOut(localProgress);
    float curved = sin(localProgress * 3.14159265);
    vec3 transformed = mix(aStart, aTarget, eased);
    transformed.xy += aCurve * curved;
    transformed.z += sin(uTime * 0.7 + aTwinkle * 2.3) * 0.012 * (1.0 - eased);

    float settled = smoothstep(0.94, 1.0, uProgress);
    vec2 delta = transformed.xy - uPointer;
    float pointerDistance = length(delta);
    float repel = smoothstep(0.72, 0.0, pointerDistance) * uPointerStrength * aEdge * settled;
    transformed.xy += normalize(delta + vec2(0.0001)) * repel * 0.13;

    float waveRadius = uResonance * 2.7;
    float resonanceWave = exp(-pow((length(aTarget.xy) - waveRadius) * 4.0, 2.0)) * sin(uResonance * 18.0);
    transformed.z += resonanceWave * 0.08 * settled;

    float pulse = 0.92 + 0.09 * sin(uTime * aTwinkle + aDelay * 8.0);
    float resonanceLight = resonanceWave * 0.32 + smoothstep(0.05, 0.8, uResonance) * 0.08;
    float flashLight = uFlash * (1.35 + aEdge * 0.42);
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = max(1.0, aSize * uScale * (9.0 / max(2.0, -mvPosition.z)) * (1.0 + resonanceLight + uFlash * (0.9 + aEdge * 0.2)));
    vGlow = pulse + resonanceLight + flashLight;
    vCore = aEdge;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uCoreColor;
  uniform float uOpacity;
  uniform float uFlash;
  varying float vGlow;
  varying float vCore;
  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(centered);
    if (distanceToCenter > 0.5) discard;
    float halo = smoothstep(0.5, 0.18, distanceToCenter) * 0.2;
    float core = smoothstep(0.22, 0.02, distanceToCenter);
    vec3 color = mix(uColor, uCoreColor, core * (0.78 + vCore * 0.22));
    color = mix(color, uCoreColor, uFlash * 0.82);
    float alpha = (halo + core * 0.92) * uOpacity * vGlow;
    gl_FragColor = vec4(color, alpha);
  }
`

type Props = {
  targets: Point3[]
  seed: string
  progressRef: React.MutableRefObject<number>
  offsetRef?: React.MutableRefObject<{ x: number; y: number }>
  pointerRef?: React.MutableRefObject<PointerField>
  resonanceProgressRef?: React.MutableRefObject<number>
  flashProgressRef?: React.MutableRefObject<number>
  scatterWidth?: number
  scatterHeight?: number
  color?: string
  coreColor?: string
  scale?: number
  breathe?: boolean
  blending?: 'additive' | 'normal'
}

export function ParticleCloud({
  targets,
  seed,
  progressRef,
  offsetRef,
  pointerRef,
  resonanceProgressRef,
  flashProgressRef,
  scatterWidth = 5,
  scatterHeight = 5,
  color = '#8fd9ff',
  coreColor = '#ffffff',
  scale = 1,
  blending = 'additive',
}: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const smoothedPointer = useRef(new THREE.Vector2(20, 20))
  const smoothedStrength = useRef(0)

  const geometry = useMemo(() => {
    const random = seededRandom(seed)
    const starts = new Float32Array(targets.length * 3)
    const targetArray = new Float32Array(targets.length * 3)
    const curves = new Float32Array(targets.length * 2)
    const sizes = new Float32Array(targets.length)
    const twinkles = new Float32Array(targets.length)
    const delays = new Float32Array(targets.length)
    const edges = new Float32Array(targets.length)
    for (let index = 0; index < targets.length; index += 1) {
      const angle = random() * Math.PI * 2
      const radius = Math.sqrt(random())
      starts[index * 3] = Math.cos(angle) * radius * scatterWidth * 0.5
      starts[index * 3 + 1] = Math.sin(angle) * radius * scatterHeight * 0.5
      starts[index * 3 + 2] = (random() - 0.5) * 2.2
      targetArray[index * 3] = targets[index].x
      targetArray[index * 3 + 1] = targets[index].y
      targetArray[index * 3 + 2] = targets[index].z
      curves[index * 2] = (random() - 0.5) * 1.05
      curves[index * 2 + 1] = (random() - 0.5) * 1.05
      sizes[index] = 0.95 + random() * 1.45
      twinkles[index] = 0.75 + random() * 2.5
      delays[index] = random()
      edges[index] = random() > 0.82 ? 0.8 + random() * 0.2 : 0.06 + random() * 0.16
    }
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(starts.slice(), 3))
    next.setAttribute('aStart', new THREE.BufferAttribute(starts, 3))
    next.setAttribute('aTarget', new THREE.BufferAttribute(targetArray, 3))
    next.setAttribute('aCurve', new THREE.BufferAttribute(curves, 2))
    next.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    next.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 1))
    next.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1))
    next.setAttribute('aEdge', new THREE.BufferAttribute(edges, 1))
    next.computeBoundingSphere()
    return next
  }, [scatterHeight, scatterWidth, seed, targets])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: scale },
          uOpacity: { value: 1 },
          uProgress: { value: 0 },
          uResonance: { value: 0 },
          uFlash: { value: 0 },
          uPointer: { value: new THREE.Vector2(20, 20) },
          uPointerStrength: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uCoreColor: { value: new THREE.Color(coreColor) },
        },
        transparent: true,
        depthWrite: false,
        blending: blending === 'normal' ? THREE.NormalBlending : THREE.AdditiveBlending,
      }),
    [blending, color, coreColor, scale],
  )

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uProgress.value = THREE.MathUtils.clamp(progressRef.current, 0, 1)
    material.uniforms.uResonance.value = THREE.MathUtils.clamp(resonanceProgressRef?.current ?? 0, 0, 1)
    material.uniforms.uFlash.value = THREE.MathUtils.clamp(flashProgressRef?.current ?? 0, 0, 1)
    const desiredX = pointerRef?.current.x ?? 20
    const desiredY = pointerRef?.current.y ?? 20
    smoothedPointer.current.x = THREE.MathUtils.damp(smoothedPointer.current.x, desiredX, 9, delta)
    smoothedPointer.current.y = THREE.MathUtils.damp(smoothedPointer.current.y, desiredY, 9, delta)
    smoothedStrength.current = THREE.MathUtils.damp(smoothedStrength.current, pointerRef?.current.strength ?? 0, 7, delta)
    material.uniforms.uPointer.value.copy(smoothedPointer.current)
    material.uniforms.uPointerStrength.value = smoothedStrength.current
    if (pointsRef.current && offsetRef) {
      pointsRef.current.position.x = THREE.MathUtils.damp(pointsRef.current.position.x, offsetRef.current.x, 10, delta)
      pointsRef.current.position.y = THREE.MathUtils.damp(pointsRef.current.position.y, offsetRef.current.y, 10, delta)
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
