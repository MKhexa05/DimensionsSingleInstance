import { makeAutoObservable } from 'mobx';
import { Wall } from './Wall';
import type { LockedAxis } from './Dimension';

export type ActiveTool = 'select' | 'wall' | 'dimension';

class AppStore {
  walls: Wall[] = [];
  activeTool: ActiveTool = 'select';
  selectedWallId: string | null = null;
  drawingWall: Wall | null = null;
  isLengthModalOpen = false;
  lengthModalAxis: LockedAxis = 'none';

  constructor() {
    makeAutoObservable(this);
  }

  setActiveTool(tool: ActiveTool) {
    this.activeTool = tool;
    if (tool !== 'select') {
      this.selectedWallId = null;
    }
    if (tool === 'wall') {
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

  openLengthModal(wallId: string, axis: LockedAxis = 'none') {
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
