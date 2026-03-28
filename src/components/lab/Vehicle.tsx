'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { INPUT } from './input'

useGLTF.preload('/models/aquaris/scene.gltf')


export default function Vehicle({ speedRef }: { speedRef: { current: number } }) {
  const groupRef = useRef<THREE.Group>(null!)
  const shipRef = useRef<THREE.Group>(null!)
  const flameRef = useRef<THREE.Group>(null!)

  const yaw = useRef(Math.PI / 2)
  const pitch = useRef(0)
  const speed = useRef(0)
  const visualRoll = useRef(0)

  const { scene } = useGLTF('/models/aquaris/scene.gltf')


  useFrame((state, delta) => {
    const group = groupRef.current
    const ship = shipRef.current
    const flame = flameRef.current
    if (!group || !ship) return
    const dt = Math.min(delta, 0.05)
    const keys = INPUT.keys

    if (Math.abs(INPUT.mouseX) > 0.5) yaw.current -= INPUT.mouseX * 0.002
    if (Math.abs(INPUT.mouseY) > 0.5) pitch.current -= INPUT.mouseY * 0.002
    pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2.5, Math.PI / 2.5)
    INPUT.mouseX = 0
    INPUT.mouseY = 0

    const turnInput = (keys.a ? 1 : 0) - (keys.d ? 1 : 0)
    yaw.current += turnInput * 1.5 * dt

    if (keys.q) pitch.current += 1.0 * dt
    if (keys.e) pitch.current -= 1.0 * dt
    pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2.5, Math.PI / 2.5)

    const euler = new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ')
    group.quaternion.setFromEuler(euler)

    const targetRoll = turnInput * 0.7
    visualRoll.current = THREE.MathUtils.lerp(visualRoll.current, targetRoll, 0.06)
    ship.rotation.z = visualRoll.current
    ship.rotation.x = Math.abs(visualRoll.current) * 0.15

    const boosting = !!keys.shift
    const maxSpeed = boosting ? 2000 : 200
    const accel = boosting ? 800 : 160
    const isThrusting = !!keys.w
    if (keys.w) speed.current = Math.min(speed.current + accel * dt, maxSpeed)
    else if (keys.s) speed.current = Math.max(speed.current - 60 * dt, -maxSpeed * 0.15)
    else { speed.current *= 0.95; if (Math.abs(speed.current) < 0.5) speed.current = 0 }
    // Smooth deceleration when boost released
    if (!boosting && speed.current > 200) speed.current = THREE.MathUtils.lerp(speed.current, 200, 0.03)

    if (keys.space) group.position.y += (boosting ? 800 : 80) * dt

    if (Math.abs(speed.current) > 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(group.quaternion)
      group.position.addScaledVector(forward, speed.current * dt)
    }

    speedRef.current = Math.abs(speed.current)

    // Engine flame
    if (flame) {
      const ratio = Math.abs(speed.current) / 200 // base maxSpeed for flame scaling
      if (isThrusting && ratio > 0.01) {
        flame.visible = true
        const boostMul = boosting ? 2.5 : 1
        const len = (0.5 + Math.min(ratio, 1) * 1.5) * boostMul
        const width = (0.8 + Math.min(ratio, 1) * 0.4) * (boosting ? 1.5 : 1)
        flame.scale.set(width, width, len)
        flame.scale.x *= 0.9 + Math.random() * 0.2
        flame.scale.y *= 0.9 + Math.random() * 0.2
      } else {
        flame.visible = false
      }
    }

    // Camera
    const camOffset = new THREE.Vector3(0, 0.8, 4).applyQuaternion(group.quaternion)
    state.camera.position.copy(group.position).add(camOffset)
    state.camera.lookAt(
      group.position.clone().add(new THREE.Vector3(0, 0.1, -20).applyQuaternion(group.quaternion))
    )
  })

  return (
    <group ref={groupRef} position={[55100, 50, 10]}>
      <group ref={shipRef}>
        {/* Aquaris — scale adjusted to be small but visible */}
        <primitive object={scene.clone()} scale={[0.02, 0.02, 0.02]} rotation={[0, Math.PI, 0]} />

        {/* Engine flame — multi-layer for quality */}
        <group ref={flameRef} position={[0, -0.15, 0.9]} visible={false}>
          {/* Outer glow */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.07, 1, 12]} />
            <meshBasicMaterial color="#0066ff" transparent opacity={0.3} />
          </mesh>
          {/* Mid flame */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.05]}>
            <coneGeometry args={[0.04, 0.7, 12]} />
            <meshBasicMaterial color="#00ccff" transparent opacity={0.6} />
          </mesh>
          {/* Inner core */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
            <coneGeometry args={[0.02, 0.4, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          {/* Point light from engine */}
          <pointLight color="#00aaff" intensity={4} distance={5} decay={2} />
        </group>
      </group>

      {/* Strong local lights to illuminate the ship properly */}
      <pointLight position={[0, 2, 0]} color="#ffffff" intensity={8} distance={10} decay={2} />
      <pointLight position={[2, 0.5, -1]} color="#eeeeff" intensity={4} distance={8} decay={2} />
      <pointLight position={[-2, 0.5, -1]} color="#eeeeff" intensity={4} distance={8} decay={2} />
      <pointLight position={[0, 0, 1]} color="#00aaff" intensity={3} distance={6} decay={2} />
      <pointLight position={[0, -1, 0]} color="#334466" intensity={2} distance={6} decay={2} />
    </group>
  )
}
