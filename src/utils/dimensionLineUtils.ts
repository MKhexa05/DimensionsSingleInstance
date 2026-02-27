import * as THREE from "three";
import type { LockedAxis } from "../store/Dimension";
import type { Wall } from "../store/Wall";

const TICK_SIZE = 0.2;

export interface DimensionLineResult {
  dimStart: THREE.Vector3;
  dimEnd: THREE.Vector3;
  dimCenter: THREE.Vector3;
  extStart: THREE.Vector3;
  extEnd: THREE.Vector3;
  positions: number[];
}

export const computeDimensionLinePoints = (
  wall: Wall,
  offset: number,
  lockedAxis: LockedAxis,
): DimensionLineResult => {
  const start = wall.startPoint;
  const end = wall.endPoint;
  const normal = wall.normal;
  const xAxis = new THREE.Vector3(1, 0, 0);
  const yAxis = new THREE.Vector3(0, 1, 0);

  let dimStart: THREE.Vector3;
  let dimEnd: THREE.Vector3;
  let dimCenter: THREE.Vector3;
  let extStart: THREE.Vector3;
  let extEnd: THREE.Vector3;

  if (lockedAxis === "x") {
    const y = wall.center.y + offset;
    dimStart = new THREE.Vector3(start.x, y, 0);
    dimEnd = new THREE.Vector3(end.x, y, 0);
    dimCenter = new THREE.Vector3((start.x + end.x) / 2, y, 0);
    const tick = yAxis.clone().multiplyScalar(TICK_SIZE * Math.sign(offset || 1));
    extStart = dimStart.clone().add(tick);
    extEnd = dimEnd.clone().add(tick);
  } else if (lockedAxis === "y") {
    const x = wall.center.x + offset;
    dimStart = new THREE.Vector3(x, start.y, 0);
    dimEnd = new THREE.Vector3(x, end.y, 0);
    dimCenter = new THREE.Vector3(x, (start.y + end.y) / 2, 0);
    const tick = xAxis.clone().multiplyScalar(TICK_SIZE * Math.sign(offset || 1));
    extStart = dimStart.clone().add(tick);
    extEnd = dimEnd.clone().add(tick);
  } else {
    const wallOffset = normal.clone().multiplyScalar(offset);
    dimStart = start.clone().add(wallOffset);
    dimEnd = end.clone().add(wallOffset);
    dimCenter = wall.center.clone().add(wallOffset);
    const tick = normal
      .clone()
      .multiplyScalar(TICK_SIZE * Math.sign(offset || 1));
    extStart = dimStart.clone().add(tick);
    extEnd = dimEnd.clone().add(tick);
  }

  return {
    dimStart,
    dimEnd,
    dimCenter,
    extStart,
    extEnd,
    positions: [
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
    ],
  };
};
