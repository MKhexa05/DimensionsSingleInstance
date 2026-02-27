import { observer } from "mobx-react-lite";
import * as THREE from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { Container, Text } from "@react-three/uikit";
import { appStore } from "../store/AppStore";
import { Wall } from "../store/Wall";
import { formatDimension } from "../utils/dimensionUtils";
import { computeDimensionLinePoints } from "../utils/dimensionLineUtils";

interface DimensionRendererProps {
  wall: Wall;
}

const LABEL_BASE_ZOOM = 50;
const LABEL_BASE_SCALE = 1.5;
const LABEL_SCALE_POWER = 1;
const LABEL_MIN_SCALE = 0.75;
const LABEL_MAX_SCALE = 3;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

const getReadableParallelAngle = (baseAngle: number) => {
  let angle = Math.atan2(Math.sin(baseAngle), Math.cos(baseAngle));
  if (angle > Math.PI / 2) angle -= Math.PI;
  if (angle < -Math.PI / 2) angle += Math.PI;
  return angle;
};

const getLabelScaleFromZoom = (zoom: number) => {
  const safeZoom = Math.max(zoom, 0.0001);
  const scale =
    LABEL_BASE_SCALE * Math.pow(LABEL_BASE_ZOOM / safeZoom, LABEL_SCALE_POWER);
  return THREE.MathUtils.clamp(scale, LABEL_MIN_SCALE, LABEL_MAX_SCALE);
};

export const DimensionRenderer = observer(({ wall }: DimensionRendererProps) => {
  if (!wall.dimension) return null;

  const { camera, raycaster, mouse } = useThree();
  const [isDragging, setIsDragging] = useState(false);

  const start = wall.startPoint;
  const end = wall.endPoint;
  const normal = wall.normal;
  const dimension = wall.dimension;

  const getMouseWorldPoint = useCallback(() => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const target = new THREE.Vector3();
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, target);
    return target;
  }, [camera, mouse, raycaster]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (appStore.activeTool === "wall") return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();

    const mousePoint = getMouseWorldPoint();
    const wallCenter = wall.center;
    const toMouse = new THREE.Vector3().subVectors(mousePoint, wallCenter);

    const offsetDirection =
      dimension.lockedAxis === "x"
        ? Y_AXIS
        : dimension.lockedAxis === "y"
          ? X_AXIS
          : normal;

    dimension.setOffset(toMouse.dot(offsetDirection));
  };

  const { dimCenter, positions } = computeDimensionLinePoints(
    wall,
    dimension.offset,
    dimension.lockedAxis,
  );

  useEffect(() => {
    dimension.setPoints(positions);
  }, [dimension, positions]);

  const lengthValue =
    dimension.lockedAxis === "x"
      ? Math.abs(end.x - start.x)
      : dimension.lockedAxis === "y"
        ? Math.abs(end.y - start.y)
        : wall.length;

  const angle =
    dimension.lockedAxis === "x"
      ? 0
      : dimension.lockedAxis === "y"
        ? Math.PI / 2
        : getReadableParallelAngle(Math.atan2(wall.direction.y, wall.direction.x));
  const labelScale = getLabelScaleFromZoom(appStore.cameraZoom);

  return (
    <group
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      <group position={dimCenter} rotation={[0, 0, angle]} scale={labelScale}>
        <Container
          backgroundColor="#ffffff"
          borderRadius={6}
          paddingX={4}
          paddingY={2}
          alignItems="center"
          justifyContent="center"
          pointerEvents="auto"
          borderWidth={1}
          borderColor="#e2e8f0"
          transformTranslateY={-1}
          onClick={(e) => {
            const clickEvent = e as {
              stopPropagation?: () => void;
              detail?: number;
            };
            clickEvent.stopPropagation?.();
            if (clickEvent.detail === 2) {
              appStore.openLengthModal(wall.id, dimension.lockedAxis);
            }
          }}
        >
          <Text fontSize={18} color="#1e293b" fontWeight="bold">
            {formatDimension(lengthValue, true)}
          </Text>
        </Container>
      </group>
    </group>
  );
});
