import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import {
  ANNOTATION_TAG,
  AnnotationTagEnum,
  OkSequence,
  ChartEditorLineChartDataItem,
  SavedAnnotation,
  SelectionRect,
} from '@shared/models';
import { Chart, ChartDataset, ScaleOptionsByType, TimeScale } from 'chart.js';
import { BehaviorSubject, Subject, combineLatest, debounceTime, filter, takeUntil } from 'rxjs';
import zoomPlugin from 'chartjs-plugin-zoom';
import { LineChartComponent } from '@shared/components';
import { TopChartService } from '../services/top-chart.service';
import { AnnotationsService } from '@shared/services';

type LineChartDataSet = ChartDataset<'line', ChartEditorLineChartDataItem[]> & { type: 'line' };

Chart.register(zoomPlugin);

@Component({
  selector: 'app-top-chart',
  templateUrl: './top-chart.component.html',
  styleUrls: ['./top-chart.component.scss'],
})
export class TopChartComponent implements OnDestroy {
  @Input() stealthMode = false;
  @Input() timestamps: OkSequence[] = [];

  scales: { [key: string]: ScaleOptionsByType<any> } = {};
  stepSize = 0;
  chartTop = 0;
  chartBottom = 0;
  chartData: LineChartDataSet[] = [];

  private _destroyed$ = new Subject<void>();
  private _chartReady$ = new Subject<void>();
  private _lineChart$: BehaviorSubject<LineChartDataSet[]> = new BehaviorSubject([] as any[]);
  private _zoomBarChart$: BehaviorSubject<LineChartDataSet[]> = new BehaviorSubject([] as any[]);
  private _annotationChart$: BehaviorSubject<LineChartDataSet[]> = new BehaviorSubject(
    [] as LineChartDataSet[],
  );

  @Output() newSeqEvent = new EventEmitter<SelectionRect>();
  @Output() removeSequences = new EventEmitter();

  @ViewChild('lineChart') lineChart!: LineChartComponent;

  constructor(
    private topChartService: TopChartService,
    private _annotationsService: AnnotationsService,
  ) {
    this.newSeqEvent.subscribe(rect => {
      this.topChartService.zoom$.next({
        min: new Date(rect.startTime).valueOf(),
        max: new Date(rect.stopTime).valueOf(),
      });
    });

    this.topChartService.data$
      .pipe(
        filter(data => !!Object.keys(data).length),
        takeUntil(this._destroyed$),
        debounceTime(500),
      )
      .subscribe(data => {
        const startTime = new Date(data[Object.keys(data)[0]][0].x).getTime();
        const windowSize = data[Object.keys(data)[0]][1]
          ? new Date(data[Object.keys(data)[0]][1].x).getTime() - startTime
          : 1000;

        const lineChartDataSets = Object.keys(data).reduce((acc, key, i) => {
          const value = data[key].filter(item => item.y !== null);
          acc.push(
            this._createLineChartDataSet(key, [
              {
                x: new Date(new Date(value[0].x).valueOf() - windowSize).toISOString(),
                y: value.length === 1 ? value[0].y : 0,
              },
              ...value,
            ]),
          );

          return acc;
        }, [] as LineChartDataSet[]);

        if (lineChartDataSets?.[0]?.data?.[0]) {
          const timastamp =
            new Date(lineChartDataSets[0].data[lineChartDataSets[0].data.length - 1].x).getTime() -
            new Date(lineChartDataSets[0].data[0].x).getTime();
          const fixedTicksCount = 1000;
          const milliseconds = 1000;
          const seconds = 60;

          this.stepSize = Math.ceil(timastamp / fixedTicksCount / milliseconds / seconds);
        }
        this._lineChart$.next(lineChartDataSets);
      });

    combineLatest([this._annotationsService.periodicAnnotations$, this._chartReady$])
      .pipe(takeUntil(this._destroyed$))
      .subscribe(([annotatedItems]) => {
        this._annotationChart$.next(
          this._createDataSetsForAnnotations(annotatedItems, this.chartBottom, this.chartTop),
        );
      });

    combineLatest([this.topChartService.zoom$, this._chartReady$])
      .pipe(takeUntil(this._destroyed$))
      .subscribe(([zoom]) => {
        this._zoomBarChart$.next(
          !!zoom.min && !!zoom.max
            ? [
                this._createDataSetForZoomRectangle(
                  new Date(zoom.min).toISOString(),
                  new Date(zoom.max).toISOString(),
                  this.chartBottom,
                  this.chartTop,
                ),
              ]
            : [],
        );
      });

    combineLatest([this._lineChart$, this._annotationChart$, this._zoomBarChart$])
      .pipe(takeUntil(this._destroyed$), debounceTime(500))
      .subscribe(([lineChartData, annotationsChartData, zoomChartData]) => {
        this.chartData = [...lineChartData, ...annotationsChartData, ...zoomChartData];
        this.scales = {
          ...this._getChartScales(lineChartData),
          ...(this.chartTop
            ? {
                y: {
                  max: this.chartTop,
                  min: this.chartBottom,
                },
              }
            : {}),
        };
      });
  }

  chartReady() {
    this.chartTop = this.lineChart.chart.scales['y'].max;
    this.chartBottom = this.lineChart.chart.scales['y'].min;
    this.addSelectionOverlay();
    this._chartReady$.next();
    this._chartReady$.complete();
  }

  addSelectionOverlay() {
    this.lineChart?.addSelectionOverlay();
  }

  removeSelectionOverlay() {
    this.lineChart?.removeSelectionOverlay();
  }

  drawSelectedAreas() {
    this.lineChart.drawSelectedAreas();
  }

  zoomHandler({ min, max }: { min: number; max: number }) {
    this.topChartService.zoom$.next({ min, max });
  }

  private _getChartScales(chartData: any[]): { [key: string]: ScaleOptionsByType<any> } {
    const min = chartData[0]?.data?.[0]?.x || undefined;
    const max = chartData[0]?.data[chartData[0]?.data?.length - 1]?.x || undefined;
    const range = new Date(max as string).getTime() - new Date(min as string).getTime();
    const stepSizeView = range / 10;

    return {
      x: {
        type: 'time',
        bounds: 'ticks',
        ticks: {
          stepSize: stepSizeView,
        },
        afterTickToLabelConversion: (scale: TimeScale) => {
          const ticks = scale.ticks;
          for (let i = 0; i < ticks.length; i++) {
            const tick = ticks[i];
            const parts = (tick.label as string)?.split('-');
            ticks[i].label = parts;
          }
        },
        time: {
          unit: 'millisecond',
          displayFormats: {
            millisecond: 'dd.MM.yyyy-HH:mm:ss',
            min: '00:00',
            max: '23:59',
          },
        },
      },
      x2: {
        type: 'time',
        position: 'bottom',
        display: false,
        min,
        max,
        ticks: {
          autoSkip: true,
          minRotation: 90,
          display: false,
          maxTicksLimit: 1000,
          stepSize: this.stepSize,
        },
        time: {
          unit: 'minute',
        },
      },
    };
  }

  private _createLineChartDataSet(
    label: string,
    data: ChartEditorLineChartDataItem[],
  ): LineChartDataSet {
    return {
      data,
      label,
      order: 1,
      xAxisID: 'x',
      yAxisID: 'y',
      type: 'line',
      backgroundColor: '#9BD0F5',
      borderColor: '#36A2EB',
      pointRadius: 0,
      borderWidth: 1,
    };
  }

  private _createDataSetsForAnnotations(
    annotatedItems: SavedAnnotation[],
    minY: number,
    maxY: number,
  ): LineChartDataSet[] {
    const defect = annotatedItems.filter(item =>
      this._annotationsService
        .getDefectAnnotationCategories(AnnotationTagEnum.DEFECT)
        .includes(item[ANNOTATION_TAG]),
    );
    const noDefect = annotatedItems.filter(item =>
      this._annotationsService
        .getDefectAnnotationCategories(AnnotationTagEnum.NO_DEFECT)
        .includes(item[ANNOTATION_TAG]),
    );

    const dataset = {
      type: 'line' as 'line',
      borderWidth: 1,
      xAxisID: 'x',
      yAxisID: 'y',
      order: 1,
      pointRadius: 0,
    };

    return [
      ...defect.map(item => ({
        ...dataset,
        data: [
          { x: new Date(item.time).toISOString(), y: minY },
          { x: new Date(item.time).toISOString(), y: maxY },
        ],
        backgroundColor: 'red',
        borderColor: 'red',
      })),
      ...noDefect.map(item => ({
        ...dataset,
        data: [
          { x: new Date(item.time).toISOString(), y: minY },
          { x: new Date(item.time).toISOString(), y: maxY },
        ],
        backgroundColor: 'green',
        borderColor: 'green',
      })),
    ];
  }

  private _createDataSetForZoomRectangle(start: string, stop: string, minY: number, maxY: number) {
    return {
      type: 'line' as 'line',
      maxBarThickness: 2,
      xAxisID: 'x',
      yAxisID: 'y',
      order: 3,
      pointRadius: 0,
      data: [
        // drawing rectangle
        { x: start, y: minY },
        { x: start, y: maxY },
        { x: stop, y: maxY },
        { x: stop, y: minY },
      ],
      fill: 'shape',
      backgroundColor: 'lightblue',
      borderColor: 'lightblue',
    };
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
  }
}
