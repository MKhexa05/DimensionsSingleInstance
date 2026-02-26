import { useFrame } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import * as THREE from "three";
import { Wall } from "../store/Wall";

interface WallMeshProps {
  wall: Wall;
  isSelected?: boolean;
  isPreview?: boolean;
  onPointerDown?: (e: any) => void;
}

export const WallMesh = observer(
  ({ wall, isSelected, isPreview, onPointerDown }: WallMeshProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
      const group = groupRef.current;
      const mesh = meshRef.current;
      if (!group || !mesh) return;
      const length = Math.max(wall.length, 0.001);
      group.position.copy(wall.center);
      group.rotation.set(0, 0, wall.angle);
      mesh.scale.set(length, wall.thickness, 0.1);
    });

    return (
      <group
        ref={groupRef}
        onPointerDown={onPointerDown}
      >
        <mesh ref={meshRef}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={isPreview ? "#f97316" : isSelected ? "#3b82f6" : "#000000"}
            roughness={0.1}
            transparent={!!isPreview}
            opacity={isPreview ? 0.7 : 1}
          />
        </mesh>
      </group>
    );
  },
);
