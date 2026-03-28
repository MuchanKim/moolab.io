'use client'

import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useLoader, useThree, extend } from '@react-three/fiber'
import { useGLTF, Stars, shaderMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

function sr(seed: number): number {
  return ((Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453) % 1 + 1) % 1
}

// ────────────────────────────────────────────
// Solar System — researched angular sizes
//
// DESIGN GOAL: from Earth's vicinity...
//   Sun  → small bright disc (~2° for visibility, real=0.53°)
//   Moon → similar size to Sun (~1.5°, real=0.52°)
//   Mars → tiny dot (< 0.5°)
//   Jupiter → small dot (~0.7°)
//   Saturn, Neptune → barely visible specks
//
// Calculation: angular_diameter = 2 * atan(radius / distance)
// For Sun r=800 to appear ~2°: d = 800/tan(1°) = 45,836 → use 50,000
// For Moon r=41 to appear ~1.5°: d = 41/tan(0.75°) = 3,131 → use 3,500
// ────────────────────────────────────────────

interface PlanetConfig {
  name: string; texture: string; radius: number; distance: number
  orbitSpeed: number; spinSpeed: number; tilt: number; orbitOffset: number
  isSun?: boolean; ring?: { inner: number; outer: number }
  atmosphere?: string; clouds?: string
}

const PLANETS: PlanetConfig[] = [
  // Sun: from Earth (50k away), angular size ≈ 1.83° — small bright disc ✓
  // Orbit speeds reduced ~20x — planets barely move, no "diagonal drift"
  // Self-rotation (spinSpeed) kept visible for aesthetics
  { name: 'Sun', texture: '/textures/sun_8k.jpg', radius: 800, distance: 0, orbitSpeed: 0, spinSpeed: 0.003, tilt: 0, isSun: true, orbitOffset: 0 },
  // Earth removed — now uses glTF model (EarthModel component)
  { name: 'Mars', texture: '/textures/mars_8k.jpg', radius: 80, distance: 75000, orbitSpeed: 0.00001, spinSpeed: 0.028, tilt: 0.44, atmosphere: '#cc6644', orbitOffset: 2.5 },
  { name: 'Jupiter', texture: '/textures/jupiter_8k.jpg', radius: 800, distance: 130000, orbitSpeed: 0.000004, spinSpeed: 0.08, tilt: 0.05, atmosphere: '#ddaa66', orbitOffset: 4.0 },
  { name: 'Saturn', texture: '/textures/saturn_8k.jpg', radius: 650, distance: 200000, orbitSpeed: 0.000002, spinSpeed: 0.07, tilt: 0.47, ring: { inner: 780, outer: 1100 }, atmosphere: '#ccbb88', orbitOffset: 5.5 },
  { name: 'Neptune', texture: '/textures/neptune.jpg', radius: 400, distance: 320000, orbitSpeed: 0.0000005, spinSpeed: 0.05, tilt: 0.49, atmosphere: '#3366cc', orbitOffset: 1.8 },
]

const MOON_CFG = { earthDist: 30000, orbitSpeed: 0.0002 }

// ────────────────────────────────────────────
// Planet
// ────────────────────────────────────────────
function Planet({ config }: { config: PlanetConfig }) {
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)
  const cloudsRef = useRef<THREE.Mesh>(null!)
  const { gl } = useThree()
  const texture = useLoader(THREE.TextureLoader, config.texture)
  const cloudsTexture = config.clouds ? useLoader(THREE.TextureLoader, config.clouds) : null

  useMemo(() => {
    const maxA = gl.capabilities.getMaxAnisotropy()
    texture.anisotropy = maxA
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.generateMipmaps = true
    texture.needsUpdate = true
    if (cloudsTexture) {
      cloudsTexture.anisotropy = maxA
      cloudsTexture.generateMipmaps = true
      cloudsTexture.needsUpdate = true
    }
  }, [gl, texture, cloudsTexture])

  useFrame((_, delta) => {
    if (!groupRef.current || !meshRef.current) return
    if (config.distance > 0) {
      const t = performance.now() * 0.001 * config.orbitSpeed + config.orbitOffset
      groupRef.current.position.x = Math.cos(t) * config.distance
      groupRef.current.position.z = Math.sin(t) * config.distance
    }
    meshRef.current.rotation.y += config.spinSpeed * delta
    if (cloudsRef.current) cloudsRef.current.rotation.y += config.spinSpeed * 1.2 * delta
  })

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} rotation={[config.tilt, 0, 0]}>
        <sphereGeometry args={[config.radius, 128, 128]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      {cloudsTexture && (
        <mesh ref={cloudsRef} rotation={[config.tilt, 0, 0]}>
          <sphereGeometry args={[config.radius * 1.004, 96, 96]} />
          <meshBasicMaterial map={cloudsTexture} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}

      {config.isSun && (
        <>
          <pointLight color="#fff5e0" intensity={50000} distance={400000} decay={1} />
          <mesh>
            <sphereGeometry args={[config.radius * 1.08, 32, 32]} />
            <meshBasicMaterial color="#ffaa33" transparent opacity={0.1} side={THREE.BackSide} />
          </mesh>
        </>
      )}

      {config.atmosphere && !config.isSun && (
        <mesh>
          <sphereGeometry args={[config.radius * 1.02, 48, 48]} />
          <meshBasicMaterial color={config.atmosphere} transparent opacity={0.04} side={THREE.BackSide} />
        </mesh>
      )}

      {config.ring && (
        <mesh rotation={[1.2, 0, 0.15]}>
          <ringGeometry args={[config.ring.inner, config.ring.outer, 128]} />
          <meshStandardMaterial color="#c4a46a" side={THREE.DoubleSide} transparent opacity={0.6} roughness={0.9} />
        </mesh>
      )}
    </group>
  )
}

// ────────────────────────────────────────────
// Earth (glTF model — surface + atmosphere + clouds + city lights)
// ────────────────────────────────────────────
function EarthModel() {
  const { scene } = useGLTF('/models/earth/scene.gltf')
  const groupRef = useRef<THREE.Group>(null!)
  const modelRef = useRef<THREE.Group>(null!)
  const cloned = useMemo(() => scene.clone(), [scene])

  useFrame((_, delta) => {
    if (!groupRef.current || !modelRef.current) return
    const t = performance.now() * 0.001 * 0.000015
    groupRef.current.position.x = Math.cos(t) * 50000
    groupRef.current.position.z = Math.sin(t) * 50000
    modelRef.current.rotation.y += 0.03 * delta
  })

  // Effective radius after node transforms ≈ 1.14 → scale to radius ~5000
  return (
    <group ref={groupRef}>
      <group ref={modelRef} rotation={[0.41, 0, 0]}>
        <primitive object={cloned} scale={[4386, 4386, 4386]} />
      </group>
    </group>
  )
}

// ────────────────────────────────────────────
// Moon (glTF model — PBR with normal map)
// ────────────────────────────────────────────
function MoonModel() {
  const { scene } = useGLTF('/models/moon/scene.gltf')
  const groupRef = useRef<THREE.Group>(null!)
  const modelRef = useRef<THREE.Group>(null!)
  const cloned = useMemo(() => scene.clone(), [scene])

  useFrame((_, delta) => {
    if (!groupRef.current || !modelRef.current) return
    const earthT = performance.now() * 0.001 * 0.000015
    const ex = Math.cos(earthT) * 50000
    const ez = Math.sin(earthT) * 50000
    const mt = performance.now() * 0.001 * MOON_CFG.orbitSpeed
    groupRef.current.position.set(
      ex + Math.cos(mt) * MOON_CFG.earthDist,
      Math.sin(mt * 0.3) * 30,
      ez + Math.sin(mt) * MOON_CFG.earthDist,
    )
    modelRef.current.rotation.y += 0.003 * delta
  })

  // glTF model radius ≈ 1.0 → scale to radius ~1365 (Earth 0.273 ratio)
  return (
    <group ref={groupRef}>
      <group ref={modelRef}>
        <primitive object={cloned} scale={[1365, 1365, 1365]} />
      </group>
    </group>
  )
}

// ────────────────────────────────────────────
// Asteroid belt (between Mars 75k and Jupiter 130k)
// ────────────────────────────────────────────
function AsteroidBelt() {
  const { scene: rock } = useGLTF('/models/rock.glb')
  const count = 500
  const ref = useRef<THREE.InstancedMesh>(null!)
  const geo = useMemo(() => { let g: THREE.BufferGeometry | null = null; rock.traverse(c => { if (c instanceof THREE.Mesh && !g) g = c.geometry.clone() }); return g }, [rock])

  useEffect(() => {
    if (!ref.current || !geo) return
    const d = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const a = sr(i * 17) * Math.PI * 2
      const dist = 90000 + sr(i * 31) * 25000
      const h = (sr(i * 53) - 0.5) * 500
      d.position.set(Math.cos(a) * dist, h, Math.sin(a) * dist)
      d.rotation.set(sr(i * 71) * 6, sr(i * 89) * 6, sr(i * 97) * 6)
      d.scale.setScalar(5 + sr(i * 41) * 30)
      d.updateMatrix()
      ref.current.setMatrixAt(i, d.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [geo, count])

  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.000005 })
  if (!geo) return null
  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial color="#999988" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  )
}

// ────────────────────────────────────────────
// Background
// ────────────────────────────────────────────
function SpaceBackground() {
  const { gl } = useThree()
  const bg = useLoader(THREE.TextureLoader, '/textures/stars_8k.jpg')
  useMemo(() => { bg.anisotropy = gl.capabilities.getMaxAnisotropy(); bg.needsUpdate = true }, [gl, bg])

  return (
    <>
      <mesh>
        <sphereGeometry args={[500000, 64, 64]} />
        <meshBasicMaterial map={bg} side={THREE.BackSide} />
      </mesh>
      <Stars radius={400000} depth={10000} count={4000} factor={15} saturation={0.15} fade speed={0.1} />
      <Stars radius={200000} depth={3000} count={2000} factor={8} saturation={0.3} fade speed={0.2} />
      {/* Environment map — gives PBR metals something to reflect */}
      <Environment preset="night" background={false} />

      <ambientLight intensity={0.5} color="#556688" />
      <hemisphereLight args={['#aabbcc', '#223344', 0.3]} />
      <directionalLight position={[-400, 150, 200]} intensity={0.5} color="#aabbcc" />
    </>
  )
}

// ────────────────────────────────────────────
// Galaxy model (distant backdrop)
// ────────────────────────────────────────────
function GalaxyModel() {
  const { scene } = useGLTF('/models/galaxy/scene.gltf')
  const ref = useRef<THREE.Group>(null!)
  const cloned = useMemo(() => {
    const s = scene.clone()
    s.traverse((child) => {
      const points = child as THREE.Points
      const mesh = child as THREE.Mesh
      if (points.isPoints || mesh.isMesh) {
        const mat = (points.isPoints ? points : mesh).material as THREE.MeshBasicMaterial
        mat.vertexColors = true
        mat.toneMapped = false
        mat.needsUpdate = true
      }
    })
    return s
  }, [scene])

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0001
  })

  return (
    <group ref={ref} position={[-100000, 30000, -300000]}>
      <primitive object={cloned} scale={[1500, 1500, 1500]} />
    </group>
  )
}

// ────────────────────────────────────────────
useGLTF.preload('/models/rock.glb')

useGLTF.preload('/models/galaxy/scene.gltf')
useGLTF.preload('/models/earth/scene.gltf')
useGLTF.preload('/models/moon/scene.gltf')

export default function World() {
  return (
    <>
      <SpaceBackground />
      {PLANETS.map(c => <Planet key={c.name} config={c} />)}
      <EarthModel />
      <MoonModel />
      <AsteroidBelt />
      <GalaxyModel />
    </>
  )
}
