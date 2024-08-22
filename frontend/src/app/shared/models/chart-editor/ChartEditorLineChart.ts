import { DataSource } from '../data-sources';

export interface ChartEditorLineChartDataItem {
  x: string;
  y: number;
}

export interface SelectionOverlayData {
  startIndex: number;
  selectionRect: {
    w: number;
    startX: number;
    startY: number;
  };
  drag: boolean;
}

export interface InputChartEditorChartData {
  dataSource: DataSource;
  features: string[];
  dataset: string;
  modelId?: string;
  queryErrors?: boolean;
  start: string | null;
  stop: string | null;
  keepAnomalies?: boolean;
  requestAnomalies?: boolean;
}
