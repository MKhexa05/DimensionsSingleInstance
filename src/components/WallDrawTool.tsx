import { useCallback, useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import * as THREE from "three";
import { appStore } from "../store/AppStore";
import { Wall } from "../store/Wall";

export const WallDrawTool = observer(() => {
  const { camera, gl } = useThree();
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const ndcPoint = useMemo(() => new THREE.Vector3(), []);

  const resetDrawing = useCallback(() => {
    setStartPoint(null);
    appStore.setDrawingWall(null);
  }, []);

  const getWorldPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      ndcPoint.set(x, y, 0).unproject(camera);
      ndcPoint.z = 0;
      return ndcPoint.clone();
    },
    [camera, gl, ndcPoint],
  );

  useEffect(() => {
    if (
      appStore.activeTool !== "wall" &&
      (startPoint || appStore.drawingWall)
    ) {
      resetDrawing();
    }
  }, [resetDrawing, startPoint, appStore.activeTool, appStore.drawingWall]);

  useEffect(() => {
    const element = gl.domElement;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && startPoint) {
        e.preventDefault();
        resetDrawing();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (appStore.activeTool !== "wall") return;
      const point = getWorldPoint(e.clientX, e.clientY);
      if (!point) return;

      if (!startPoint) {
        setStartPoint(point.clone());
        appStore.setDrawingWall(new Wall(point.clone(), point.clone()));
        return;
      }

      if (point.distanceTo(startPoint) < 1e-4) return;
      appStore.addWall(new Wall(startPoint.clone(), point.clone()));
      resetDrawing();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (
        appStore.activeTool !== "wall" ||
        !startPoint ||
        !appStore.drawingWall
      )
        return;
      const point = getWorldPoint(e.clientX, e.clientY);
      if (!point) return;
      appStore.drawingWall.setEndPoint(point);
    };

    element.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeydown);
    element.addEventListener("pointermove", handlePointerMove);
    return () => {
      element.removeEventListener("click", handleClick);
      window.addEventListener("keydown", handleKeydown);
      element.removeEventListener("pointermove", handlePointerMove);
    };
  }, [getWorldPoint, gl, resetDrawing, startPoint]);

  return null;
});
