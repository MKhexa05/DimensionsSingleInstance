import { makeAutoObservable } from "mobx";
import * as THREE from "three";
import { Wall } from "./Wall";
import { Dimension } from "./Dimension";
import type { LockedAxis } from "./Dimension";

export type ActiveTool = "select" | "wall" | "dimension";

class AppStore {
  walls: Wall[] = [];
  activeTool: ActiveTool = "select";
  selectedWallId: string | null = null;
  drawingWall: Wall | null = null;
  isLengthModalOpen = false;
  lengthModalAxis: LockedAxis = "none";

  constructor() {
    makeAutoObservable(this);
    this.walls = this.createSeedWalls(50);
  }

  private createSeedWalls(count: number): Wall[] {
    const walls: Wall[] = [];

    for (let i = 0; i < count; i += 1) {
      const centerX = (Math.random() - 0.5) * 30;
      const centerY = (Math.random() - 0.5) * 20;
      const length = 0.6 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      const halfDx = Math.cos(angle) * (length * 0.5);
      const halfDy = Math.sin(angle) * (length * 0.5);
      const start = new THREE.Vector3(centerX - halfDx, centerY - halfDy, 0);
      const end = new THREE.Vector3(centerX + halfDx, centerY + halfDy, 0);
      const wall = new Wall(start, end);
      const dim = new Dimension();
      const offsetMag = 0.25 + Math.random() * 0.75;
      dim.offset = (Math.random() < 0.5 ? -1 : 1) * offsetMag;
      wall.setDimension(dim);
      walls.push(wall);
    }

    return walls;
  }

  setActiveTool(tool: ActiveTool) {
    this.activeTool = tool;
    if (tool !== "select") {
      this.selectedWallId = null;
    }
    if (tool === "wall") {
      this.closeLengthModal();
    }
  }

  addWall(wall: Wall) {
    this.walls.push(wall);
  }

  setSelectedWallId(id: string | null) {
    this.selectedWallId = id;
  }

  setDrawingWall(wall: Wall | null) {
    this.drawingWall = wall;
  }

  openLengthModal(wallId: string, axis: LockedAxis = "none") {
    this.selectedWallId = wallId;
    this.lengthModalAxis = axis;
    this.isLengthModalOpen = true;
  }

  closeLengthModal() {
    this.isLengthModalOpen = false;
  }

  get selectedWall(): Wall | undefined {
    return this.walls.find((w) => w.id === this.selectedWallId);
  }

  deleteWall(id: string) {
    this.walls = this.walls.filter((w) => w.id !== id);
    if (this.selectedWallId === id) {
      this.selectedWallId = null;
      this.closeLengthModal();
    }
  }
}

export const appStore = new AppStore();
