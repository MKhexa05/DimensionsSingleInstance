import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  LineMaterial,
  LineSegments2,
  LineSegmentsGeometry,
} from "three-stdlib";
import { appStore } from "../store/AppStore";

const DIMENSION_LINE_MATERIAL = new LineMaterial({
  color: 0x3b82f6,
  linewidth: 0.05,
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

export const DimensionLinesBatch = observer(() => {
  const { size } = useThree();
  syncDimensionLineMaterialResolution(size.width, size.height);

  const dimensionLinepointPositions = appStore.walls.flatMap(
    (wall) => wall.dimension?.points ?? [],
  );

  const geometry = useMemo(() => new LineSegmentsGeometry(), []);
  const lineObject = useMemo(
    () => new LineSegments2(geometry, DIMENSION_LINE_MATERIAL),
    [geometry],
  );

  useEffect(() => {
    geometry.setPositions(dimensionLinepointPositions);

    // Root cause fix:
    // three.js caches `_maxInstanceCount` from first bind, so after first 200 walls
    // the renderer kept drawing only that many instances. Invalidate and reset count
    // when batched positions grow/shrink.
    const instanceCount = Math.floor(dimensionLinepointPositions.length / 6);
    geometry.instanceCount = instanceCount;
    delete (geometry as LineSegmentsGeometry & { _maxInstanceCount?: number })
      ._maxInstanceCount;

    lineObject.computeLineDistances();
  }, [geometry, lineObject, dimensionLinepointPositions]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return <primitive object={lineObject} />;
});
