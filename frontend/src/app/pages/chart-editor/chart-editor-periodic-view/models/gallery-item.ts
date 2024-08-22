import { ChartEditorLineChartDataItem } from '@shared/models';

export enum GalleryItemStatus {
  Defect = 'Defect',
  NoDefect = 'No Defect',
}

export interface GalleryItem {
  name: string;
  status: GalleryItemStatusObject | null;
  chartData: ChartEditorLineChartDataItem[];
}

export interface GalleryItemStatusObject {
  key: string;
  displayName: string;
  value: GalleryItemStatus;
}
