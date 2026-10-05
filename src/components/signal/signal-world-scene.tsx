'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SIGNAL_WORLD_GEOGRAPHY } from '@/lib/signal/world-geography';
import type { SignalWorldCountry } from '@/lib/signal/world-schema';

export type WorldCameraCommand = { id: number; action: 'left' | 'right' | 'up' | 'down' | 'in' | 'out' | 'reset' };
function point(latitude: number, longitude: number, radius: number) { const lat = THREE.MathUtils.degToRad(latitude), lon = THREE.MathUtils.degToRad(longitude); return new THREE.Vector3(radius * Math.cos(lat) * Math.sin(lon), radius * Math.sin(lat), radius * Math.cos(lat) * Math.cos(lon)); }
/** Unwrap the dateline before planar triangulation, then project subdivided triangles onto the sphere. */
function polygonGeometry(rings: number[][][]) {
  const vertices: number[] = [];
  for (const ring of rings) {
    if (ring.length < 4) continue;
    const points: THREE.Vector2[] = []; let previous = ring[0][0];
    for (const [longitude, latitude] of ring.slice(0, -1)) { let lon = longitude; while (lon - previous > 180) lon -= 360; while (lon - previous < -180) lon += 360; previous = lon; points.push(new THREE.Vector2(lon, latitude)); }
    for (const indexes of THREE.ShapeUtils.triangulateShape(points, [])) {
      const [a, b, c] = indexes.map(index => points[index]);
      const steps = Math.min(32, Math.max(1, Math.ceil(Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)) / 5)));
      const sample = (i: number, j: number) => point(a.y + (b.y - a.y) * i / steps + (c.y - a.y) * j / steps, a.x + (b.x - a.x) * i / steps + (c.x - a.x) * j / steps, 100.5);
      const triangle = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3) => vertices.push(...v1.toArray(), ...v2.toArray(), ...v3.toArray());
      for (let i = 0; i < steps; i++) for (let j = 0; j < steps - i; j++) { triangle(sample(i, j), sample(i + 1, j), sample(i, j + 1)); if (i + j < steps - 1) triangle(sample(i + 1, j), sample(i + 1, j + 1), sample(i, j + 1)); }
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.computeVertexNormals(); return geometry;
}

export default function SignalWorldScene({ countries, selectedCode, command, onSelect, onUnavailable }: { countries: SignalWorldCountry[]; selectedCode: string | null; command: WorldCameraCommand | null; onSelect: (code: string) => void; onUnavailable: () => void }) {
  const host = useRef<HTMLDivElement>(null), callbacks = useRef({ onSelect, onUnavailable });
  const selectCountry = useRef<((code: string | null) => void) | null>(null), moveCamera = useRef<((action: WorldCameraCommand['action']) => void) | null>(null);
  useEffect(() => { callbacks.current = { onSelect, onUnavailable }; }, [onSelect, onUnavailable]);
  useEffect(() => {
    const container = host.current; if (!container) return; let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch { callbacks.current.onUnavailable(); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0x061321); renderer.domElement.setAttribute('aria-hidden', 'true'); renderer.domElement.style.touchAction = 'none'; container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 1, 2000), neutral = new THREE.Vector3(0, 65, 340); camera.position.copy(neutral);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enablePan = false; controls.enableDamping = false; controls.minDistance = 155; controls.maxDistance = 570;
    const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []; let disposed = false, frame: number | null = null;
    const render = () => { if (disposed || frame !== null) return; frame = requestAnimationFrame(() => { frame = null; if (!disposed) { container.dataset.camera = camera.position.toArray().map(value => value.toFixed(3)).join(','); renderer.render(scene, camera); } }); }; controls.addEventListener('change', render);
    scene.add(new THREE.AmbientLight(0xbad6ef, 1.7)); const light = new THREE.DirectionalLight(0xe5f4ff, 2.2); light.position.set(-180, 170, 280); scene.add(light);
    const oceanGeometry = new THREE.SphereGeometry(100, 72, 48), oceanMaterial = new THREE.MeshStandardMaterial({ color: 0x082c48, roughness: .85, metalness: .12 }); geometries.push(oceanGeometry); materials.push(oceanMaterial); const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial); scene.add(ocean);
    const selectable = new Set(countries.map(country => country.code)); const countryMeshes: THREE.Mesh[] = [];
    for (const country of SIGNAL_WORLD_GEOGRAPHY) {
      const geometry = polygonGeometry(country.polygons), available = country.code !== null && selectable.has(country.code), material = new THREE.MeshStandardMaterial({ color: available ? 0x3b8290 : 0x254654, roughness: 1, side: THREE.DoubleSide }); geometries.push(geometry); materials.push(material);
      const mesh = new THREE.Mesh(geometry, material); mesh.userData.countryCode = country.code; mesh.userData.available = available; countryMeshes.push(mesh); scene.add(mesh);
    }
    const boundaries: number[] = []; for (const country of SIGNAL_WORLD_GEOGRAPHY) for (const ring of country.polygons) for (let i = 1; i < ring.length; i++) { const a = point(ring[i - 1][1], ring[i - 1][0], 100.8), b = point(ring[i][1], ring[i][0], 100.8); boundaries.push(...a.toArray(), ...b.toArray()); }
    const boundaryGeometry = new THREE.BufferGeometry(); boundaryGeometry.setAttribute('position', new THREE.Float32BufferAttribute(boundaries, 3)); const boundaryMaterial = new THREE.LineBasicMaterial({ color: 0x92d5d0, transparent: true, opacity: .48 }); geometries.push(boundaryGeometry); materials.push(boundaryMaterial); scene.add(new THREE.LineSegments(boundaryGeometry, boundaryMaterial));
    const atmosphereGeometry = new THREE.SphereGeometry(102, 64, 40), atmosphereMaterial = new THREE.ShaderMaterial({ transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, vertexShader: 'varying vec3 n; varying vec3 viewDirection; void main(){ vec4 v=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal); viewDirection=normalize(-v.xyz); gl_Position=projectionMatrix*v; }', fragmentShader: 'varying vec3 n; varying vec3 viewDirection; void main(){ float rim=pow(1.0-abs(dot(normalize(n),normalize(viewDirection))),3.0); gl_FragColor=vec4(0.12,0.48,0.76,rim*0.36); }' }); geometries.push(atmosphereGeometry); materials.push(atmosphereMaterial); scene.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));
    const stars: number[] = []; for (let i = 0; i < 220; i++) { const theta = i * 2.399963229728653, y = 1 - 2 * (i + .5) / 220, radius = Math.sqrt(1 - y * y); stars.push(800 * radius * Math.cos(theta), 800 * y, 800 * radius * Math.sin(theta)); } const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3)); const starMaterial = new THREE.PointsMaterial({ color: 0xa6c7e0, size: 1.7, transparent: true, opacity: .45 }); geometries.push(starGeometry); materials.push(starMaterial); scene.add(new THREE.Points(starGeometry, starMaterial));
    const ringGeometry = new THREE.TorusGeometry(4, .5, 8, 40), ringMaterial = new THREE.MeshBasicMaterial({ color: 0xf8dba0 }); geometries.push(ringGeometry); materials.push(ringMaterial); const ring = new THREE.Mesh(ringGeometry, ringMaterial); ring.visible = false; scene.add(ring);
    let focusedCode: string | null = null; selectCountry.current = code => { focusedCode = code; const anchor = SIGNAL_WORLD_GEOGRAPHY.find(country => country.code === code); for (const mesh of countryMeshes) (mesh.material as THREE.MeshStandardMaterial).color.setHex(mesh.userData.countryCode === code ? 0xb8aa73 : mesh.userData.available ? 0x3b8290 : 0x254654); if (anchor?.latitude != null && anchor.longitude != null) { const vector = point(anchor.latitude, anchor.longitude, 103); ring.position.copy(vector); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vector.clone().normalize()); ring.visible = true; camera.position.copy(vector.clone().normalize().multiplyScalar(335)); } else { ring.visible = false; camera.position.copy(neutral); } controls.update(); render(); };
    moveCamera.current = action => { if (action === 'reset') { selectCountry.current?.(focusedCode); return; } const spherical = new THREE.Spherical().setFromVector3(camera.position); if (action === 'left') spherical.theta -= Math.PI / 6; if (action === 'right') spherical.theta += Math.PI / 6; if (action === 'up') spherical.phi -= Math.PI / 12; if (action === 'down') spherical.phi += Math.PI / 12; if (action === 'in') spherical.radius *= .8; if (action === 'out') spherical.radius *= 1.25; spherical.makeSafe(); spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance); camera.position.setFromSpherical(spherical); controls.update(); render(); };
    const resize = () => { if (disposed) return; const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight); renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render(); }; const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down: { x: number; y: number } | null = null;
    const start = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; }; const pick = (event: PointerEvent) => { if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) { down = null; return; } down = null; const rect = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects([ocean, ...countryMeshes], false)[0]; if (hit?.object.userData.available && typeof hit.object.userData.countryCode === 'string') { container.dataset.pickedCountry = hit.object.userData.countryCode; callbacks.current.onSelect(hit.object.userData.countryCode); } };
    const lost = (event: Event) => { event.preventDefault(); if (!disposed) callbacks.current.onUnavailable(); }; renderer.domElement.addEventListener('pointerdown', start); renderer.domElement.addEventListener('pointerup', pick); renderer.domElement.addEventListener('webglcontextlost', lost); controls.update(); render();
    return () => { disposed = true; selectCountry.current = null; moveCamera.current = null; if (frame !== null) cancelAnimationFrame(frame); observer.disconnect(); controls.removeEventListener('change', render); controls.dispose(); renderer.domElement.removeEventListener('pointerdown', start); renderer.domElement.removeEventListener('pointerup', pick); renderer.domElement.removeEventListener('webglcontextlost', lost); geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, [countries]);
  useEffect(() => { selectCountry.current?.(selectedCode); }, [selectedCode, countries]);
  useEffect(() => { if (command) moveCamera.current?.(command.action); }, [command]);
  return <div ref={host} className="h-[24rem] w-full min-w-0 overflow-hidden rounded-2xl sm:h-[33rem]" data-testid="signal-world-webgl" role="img" aria-label="Interactive world globe. Filled highlighted countries have a source panel available. Use camera controls or the accessible country selector." />;
}
