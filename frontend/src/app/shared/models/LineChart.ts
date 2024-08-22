export interface SelectionRect {
  w: number;
  h: number;
  startX: number;
  startY: number;
  startTime: string;
  stopTime: string;

  color?: string;
}

export interface XYChartData<X = string, Y = number> {
  x: X;
  y: Y;
}

export const CHART_COLORS = [
  '#F25457',
  '#39B5FB',
  '#556FFA',
];