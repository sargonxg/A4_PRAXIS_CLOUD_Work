'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { buildSignalEvidenceNetwork } from '@/lib/signal/visualizations';

type Network = ReturnType<typeof buildSignalEvidenceNetwork>;
export type SignalCameraCommand = { id: number; action: 'left' | 'right' | 'up' | 'down' | 'in' | 'out' | 'reset' };
const palette: Record<string, number> = { source: 0x0369a1, claim: 0x047857, narrative: 0x7c3aed, assessment: 0xb45309 };

export default function SignalNetworkScene({ network, selectedId, command, onSelect, onUnavailable }: {
  network: Network; selectedId: string | null; command: SignalCameraCommand | null;
  onSelect: (id: string) => void; onUnavailable: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onSelect, onUnavailable });
  const selected = useRef(selectedId);
  const highlightSelection = useRef<((id: string | null) => void) | null>(null);
  const cameraAction = useRef<((action: SignalCameraCommand['action']) => void) | null>(null);
  useEffect(() => { callbacks.current = { onSelect, onUnavailable }; }, [onSelect, onUnavailable]);
  useEffect(() => { selected.current = selectedId; highlightSelection.current?.(selectedId); }, [selectedId]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
    catch { callbacks.current.onUnavailable(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xf8fafc);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    const vectors = network.nodes.map(node => new THREE.Vector3(node.position.x, node.position.y, node.position.z));
    const bounds = new THREE.Box3().setFromPoints(vectors.length ? vectors : [new THREE.Vector3()]);
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = Math.max(bounds.getSize(new THREE.Vector3()).length() * 0.7, 85);
    const initial = center.clone().add(new THREE.Vector3(radius * 0.8, radius * 0.5, radius * 1.8));
    camera.position.copy(initial);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center); controls.enableDamping = false;
    controls.minDistance = Math.max(20, radius * 0.25); controls.maxDistance = radius * 7;
    controls.update();
    let disposed = false;
    let frame: number | null = null;
    const render = () => {
      if (disposed || frame !== null) return;
      frame = requestAnimationFrame(() => { frame = null; if (!disposed) renderer.render(scene, camera); });
    };
    controls.addEventListener('change', render);
    const geometry = new THREE.SphereGeometry(Math.max(2.2, Math.min(radius / 50, 5)), 14, 10);
    const materials: THREE.MeshBasicMaterial[] = [];
    const meshes: THREE.Mesh[] = [];
    const locations = new Map<string, THREE.Vector3>();
    network.nodes.forEach((node, index) => {
      const unavailable = !node.current || node.status === 'rejected' || node.status === 'withdrawn' || node.status === 'stale';
      const material = new THREE.MeshBasicMaterial({ color: node.id === selected.current ? 0x111827 : unavailable ? 0x64748b : palette[node.kind] ?? 0x475569, transparent: unavailable, opacity: unavailable ? 0.5 : 1 });
      materials.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(vectors[index]); mesh.userData.nodeId = node.id;
      if (node.id === selected.current) mesh.scale.setScalar(1.6);
      meshes.push(mesh); locations.set(node.id, vectors[index]); scene.add(mesh);
    });
    highlightSelection.current = id => {
      network.nodes.forEach((node, index) => {
        const unavailable = !node.current || ['rejected', 'withdrawn', 'stale'].includes(node.status);
        materials[index].color.setHex(node.id === id ? 0x111827 : unavailable ? 0x64748b : palette[node.kind] ?? 0x475569);
        meshes[index].scale.setScalar(node.id === id ? 1.6 : 1);
      });
      render();
    };
    const linePoints: number[] = [];
    for (const edge of network.edges) {
      const from = locations.get(edge.source), to = locations.get(edge.target);
      if (from && to) linePoints.push(from.x, from.y, from.z, to.x, to.y, to.z);
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.65 });
    scene.add(new THREE.LineSegments(lineGeometry, lineMaterial));
    const resize = () => {
      if (disposed) return;
      const width = Math.max(container.clientWidth, 1), height = Math.max(container.clientHeight, 1);
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const start = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
    const select = (event: PointerEvent) => {
      if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) { down = null; return; }
      down = null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (hit && typeof hit.object.userData.nodeId === 'string') callbacks.current.onSelect(hit.object.userData.nodeId);
    };
    const lost = (event: Event) => { event.preventDefault(); if (!disposed) callbacks.current.onUnavailable(); };
    renderer.domElement.addEventListener('pointerdown', start);
    renderer.domElement.addEventListener('pointerup', select);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    cameraAction.current = action => {
      if (action === 'reset') { camera.position.copy(initial); controls.target.copy(center); }
      else {
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        if (action === 'left') spherical.theta -= Math.PI / 9;
        if (action === 'right') spherical.theta += Math.PI / 9;
        if (action === 'up') spherical.phi -= Math.PI / 12;
        if (action === 'down') spherical.phi += Math.PI / 12;
        if (action === 'in') spherical.radius *= 0.8;
        if (action === 'out') spherical.radius *= 1.25;
        spherical.makeSafe(); spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      }
      controls.update(); render();
      // Camera coordinates are observable for QA, without modifying evidence/layout.
      container.dataset.camera = camera.position.toArray().map(value => value.toFixed(3)).join(',');
    };
    container.dataset.camera = camera.position.toArray().map(value => value.toFixed(3)).join(',');
    render();
    return () => {
      disposed = true; cameraAction.current = null; highlightSelection.current = null;
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener('change', render); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', start);
      renderer.domElement.removeEventListener('pointerup', select);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      geometry.dispose(); materials.forEach(material => material.dispose()); lineGeometry.dispose(); lineMaterial.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [network]);
  useEffect(() => { if (command) cameraAction.current?.(command.action); }, [command]);
  return <div ref={host} className="h-[22rem] w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 sm:h-[28rem]" data-testid="signal-network-webgl" role="img" aria-label="Interactive 3D evidence network. Use camera controls and the accessible node list below." />;
}
