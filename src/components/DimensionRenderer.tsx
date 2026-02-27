import { observer } from "mobx-react-lite";
import * as THREE from "three";
import { Wall } from "../store/Wall";
import { Container, Text } from "@react-three/uikit";
import {
  LineSegments2,
  LineSegmentsGeometry,
  LineMaterial,
} from "three-stdlib";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import { appStore } from "../store/AppStore";
import { formatDimension } from "../utils/dimensionUtils";
// import { Line } from "@react-three/drei";

export const DIMENSION_LINE_MATERIAL = new LineMaterial({
  color: 0x3b82f6,
  linewidth: 0.03,
  worldUnits: true,
  dashed: false,
  depthTest: true,
  depthWrite: false,
});
let dimMaterialWidth = -1;
let dimMaterialHeight = -1;

const syncDimensionLineMaterialResolution = (width: number, height: number) => {
  if (width === dimMaterialWidth && height === dimMaterialHeight) return;
  DIMENSION_LINE_MATERIAL.resolution.set(width, height);
  dimMaterialWidth = width;
  dimMaterialHeight = height;
};

interface DimensionRendererProps {
  wall: Wall;
}

const TICK_SIZE = 0.2;
const LABEL_BASE_ZOOM = 50;
const LABEL_BASE_SCALE = 1.5;
const LABEL_SCALE_POWER = 1;
const LABEL_MIN_SCALE = 0.75;
const LABEL_MAX_SCALE = 3;

const getReadableParallelAngle = (baseAngle: number) => {
  let angle = Math.atan2(Math.sin(baseAngle), Math.cos(baseAngle));
  if (angle > Math.PI / 2) angle -= Math.PI;
  if (angle < -Math.PI / 2) angle += Math.PI;
  return angle;
};

const getLabelScaleFromZoom = (zoom: number) => {
  const safeZoom = Math.max(zoom, 0.0001);
  const scale =
    LABEL_BASE_SCALE *
    Math.pow(LABEL_BASE_ZOOM / safeZoom, LABEL_SCALE_POWER);
  return THREE.MathUtils.clamp(scale, LABEL_MIN_SCALE, LABEL_MAX_SCALE);
};

export const DimensionRenderer = observer(
  ({ wall }: DimensionRendererProps) => {
    if (!wall.dimension) return null;

    const { camera, raycaster, mouse, size } = useThree();
    const [isDragging, setIsDragging] = useState(false);

    const start = wall.startPoint;
    const end = wall.endPoint;
    const normal = wall.normal;
    const dimension = wall.dimension;

    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);

    syncDimensionLineMaterialResolution(size.width, size.height);

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
          ? yAxis
          : dimension.lockedAxis === "y"
            ? xAxis
            : normal;

      dimension.setOffset(toMouse.dot(offsetDirection));
    };

    // ---- Compute points ------------------------------------------------------

    let dimStart: THREE.Vector3;
    let dimEnd: THREE.Vector3;
    let dimCenter: THREE.Vector3;
    let extStart: THREE.Vector3;
    let extEnd: THREE.Vector3;

    if (dimension.lockedAxis === "x") {
      const y = wall.center.y + dimension.offset;
      dimStart = new THREE.Vector3(start.x, y, 0);
      dimEnd = new THREE.Vector3(end.x, y, 0);
      dimCenter = new THREE.Vector3((start.x + end.x) / 2, y, 0);
      const tick = yAxis
        .clone()
        .multiplyScalar(TICK_SIZE * Math.sign(dimension.offset || 1));
      extStart = dimStart.clone().add(tick);
      extEnd = dimEnd.clone().add(tick);
    } else if (dimension.lockedAxis === "y") {
      const x = wall.center.x + dimension.offset;
      dimStart = new THREE.Vector3(x, start.y, 0);
      dimEnd = new THREE.Vector3(x, end.y, 0);
      dimCenter = new THREE.Vector3(x, (start.y + end.y) / 2, 0);
      const tick = xAxis
        .clone()
        .multiplyScalar(TICK_SIZE * Math.sign(dimension.offset || 1));
      extStart = dimStart.clone().add(tick);
      extEnd = dimEnd.clone().add(tick);
    } else {
      const offset = normal.clone().multiplyScalar(dimension.offset);
      dimStart = start.clone().add(offset);
      dimEnd = end.clone().add(offset);
      dimCenter = wall.center.clone().add(offset);
      const tick = normal
        .clone()
        .multiplyScalar(TICK_SIZE * Math.sign(dimension.offset || 1));
      extStart = dimStart.clone().add(tick);
      extEnd = dimEnd.clone().add(tick);
    }

    // ---- LineSegments geometry -----------------------------------------------

    const geometry = useMemo(() => new LineSegmentsGeometry(), []);
    const lineObject = useMemo(
      () => new LineSegments2(geometry, DIMENSION_LINE_MATERIAL),
      [geometry],
    );

    // useEffect(() => {
    //   lineObject.frustumCulled = false;
    // }, [lineObject]);

    useEffect(() => {
      geometry.setPositions([
        dimStart.x,
        dimStart.y,
        0,
        dimEnd.x,
        dimEnd.y,
        0,
        start.x,
        start.y,
        0,
        extStart.x,
        extStart.y,
        0,
        end.x,
        end.y,
        0,
        extEnd.x,
        extEnd.y,
        0,
      ]);
      lineObject.computeLineDistances();
    }, [geometry, lineObject, dimStart, dimEnd, start, end, extStart, extEnd]);

    useEffect(() => {
      return () => {
        geometry.dispose();
      };
    }, [geometry]);

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
          : getReadableParallelAngle(
              Math.atan2(wall.direction.y, wall.direction.x),
            );
    const labelScale = getLabelScaleFromZoom(appStore.cameraZoom);

    return (
      <group
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
      >
        <primitive object={lineObject} />
        {/* <Line
          points={[dimStart, dimEnd, start, extStart, end, extEnd]}
          segments={true}
          color={"#3b82f6"}
          lineWidth={1.5}
        /> */}

        <group position={dimCenter} rotation={[0, 0, angle]} scale={labelScale}>
          <Container
            backgroundColor="#ffffff"
            borderRadius={6}
            paddingX={4} // matches "4px"
            paddingY={2} // matches "2px"
            alignItems="center"
            justifyContent="center"
            pointerEvents="auto"
            borderWidth={1}
            borderColor="#e2e8f0"
            transformTranslateY={-1} // subtle lift like DOM box-shadow
            onClick={(e: any) => {
              e.stopPropagation();
              if (e.detail === 2) {
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
  },
);
