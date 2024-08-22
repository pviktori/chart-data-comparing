import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { OkSequence, SelectionOverlayData, SelectionRect } from '@shared/models';
import { Chart, ChartDataset, ScaleOptionsByType } from 'chart.js';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
})
export class LineChartComponent implements OnInit {
  @Input() set inputData(value: ChartDataset<any>[]) {
    this.inputData$.next(value);
  }

  @Input() set scales(value: { [key: string]: ScaleOptionsByType<any> }) {
    this.scales$.next(value);
  }

  @Input() set timestamps(value: OkSequence[]) {
    this.timastamps = value;
    this._addTimestampsToTimeFrames();
  }

  @Input() stealthMode: boolean = false;
  @Input() chartHtmlWrapper?: HTMLElement;

  @Output() zoomHandler = new EventEmitter();
  @Output() addTimestamp = new EventEmitter();
  @Output() chartReady = new EventEmitter<boolean>();

  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLCanvasElement>;
  @ViewChild('selectedOverlay') selectedOverlay!: ElementRef<HTMLCanvasElement>;
  @ViewChild('selectedAreasOverlay')
  selectedAreasOverlay!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;
  selectedTimeFrames: SelectionRect[] = [];
  selectionOverlayData: SelectionOverlayData = {} as SelectionOverlayData;
  timeout: any = null;
  selectionOverlayActivated = false;
  resizingActivated = false;
  resizingActivatedTimeout: any = null;

  destroyed$ = new Subject<void>();
  inputData$: Subject<ChartDataset<any>[]> = new Subject();
  scales$: Subject<{ [key: string]: ScaleOptionsByType<any> }> = new Subject();
  timastamps: OkSequence[] = [];

  constructor() {
    combineLatest([this.inputData$, this.scales$])
      .pipe(takeUntil(this.destroyed$), debounceTime(500), distinctUntilChanged())
      .subscribe(([chartData, scales]) => {
        this.updateChart(chartData, scales);
        this._addTimestampsToTimeFrames();
        if (this.chart) this.chartReady.emit();
      });
  }

  ngOnInit(): void {
    // show loading layout to beautify re-draw of canvas
    window.addEventListener('resize', this._resizeWindowHandler);
  }

  resetChart() {
    this.chart?.destroy();
    this.removeSelectedAreas();
  }

  updateChart(inputData: any[], scales: any) {
    if (!this.chart || !this.chart.canvas) {
      this.createChart(inputData, scales);
      return;
    }

    // Chart.js configuration doesn't allow to use custom data point type
    // eslint-disable-next-line
    this.chart.data.datasets = inputData as any[];
    this.chart.options.scales = scales;
    this.chart.update();
  }

  createChart(inputData: any[], scales: any) {
    if (!inputData.length) return;
    this.chart = new Chart(this.chartContainer.nativeElement, {
      data: {
        // Chart.js configuration doesn't allow to use custom data point type
        // eslint-disable-next-line
        datasets: inputData as any[],
      },
      options: {
        responsive: true,
        animation: false,
        maintainAspectRatio: false,
        scales,
        onResize: () => {
          // clear timeout if resize fires too often
          if (this.timeout) clearTimeout(this.timeout);

          // wait 100ms to prevent unnecessary resetings of canvas overlays
          this.timeout = setTimeout(() => {
            // resize canvas overlays html elements
            this._setAdditionalCanvasesSize();
            if (this.selectionOverlayActivated) {
              this.removeSelectionOverlay();
              this.addSelectionOverlay();
            }

            // re-draw timeframes due to canvas clean-up after resize
            this._addTimestampsToTimeFrames();

            this.timeout = null;
          }, 100);
        },
        plugins: {
          zoom: {
            zoom: {
              mode: 'x',
              onZoomComplete: chart => {
                const zoomxMin = Math.floor(chart.chart.scales['x2'].min);
                const zoomxMax = Math.floor(chart.chart.scales['x2'].max);

                this.zoomHandler.emit({ max: zoomxMax, min: zoomxMin });
              },
              drag: {
                enabled: true,
              },
              wheel: {
                enabled: false,
              },
            },
          },
          legend: {
            display: false,
          },
        },
      },
    });
  }

  removeSelectedAreas() {
    const selectedContext = this.selectedAreasOverlay.nativeElement.getContext('2d');
    if (!selectedContext) return;

    selectedContext.clearRect(
      0,
      0,
      this.selectedAreasOverlay.nativeElement.width,
      this.selectedAreasOverlay.nativeElement.height,
    );
  }

  drawSelectedAreas() {
    const selectedContext = this.selectedAreasOverlay?.nativeElement?.getContext('2d');
    if (!selectedContext) return;

    selectedContext.globalAlpha = 0.5;
    this.removeSelectedAreas();
    this.selectedTimeFrames.forEach(rect => {
      selectedContext.fillStyle = rect.color || '#000000';

      selectedContext.fillRect(
        rect.startX as number,
        rect.startY as number,
        rect.w as number,
        rect.h as number,
      );
    });
  }

  addSelectionOverlay() {
    if (this.selectionOverlayActivated) return;
    this.selectionOverlayActivated = true;
    // deactivate zoom
    if (this.chart.options.plugins?.zoom?.zoom?.drag)
      this.chart.options.plugins.zoom.zoom.drag.enabled = false;
    this.chart.update();
    this.selectionOverlayData.startIndex = 0;
    this.selectionOverlayData.selectionRect = {
      w: 0,
      startX: 0,
      startY: 0,
    };
    this.selectionOverlayData.drag = false;

    (this.chartHtmlWrapper || window).addEventListener(
      'pointerdown',
      this.pointerdownHandler as EventListener,
      true,
    );
    (this.chartHtmlWrapper || window).addEventListener(
      'pointermove',
      this.pointermoveHandler as EventListener,
      true,
    );
    (this.chartHtmlWrapper || window).addEventListener(
      'pointerup',
      this.pointerupHandler as EventListener,
      true,
    );
  }

  pointerdownHandler = (evt: PointerEvent): void => {
    if (!this.chart) return;
    const points = this.chart.getElementsAtEventForMode(
      evt,
      'index',
      {
        intersect: false,
      },
      true,
    );
    this.selectionOverlayData.startIndex = points[0].index;
    const rect = this.chartContainer?.nativeElement?.getBoundingClientRect();
    this.selectionOverlayData.selectionRect.startX = evt.clientX - rect.left;
    this.selectionOverlayData.selectionRect.startY = this.chart.chartArea.top;
    this.selectionOverlayData.drag = true;
  };

  pointermoveHandler = (evt: PointerEvent) => {
    const rect = this.chartContainer?.nativeElement?.getBoundingClientRect();
    const selectedOverlayCtx = this.selectedOverlay.nativeElement.getContext('2d');
    if (this.selectionOverlayData.drag) {
      this.selectionOverlayData.selectionRect.w =
        evt.clientX - rect.left - this.selectionOverlayData.selectionRect.startX;
      if (selectedOverlayCtx) {
        selectedOverlayCtx.globalAlpha = 0.5;
        selectedOverlayCtx?.clearRect(
          0,
          0,
          this.chartContainer?.nativeElement?.width,
          this.chartContainer?.nativeElement?.height,
        );
        selectedOverlayCtx?.fillRect(
          this.selectionOverlayData.selectionRect.startX,
          this.selectionOverlayData.selectionRect.startY,
          this.selectionOverlayData.selectionRect.w,
          this.chart.chartArea.bottom - this.chart.chartArea.top,
        );
      }
    } else {
      selectedOverlayCtx?.clearRect(
        0,
        0,
        this.chartContainer?.nativeElement?.width,
        this.chartContainer?.nativeElement?.height,
      );
      if (evt.offsetX > this.chart.chartArea.left) {
        selectedOverlayCtx?.fillRect(
          evt.offsetX,
          this.chart.chartArea.top,
          1,
          this.chart.chartArea.bottom - this.chart.chartArea.top,
        );
      }
    }
  };

  pointerupHandler = (evt: PointerEvent) => {
    const rect = this.chartContainer?.nativeElement?.getBoundingClientRect();
    this.selectionOverlayData.drag = false;
    const start =
      this.chart.scales['x2'].getValueForPixel(this.selectionOverlayData.selectionRect.startX) || 0;
    const stop = this.chart.scales['x2'].getValueForPixel(evt.clientX - rect.left) || 0;
    const selectionReversed = new Date(start).getTime() > new Date(stop).getTime();

    const newRect: SelectionRect = {
      w: Math.abs(this.selectionOverlayData.selectionRect.w),
      h: this.chart.chartArea.bottom - this.chart.chartArea.top,
      startX: selectionReversed
        ? this.selectionOverlayData.selectionRect.startX -
          Math.abs(this.selectionOverlayData.selectionRect.w)
        : this.selectionOverlayData.selectionRect.startX,
      startY: this.selectionOverlayData.selectionRect.startY,
      startTime: selectionReversed ? new Date(stop).toISOString() : new Date(start).toISOString(),
      stopTime: selectionReversed ? new Date(start).toISOString() : new Date(stop).toISOString(),
    };

    this.addTimestamp.emit(newRect);
  };

  removeSelectionOverlay() {
    (this.chartHtmlWrapper || window).removeEventListener(
      'pointerdown',
      this.pointerdownHandler as EventListener,
      true,
    );
    (this.chartHtmlWrapper || window).removeEventListener(
      'pointermove',
      this.pointermoveHandler as EventListener,
      true,
    );
    (this.chartHtmlWrapper || window).removeEventListener(
      'pointerup',
      this.pointerupHandler as EventListener,
      true,
    );

    this.selectedOverlay.nativeElement
      .getContext('2d')
      ?.clearRect(
        0,
        0,
        this.chartContainer?.nativeElement?.width,
        this.chartContainer?.nativeElement?.height,
      );

    if (this.chart?.options.plugins?.zoom?.zoom?.drag)
      this.chart.options.plugins.zoom.zoom.drag.enabled = true;

    this.chart?.update();
    this.selectionOverlayActivated = false;
  }

  private _addTimestampsToTimeFrames() {
    if (!this.chart) return;

    const x2Scale = this.chart.scales['x2'];
    this.selectedTimeFrames = (this.timastamps || []).reduce((acc, ts) => {
      const startX = x2Scale.getPixelForValue(new Date(ts.start).getTime());
      const stopX = x2Scale.getPixelForValue(new Date(ts.stop).getTime());
      const height = this.chart.chartArea.bottom - this.chart.chartArea.top;
      acc.push({
        w: stopX - startX,
        startX,
        startTime: ts.start,
        stopTime: ts.stop,
        startY: this.chart.chartArea.bottom - height,
        h: height,
        color: ts.color,
      });
      return acc;
    }, [] as SelectionRect[]);

    this.drawSelectedAreas();
  }

  private _setAdditionalCanvasesSize() {
    this.selectedOverlay.nativeElement.width = this.canvasContainer?.nativeElement?.clientWidth;
    this.selectedOverlay.nativeElement.height = this.canvasContainer?.nativeElement?.clientHeight;

    this.selectedAreasOverlay.nativeElement.width =
      this.canvasContainer?.nativeElement?.clientWidth;
    this.selectedAreasOverlay.nativeElement.height =
      this.canvasContainer?.nativeElement?.clientHeight;
  }

  private _resizeWindowHandler = () => {
    this.resizingActivated = true;
    if (this.resizingActivatedTimeout) clearTimeout(this.resizingActivatedTimeout);
    this.resizingActivatedTimeout = setTimeout(() => {
      this.resizingActivatedTimeout = null;
      this.resizingActivated = false;
    }, 100);
  };

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    window.removeEventListener('resize', this._resizeWindowHandler);
    this.chart?.destroy();

    if (this.selectionOverlayActivated) {
      (this.chartHtmlWrapper || window).removeEventListener(
        'pointerdown',
        this.pointerdownHandler as EventListener,
        true,
      );
      (this.chartHtmlWrapper || window).removeEventListener(
        'pointermove',
        this.pointermoveHandler as EventListener,
        true,
      );
      (this.chartHtmlWrapper || window).removeEventListener(
        'pointerup',
        this.pointerupHandler as EventListener,
        true,
      );
      this.selectionOverlayActivated = false;
    }
  }
}
