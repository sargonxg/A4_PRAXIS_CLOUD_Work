'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SIGNAL_WORLD_GEOGRAPHY } from '@/lib/signal/world-geography';
import type { buildSignalCoverageGlobe } from '@/lib/signal/coverage-globe';
import type { SignalCameraCommand } from './signal-network-scene';

type Coverage = ReturnType<typeof buildSignalCoverageGlobe>;
function location(latitude:number,longitude:number,radius:number){const lat=THREE.MathUtils.degToRad(latitude),lon=THREE.MathUtils.degToRad(longitude);return new THREE.Vector3(radius*Math.cos(lat)*Math.sin(lon),radius*Math.sin(lat),radius*Math.cos(lat)*Math.cos(lon));}
export default function SignalGlobeScene({coverage,selectedCode,command,onSelect,onUnavailable}:{coverage:Coverage;selectedCode:string|null;command:SignalCameraCommand|null;onSelect:(code:string)=>void;onUnavailable:()=>void}){
 const host=useRef<HTMLDivElement>(null);const callbacks=useRef({onSelect,onUnavailable});const selected=useRef(selectedCode);
 const cameraAction=useRef<((action:SignalCameraCommand['action'])=>void)|null>(null);
 const highlight=useRef<((code:string|null)=>void)|null>(null);
 useEffect(()=>{callbacks.current={onSelect,onUnavailable};},[onSelect,onUnavailable]);
 useEffect(()=>{selected.current=selectedCode;highlight.current?.(selectedCode);},[selectedCode]);
 useEffect(()=>{
  const container=host.current;if(!container)return;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{callbacks.current.onUnavailable();return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0xf8fafc);renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.style.touchAction='none';container.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,0.1,3000);const defaultPosition=new THREE.Vector3(100,75,340);const anchor=coverage.countries.find(country=>country.activeSourceCount>0&&country.coordinateAvailable&&country.latitude!==null&&country.longitude!==null)??coverage.countries.find(country=>country.selected&&country.coordinateAvailable&&country.latitude!==null&&country.longitude!==null);const initial=anchor?location(anchor.latitude!,anchor.longitude!,defaultPosition.length()):defaultPosition;camera.position.copy(initial);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=false;controls.minDistance=140;controls.maxDistance=750;controls.update();
  let disposed=false,frame:number|null=null;const render=()=>{if(disposed||frame!==null)return;frame=requestAnimationFrame(()=>{frame=null;if(!disposed)renderer.render(scene,camera);});};controls.addEventListener('change',render);
  const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[];
  const earthGeometry=new THREE.SphereGeometry(100,64,40),earthMaterial=new THREE.MeshBasicMaterial({color:0xe0f2f1});geometries.push(earthGeometry);materials.push(earthMaterial);const earth=new THREE.Mesh(earthGeometry,earthMaterial);scene.add(earth);
  function lines(points:number[],color:number,opacity:number){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const material=new THREE.LineBasicMaterial({color,transparent:true,opacity});geometries.push(geometry);materials.push(material);scene.add(new THREE.LineSegments(geometry,material));}
  const graticule:number[]=[];
  for(let latitude=-60;latitude<=60;latitude+=30)for(let longitude=-180;longitude<180;longitude+=4){const a=location(latitude,longitude,100.1),b=location(latitude,longitude+4,100.1);graticule.push(a.x,a.y,a.z,b.x,b.y,b.z);}
  for(let longitude=-180;longitude<180;longitude+=30)for(let latitude=-90;latitude<90;latitude+=4){const a=location(latitude,longitude,100.1),b=location(latitude+4,longitude,100.1);graticule.push(a.x,a.y,a.z,b.x,b.y,b.z);}
  lines(graticule,0x94a3b8,0.35);
  const coasts:number[]=[];
  for(const country of SIGNAL_WORLD_GEOGRAPHY)for(const ring of country.polygons)for(let i=1;i<ring.length;i++){const [lonA,latA]=ring[i-1],[lonB,latB]=ring[i];const a=location(latA,lonA,100.35),b=location(latB,lonB,100.35);coasts.push(a.x,a.y,a.z,b.x,b.y,b.z);}
  lines(coasts,0x475569,0.7);
  const markers:THREE.Mesh[]=[],selectionRings:THREE.Mesh[]=[];
  const markerGeometry=new THREE.SphereGeometry(2.5,12,8),ringGeometry=new THREE.TorusGeometry(4,0.65,6,24);geometries.push(markerGeometry,ringGeometry);
  const mapped=coverage.countries.filter(country=>country.coordinateAvailable&&country.latitude!==null&&country.longitude!==null);
  for(const country of mapped){
   const vector=location(country.latitude!,country.longitude!,102.2);const color=country.activeSourceCount?0x047857:country.selected?0x0369a1:0x64748b;
   const markerMaterial=new THREE.MeshBasicMaterial({color,transparent:!country.activeSourceCount,opacity:country.activeSourceCount?1:0});materials.push(markerMaterial);const marker=new THREE.Mesh(markerGeometry,markerMaterial);marker.position.copy(vector);marker.userData.countryCode=country.code;markers.push(marker);scene.add(marker);
   const ringMaterial=new THREE.MeshBasicMaterial({color:country.selected?0x0369a1:0x64748b});materials.push(ringMaterial);const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.position.copy(vector);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),vector.clone().normalize());ring.visible=country.selected||!country.activeSourceCount;selectionRings.push(ring);scene.add(ring);
  }
  highlight.current=code=>{mapped.forEach((country,index)=>{markers[index].scale.setScalar(country.code===code?1.5:1);(markers[index].material as THREE.MeshBasicMaterial).color.setHex(country.code===code?0x111827:country.activeSourceCount?0x047857:country.selected?0x0369a1:0x64748b);selectionRings[index].scale.setScalar(country.code===code?1.3:1);});render();};highlight.current(selected.current);
  const resize=()=>{if(disposed)return;const width=Math.max(1,container.clientWidth),height=Math.max(1,container.clientHeight);renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down:{x:number;y:number}|null=null;
  const start=(event:PointerEvent)=>{down={x:event.clientX,y:event.clientY};};const select=(event:PointerEvent)=>{if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5){down=null;return;}down=null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects([...markers,...selectionRings],false)[0],occlusion=raycaster.intersectObject(earth,false)[0];if(hit&&(!occlusion||hit.distance<occlusion.distance)){const code=hit.object.userData.countryCode??mapped[selectionRings.indexOf(hit.object as THREE.Mesh)]?.code;if(typeof code==='string')callbacks.current.onSelect(code);}};
  const lost=(event:Event)=>{event.preventDefault();if(!disposed)callbacks.current.onUnavailable();};renderer.domElement.addEventListener('pointerdown',start);renderer.domElement.addEventListener('pointerup',select);renderer.domElement.addEventListener('webglcontextlost',lost);
  cameraAction.current=action=>{if(action==='reset')camera.position.copy(initial);else{const spherical=new THREE.Spherical().setFromVector3(camera.position);if(action==='left')spherical.theta-=Math.PI/6;if(action==='right')spherical.theta+=Math.PI/6;if(action==='up')spherical.phi-=Math.PI/12;if(action==='down')spherical.phi+=Math.PI/12;if(action==='in')spherical.radius*=0.8;if(action==='out')spherical.radius*=1.25;spherical.makeSafe();spherical.radius=THREE.MathUtils.clamp(spherical.radius,controls.minDistance,controls.maxDistance);camera.position.setFromSpherical(spherical);}controls.update();container.dataset.camera=camera.position.toArray().map(value=>value.toFixed(3)).join(',');render();};container.dataset.camera=initial.toArray().map(value=>value.toFixed(3)).join(',');render();
  return()=>{disposed=true;cameraAction.current=null;highlight.current=null;if(frame!==null)cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('change',render);controls.dispose();renderer.domElement.removeEventListener('pointerdown',start);renderer.domElement.removeEventListener('pointerup',select);renderer.domElement.removeEventListener('webglcontextlost',lost);geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[coverage]);
 useEffect(()=>{if(command)cameraAction.current?.(command.action);},[command]);
 return <div ref={host} className="h-[22rem] w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 sm:h-[28rem]" data-testid="signal-globe-webgl" role="img" aria-label="Interactive geographic globe of explicit source coverage. Use camera controls or the country list."/>;
}
