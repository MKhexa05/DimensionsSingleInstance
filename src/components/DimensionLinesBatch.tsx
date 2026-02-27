import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
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

// let dimMaterialWidth = -1;
// let dimMaterialHeight = -1;

// const syncDimensionLineMaterialResolution = (width: number, height: number) => {
//   if (width === dimMaterialWidth && height === dimMaterialHeight) return;
//   DIMENSION_LINE_MATERIAL.resolution.set(width, height);
//   dimMaterialWidth = width;
//   dimMaterialHeight = height;
// };

export const DimensionLinesBatch = observer(() => {
  // const { size } = useThree();
  // syncDimensionLineMaterialResolution(size.width, size.height);

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
    lineObject.computeLineDistances();
  }, [geometry, lineObject, dimensionLinepointPositions]);

  // just a safe measure but geomtry never gets instatiated again
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return <primitive object={lineObject} />;
});
