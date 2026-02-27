import { makeAutoObservable } from 'mobx';

export type LockedAxis = 'none' | 'x' | 'y';

export class Dimension {
  offset: number = 0.5;
  lockedAxis: LockedAxis = 'none';
  points: number[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setOffset(offset: number) {
    this.offset = offset;
  }

  setLockedAxis(axis: LockedAxis) {
    this.lockedAxis = axis;
  }

  setPoints(points: number[]) {
    // if same points passed to set return/ no need to update the same points
    if (
      this.points.length === points.length &&
      this.points.every((value, index) => value === points[index])
    ) {
      return;
    }
    this.points = points;
  }
}
