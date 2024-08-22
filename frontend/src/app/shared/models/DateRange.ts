export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface ZoomArea {
  min: number | null;
  max?: number | null;
}
