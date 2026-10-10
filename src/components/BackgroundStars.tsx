import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { seededRandom } from '../utils/seededRandom'

type Props = {
  seed: string
  count?: number
  radius?: number
  color?: string
  drift?: number
}

export function BackgroundStars({ seed, count = 900, radius = 8, color = '#cfe8ff', drift = 0.006 }: Props) {
  const ref = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const random = seededRandom(seed)
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let index = 0; index < count; index += 1) {
      const r = radius * Math.cbrt(random())
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      positions[index * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[index * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[index * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 0.8
      sizes[index] = 0.4 + random() * 1.2
    }
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    next.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return next
  }, [count, radius, seed])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * drift
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color={color} size={0.022} transparent opacity={0.76} sizeAttenuation depthWrite={false} />
    </points>
  )
}
