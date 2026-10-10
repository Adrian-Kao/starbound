import { useEffect, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'

type Props = {
  entering: boolean
  onActivate: () => void
  onEntered: () => void
}

function TripodLeg({ rotation, position }: { rotation: [number, number, number]; position: [number, number, number] }) {
  return (
    <mesh rotation={rotation} position={position} castShadow>
      <cylinderGeometry args={[0.055, 0.075, 2.45, 12]} />
      <meshStandardMaterial color="#6b7180" metalness={0.88} roughness={0.27} />
    </mesh>
  )
}

export function Telescope3D({ entering, onActivate, onEntered }: Props) {
  const telescope = useRef<THREE.Group>(null)
  const { camera, pointer } = useThree()
  const enteredRef = useRef(false)

  useFrame((state, delta) => {
    if (!telescope.current || entering) return
    telescope.current.rotation.y = THREE.MathUtils.lerp(telescope.current.rotation.y, pointer.x * 0.13 - 0.08, delta * 1.8)
    telescope.current.rotation.x = THREE.MathUtils.lerp(telescope.current.rotation.x, pointer.y * 0.05, delta * 1.8)
    telescope.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.035
  })

  useEffect(() => {
    if (!entering || enteredRef.current) return
    enteredRef.current = true
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: onEntered,
    })
    timeline.to(camera.position, {
      x: 0,
      y: 0.58,
      z: 2.05,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.35 : 1.55,
      onUpdate: () => camera.lookAt(0, 0.5, 0),
    })
    if (telescope.current) timeline.to(telescope.current.rotation, { y: 0, duration: 1.1 }, 0)
    return () => { timeline.kill() }
  }, [camera, entering, onEntered])

  const activate = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (!entering) onActivate()
  }

  return (
    <Float speed={1.15} rotationIntensity={0.03} floatIntensity={0.12}>
      <group ref={telescope} position={[0, -0.2, 0]} onClick={activate} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
        <group position={[0, 0.65, 0]} rotation={[0, -0.08, -0.14]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.39, 0.52, 2.75, 64]} />
            <meshPhysicalMaterial color="#2a3343" metalness={0.93} roughness={0.2} clearcoat={0.82} clearcoatRoughness={0.13} />
          </mesh>
          <mesh position={[0, 0, 1.39]}>
            <cylinderGeometry args={[0.52, 0.52, 0.2, 64]} />
            <meshStandardMaterial color="#8794a8" metalness={0.98} roughness={0.16} />
          </mesh>
          <mesh position={[0, 0, 1.51]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.43, 64]} />
            <meshPhysicalMaterial color="#2a97c5" emissive="#0b4c79" emissiveIntensity={0.52} metalness={0.2} roughness={0.05} transmission={0.26} transparent opacity={0.92} />
          </mesh>
          <mesh position={[0, 0, 1.54]}>
            <torusGeometry args={[0.475, 0.055, 18, 64]} />
            <meshStandardMaterial color="#bac4d1" metalness={1} roughness={0.12} />
          </mesh>
          <mesh position={[0, 0, -1.42]}>
            <cylinderGeometry args={[0.25, 0.36, 0.38, 40]} />
            <meshStandardMaterial color="#131b2a" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[-0.06, 0.19, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.11, 30]} />
            <meshStandardMaterial color="#f1d6a6" metalness={0.96} roughness={0.18} />
          </mesh>
        </group>

        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.24, 32, 20]} />
          <meshStandardMaterial color="#828c9d" metalness={0.95} roughness={0.22} />
        </mesh>
        <mesh position={[0, -0.54, 0]}>
          <cylinderGeometry args={[0.13, 0.16, 0.72, 24]} />
          <meshStandardMaterial color="#4e596b" metalness={0.9} roughness={0.25} />
        </mesh>
        <TripodLeg position={[-0.55, -1.55, 0.12]} rotation={[0.1, 0, -0.38]} />
        <TripodLeg position={[0.55, -1.55, 0.12]} rotation={[0.1, 0, 0.38]} />
        <TripodLeg position={[0, -1.55, -0.5]} rotation={[-0.38, 0, 0]} />
      </group>
    </Float>
  )
}
