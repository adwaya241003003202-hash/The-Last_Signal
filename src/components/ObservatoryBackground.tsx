import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ObservatoryBackgroundProps {
  isAnomaly?: boolean;
  isIsolated?: boolean;
  isResonanceLock?: boolean;
  isTriangulation?: boolean;
  isEarthOrigin?: boolean;
  isComplete?: boolean;
  signalStrength?: number; // 0 to 1
}

export const ObservatoryBackground: React.FC<ObservatoryBackgroundProps> = ({
  isAnomaly = false,
  isIsolated = false,
  isResonanceLock = false,
  isTriangulation = false,
  isEarthOrigin = false,
  isComplete = false,
  signalStrength = 0,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // High performance WebGL setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050607, 0.0035);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1200
    );
    camera.position.set(0, 4, 40);
    camera.lookAt(0, 2, 0);

    // 1. Deep Space Multi-Layer Starfield (2400 stars with varied depth & magnitude)
    const starCount = 2400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const cWhite = new THREE.Color(0xd8deda);
    const cDim = new THREE.Color(0x3b4441);
    const cSignal = new THREE.Color(0xd7ff63);
    const cNebula = new THREE.Color(0x8faf8f);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const rad = 70 + Math.random() * 220;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = rad * Math.cos(phi);

      const r = Math.random();
      const col = r > 0.94 ? cSignal : r > 0.85 ? cNebula : r > 0.4 ? cWhite : cDim;
      starColors[i3] = col.r;
      starColors[i3 + 1] = col.g;
      starColors[i3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    // 2. Distant Galactic Core / Nebula Cloud Geometry
    const nebulaCount = 600;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPos = new Float32Array(nebulaCount * 3);
    for (let n = 0; n < nebulaCount; n++) {
      const n3 = n * 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 60;
      nebulaPos[n3] = Math.cos(angle) * dist + 40;
      nebulaPos[n3 + 1] = (Math.random() - 0.5) * 45;
      nebulaPos[n3 + 2] = Math.sin(angle) * dist - 80;
    }
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    const nebulaMat = new THREE.PointsMaterial({
      size: 3.5,
      color: 0x1e2729,
      transparent: true,
      opacity: 0.35,
    });
    const nebulaPoints = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebulaPoints);

    // 3. Massive Astronomical Observatory Telescope Assembly
    const dishGroup = new THREE.Group();
    dishGroup.position.set(0, -6.5, 0);

    // Outer Structural Truss Ring
    const outerRingGeo = new THREE.RingGeometry(15, 15.2, 72);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x1e2729,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2.3;
    dishGroup.add(outerRing);

    // Concentric Calibration Rings
    [3.5, 7.5, 11.5].forEach((radius) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.08, 54);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x151b1c,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.3;
      dishGroup.add(ring);
    });

    // Parabolic Lattice Radial Spokes (32 spokes with parabolic curve)
    const spokeCount = 32;
    const spokeMat = new THREE.LineBasicMaterial({
      color: 0x151b1c,
      transparent: true,
      opacity: 0.65,
    });

    for (let s = 0; s < spokeCount; s++) {
      const angle = (s / spokeCount) * Math.PI * 2;
      const points = [];
      for (let r = 0; r <= 15; r += 1.8) {
        const depth = Math.pow(r / 15, 2) * -3.8;
        points.push(new THREE.Vector3(Math.cos(angle) * r, depth, Math.sin(angle) * r));
      }
      const spokeGeo = new THREE.BufferGeometry().setFromPoints(points);
      const spokeLine = new THREE.Line(spokeGeo, spokeMat);
      dishGroup.add(spokeLine);
    }

    // Secondary Sub-Reflector Tripod Mast Struts
    for (let leg = 0; leg < 3; leg++) {
      const legAngle = (leg / 3) * Math.PI * 2 + Math.PI / 6;
      const startX = Math.cos(legAngle) * 13;
      const startZ = Math.sin(legAngle) * 13;
      const points = [
        new THREE.Vector3(startX, -0.8, startZ),
        new THREE.Vector3(0, 10.5, 0),
      ];
      const legGeo = new THREE.BufferGeometry().setFromPoints(points);
      const legLine = new THREE.Line(
        legGeo,
        new THREE.LineBasicMaterial({ color: 0x242e30, transparent: true, opacity: 0.8 })
      );
      dishGroup.add(legLine);
    }

    // Focal Receiver Node (Cryogenic LNA package)
    const focalGeo = new THREE.OctahedronGeometry(0.65, 1);
    const focalMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff63,
      wireframe: true,
    });
    const focalNode = new THREE.Mesh(focalGeo, focalMat);
    focalNode.position.set(0, 10.5, 0);
    dishGroup.add(focalNode);

    // Electromagnetic disturbance ring around receiver
    const emRingGeo = new THREE.RingGeometry(1.2, 1.35, 32);
    const emRingMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff63,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const emRing = new THREE.Mesh(emRingGeo, emRingMat);
    emRing.position.set(0, 10.5, 0);
    emRing.rotation.x = Math.PI / 2;
    dishGroup.add(emRing);

    // Subspace Transmission Beam
    const beamGeo = new THREE.CylinderGeometry(0.06, 2.2, 70, 20, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff63,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const transmissionBeam = new THREE.Mesh(beamGeo, beamMat);
    transmissionBeam.position.set(0, 45, 0);
    dishGroup.add(transmissionBeam);

    // Traveling Signal Photons / Beam Particles
    const photonCount = 180;
    const photonGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonCount * 3);
    const photonVelocities: number[] = [];

    for (let p = 0; p < photonCount; p++) {
      const p3 = p * 3;
      photonPos[p3] = (Math.random() - 0.5) * 0.8;
      photonPos[p3 + 1] = 10.5 + Math.random() * 55;
      photonPos[p3 + 2] = (Math.random() - 0.5) * 0.8;
      photonVelocities.push(0.3 + Math.random() * 0.6);
    }
    photonGeo.setAttribute('position', new THREE.BufferAttribute(photonPos, 3));
    const photonMat = new THREE.PointsMaterial({
      size: 1.4,
      color: 0xd7ff63,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const photonStream = new THREE.Points(photonGeo, photonMat);
    dishGroup.add(photonStream);

    // Orbiting Dust Field around Station
    const dustCount = 420;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let d = 0; d < dustCount; d++) {
      const d3 = d * 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 10;
      dustPos[d3] = Math.cos(angle) * dist;
      dustPos[d3 + 1] = (Math.random() - 0.5) * 3;
      dustPos[d3 + 2] = Math.sin(angle) * dist;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.9,
      color: 0x8faf8f,
      transparent: true,
      opacity: 0.4,
    });
    const dustCloud = new THREE.Points(dustGeo, dustMat);
    dishGroup.add(dustCloud);

    scene.add(dishGroup);

    // Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax
      targetX += (mouseX * 4 - targetX) * 0.04;
      targetY += (-mouseY * 2 - targetY) * 0.04;
      camera.position.x = targetX;
      camera.position.y = 4 + targetY;
      camera.lookAt(0, 2, 0);

      // Camera micro-shake during resonance lock
      if (isResonanceLock) {
        camera.position.x += (Math.random() - 0.5) * 0.45;
        camera.position.y += (Math.random() - 0.5) * 0.45;
      }

      // Slow deep-space telescope rotation
      // When locked or isolated, the dish locks bearing
      const rotationSpeed = isResonanceLock 
        ? 0.002 
        : isIsolated 
          ? 0.008 
          : 0.035;
      dishGroup.rotation.y = elapsed * rotationSpeed;
      starfield.rotation.y = elapsed * 0.004;

      // Reverse transmission beam towards user/Earth if Earth twist active!
      if (isEarthOrigin || isComplete) {
        // Point beam slightly towards viewer/Earth direction
        transmissionBeam.rotation.x = Math.sin(elapsed * 0.2) * 0.08 + 0.35;
      } else {
        transmissionBeam.rotation.x = 0;
      }

      // Focal pulse
      const pulseSpeed = isResonanceLock ? 16.0 : isAnomaly ? 8.0 : isIsolated ? 4.0 : 2.0;
      const pulseScale = 1.0 + Math.sin(elapsed * pulseSpeed) * 0.25;
      focalNode.scale.set(pulseScale, pulseScale, pulseScale);

      // EM ring rotation
      emRing.rotation.z = elapsed * 1.5;
      emRing.scale.set(1.0 + Math.sin(elapsed * 3) * 0.15, 1.0 + Math.sin(elapsed * 3) * 0.15, 1.0);

      // Beam particles stream up (or down toward Earth in origin reveal)
      const positions = photonGeo.attributes.position.array as Float32Array;
      const direction = (isEarthOrigin || isComplete) ? -1 : 1;
      for (let p = 0; p < photonCount; p++) {
        const p3 = p * 3;
        positions[p3 + 1] += photonVelocities[p] * direction;
        if (positions[p3 + 1] > 65) {
          positions[p3 + 1] = 10.5;
        } else if (positions[p3 + 1] < 10.5) {
          positions[p3 + 1] = 65;
        }
      }
      photonGeo.attributes.position.needsUpdate = true;

      // Beam opacity responds to locked signal strength
      const targetBeamOpacity = isComplete 
        ? 0.38 
        : isResonanceLock 
          ? 0.65 
          : isAnomaly 
            ? 0.32 + Math.sin(elapsed * 12) * 0.15 
            : 0.04 + signalStrength * 0.26;
      beamMat.opacity += (targetBeamOpacity - beamMat.opacity) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      nebulaGeo.dispose();
      nebulaMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      focalGeo.dispose();
      focalMat.dispose();
      emRingGeo.dispose();
      emRingMat.dispose();
      beamGeo.dispose();
      beamMat.dispose();
      photonGeo.dispose();
      photonMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
    };
  }, [isAnomaly, isIsolated, isResonanceLock, isTriangulation, isEarthOrigin, isComplete, signalStrength]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: isComplete ? 0.95 : 0.85 }}
    />
  );
};
