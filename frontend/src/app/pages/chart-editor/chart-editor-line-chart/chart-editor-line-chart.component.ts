import 'chartjs-adapter-date-fns';

import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  CHART_COLORS,
  DatabaseUnit,
  InputChartEditorChartData,
  ListItem,
  OkSequence,
  ChartEditorLineChartDataItem,
  SelectionRect,
  SessionDataRequest
} from '@shared/models';
import { DataSourcesDetailsService } from '@shared/services';
import Chart, { ChartDataset, ScaleOptionsByType, TimeScale } from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  map,
  Observable,
  of,
  startWith,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { LineChartComponent } from '@shared/components';
import { ChartEditorService } from '../chart-editor.service';

type LineChartDataSet = ChartDataset<'line', ChartEditorLineChartDataItem[]> & { type: 'line' };
type ScatterChartDataSet = ChartDataset<'scatter', ChartEditorLineChartDataItem[]> & {
  type: 'scatter';
};

Chart.register(zoomPlugin);

@Component({
  selector: 'app-chart-editor-line-chart',
  templateUrl: './chart-editor-line-chart.component.html',
  styleUrls: ['./chart-editor-line-chart.component.scss']
})
export class ChartEditorLineChartComponent implements OnDestroy {
  @Input() showActionButtons = true;
  @Input() stealthMode = false;
  @Input() title = 'chart_editor.results';
  @Input() set sessionId(value: string | null) {
    if (this._sessionId !== value) {
      this.scatterChartDataSets = [];
      this.zoom$.next({ min: 0 });
    }
    this._sessionId = value;
  }
  @Input() timestamps: OkSequence[] = [];
  @Input() set inputData(value: InputChartEditorChartData | null) {
    this._inputData$.next(value);
  }
  @Input() chartHtmlWrapper?: HTMLElement;

  lineChartDataSets: LineChartDataSet[] = [];
  scatterChartDataSets: ScatterChartDataSet[] = [];
  chartData: (LineChartDataSet | ScatterChartDataSet)[] = [];
  featuresSubscriber!: Subscription;
  multivalueCheckboxList: ListItem<boolean | string>[] = [
    {
      name: '',
      value: true
    },
    {
      name: '',
      value: false
    },
    { name: 'R', value: 'r' }
  ];
  extraScales: { [key: string]: ScaleOptionsByType<any> } = {};
  scales: { [key: string]: ScaleOptionsByType<any> } = {};
  stepSize = 0;
  lineChartColors: { [key: string]: string } = {};
  featuresGroup!: FormGroup;
  zoom$ = new Subject<{ min: number; max?: number }>();
  maxFeaturesLength = 5;
  features: string[] = [];
  colors: string[] = [];

  loading$!: Observable<boolean>;
  loadingMessage$!: Observable<string>;
  private _inputData$ = new BehaviorSubject<InputChartEditorChartData | null>(null);
  private _destroyed$ = new Subject<void>();
  private _sessionId: string | null = null;

  @Output() newSeqEvent = new EventEmitter<SelectionRect>();
  @Output() noDataEvent = new EventEmitter();

  @ViewChild('lineChart') lineChart!: LineChartComponent;

  constructor(
    private _dataSourcesDetailsService: DataSourcesDetailsService,
    private _fb: FormBuilder,
    private _chartEditorService: ChartEditorService
  ) {
    combineLatest([
      this._inputData$,
      this.zoom$.pipe(
        startWith({
          min: 0,
          max: undefined
        })
      )
    ])
      .pipe(
        takeUntil(this._destroyed$),
        tap(() => {
          if (!this.stealthMode) this._chartEditorService.startChartLoading();
        }),
        debounceTime(500),
        filter(([value]) => !!value),
        tap(([value]) => {
          const features = (value?.features || []).sort((a: string, b: string) => {
            const numA: number | null = parseInt((a.match(/\d+/)! || [])[0]);
            const numB: number | null = parseInt((b.match(/\d+/)! || [])[0]);
            if (numA === null || numB === null) {
              return 0; // fallback to no sorting
            }
            return numA - numB || a.localeCompare(b);
          });
          if (JSON.stringify(features) !== JSON.stringify(this.features)) {
            this.features = features;
            this._rebuildFeaturesForm(features);
          }
        }),
        switchMap(([value, zoom]) =>
          this._loadData$(
            value as InputChartEditorChartData,
            zoom.min
              ? zoom
              : {
                  min: new Date(value!.start as string).getTime() || 0,
                  max: new Date(value!.stop as string).getTime() || undefined
                }
          )
        )
      )
      .subscribe(() => {
        this.updateChart();
      });

    this.loading$ = this._chartEditorService.chartLoading$.pipe(takeUntil(this._destroyed$));
    this.loadingMessage$ = this._chartEditorService.chartStatus$.pipe(takeUntil(this._destroyed$));
  }

  noDataHandler() {
    this.noDataEvent.emit();
    this.zoomOut();
  }

  chartReady() {
    this._chartEditorService.stopChartLoading();
    this._chartEditorService.resetChartStatus();
  }

  updateChart() {
    this.chartData = [...this.lineChartDataSets, ...this.scatterChartDataSets];
    this.scales = this._getChartScales();
  }

  addSelectionOverlay() {
    this.lineChart.addSelectionOverlay();
  }

  removeSelectionOverlay() {
    this.lineChart.removeSelectionOverlay();
  }

  drawSelectedAreas() {
    this.lineChart.drawSelectedAreas();
  }

  zoomOut() {
    this.zoomHandler({ min: 0 });
  }

  zoomHandler({ min, max }: { min: number; max?: number }) {
    this.zoom$.next({ min, max });
    this._inputData$.next({
      ...this._inputData$.getValue()!,
      requestAnomalies: true
    });
  }

  private _getChartScales(): { [key: string]: ScaleOptionsByType<any> } {
    const min = this.lineChartDataSets?.[0]?.data?.[0]?.x || undefined;
    const max =
      this.lineChartDataSets?.[0]?.data[this.chartData?.[0]?.data?.length - 1]?.x || undefined;

    const range =
      min && max ? new Date(max as string).getTime() - new Date(min as string).getTime() : 0;
    const stepSizeView = range / 10;
    return {
      x: {
        type: 'time',
        bounds: 'ticks',
        ticks: {
          stepSize: stepSizeView || undefined
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
            max: '23:59'
          }
        }
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
          stepSize: this.stepSize || undefined
        },
        time: {
          unit: 'minute'
        }
      },
      ...this.extraScales
    };
  }

  private _rebuildFeaturesForm(features: string[]) {
    if (!this.featuresGroup) {
      this.featuresGroup = this._fb.group(
        features.reduce(
          (acc, curr) => {
            // show all features by default
            acc[curr] = this._fb.control(this.multivalueCheckboxList[0]);
            return acc;
          },
          {} as { [key: string]: FormControl }
        )
      );
      this._watchFeaturesGroup();
      return;
    }

    const controlNames = Object.keys(this.featuresGroup?.controls);
    if (features.length && controlNames?.length && this._arraysEqual(features, controlNames)) {
      return;
    }

    controlNames.forEach(controlName => {
      if (!features.includes(controlName)) this.featuresGroup.removeControl(controlName);
    });

    features.forEach(feature => {
      if (!controlNames.includes(feature)) {
        this.featuresGroup.addControl(feature, this._fb.control(this.multivalueCheckboxList[0]));
      }
    });
  }

  private _watchFeaturesGroup() {
    this.featuresGroup.valueChanges
      .pipe(takeUntil(this._destroyed$), debounceTime(500))
      .subscribe((featuresValue: { [key: string]: ListItem<boolean | string> }) => {
        this._chartEditorService.startChartLoading();
        const scatterChartDataSets = [...this.scatterChartDataSets];

        // configure extra Y-scales with feature name
        this.extraScales = Object.keys(featuresValue).reduce(
          (acc, key) => {
            if (featuresValue[key].value === 'r') {
              acc[key] = {
                position: 'right'
              };
            }
            return acc;
          },
          {} as { [key: string]: ScaleOptionsByType<any> }
        );

        this.lineChartDataSets = this.lineChartDataSets.map((set, i) => {
          set.yAxisID = this.extraScales[set.label as string] ? set.label : 'y';
          set.hidden = !featuresValue[set.label as string]?.value;

          // scatter chart
          if (scatterChartDataSets[i]) {
            const scatterChart = scatterChartDataSets[i];
            scatterChart.yAxisID = this.extraScales[set.label as string] ? set.label : 'y';
            scatterChart.hidden = !featuresValue[set.label as string]?.value;
          }

          return set;
        });
        this.scatterChartDataSets = scatterChartDataSets;
        this.chartData = [...this.lineChartDataSets, ...this.scatterChartDataSets];
        this.updateChart();
      });
  }

  private _fetchChartData$(
    params: {
      table: string;
      queryErrors: boolean;
      databaseType: DatabaseUnit;
      dataSourceId: string;
      timeFrameInSecs?: number;
    },
    start: number = 0,
    stop: number | undefined = undefined
  ) {
    const queryParams: SessionDataRequest = {
      start: params.timeFrameInSecs ? stop! - (params.timeFrameInSecs || 0) * 1000 : start,
      queryErrors: Number(params.queryErrors)
    };

    if (stop !== undefined) queryParams['stop'] = stop;

    return this._dataSourcesDetailsService.getSessionData$(
      params.databaseType,
      params.dataSourceId,
      this._sessionId || '',
      queryParams
    );
  }

  private _createLineChartDataSet(
    label: string,
    data: ChartEditorLineChartDataItem[],
    color: string
  ): LineChartDataSet {
    return {
      data,
      label,
      order: 1,
      xAxisID: 'x',
      yAxisID: this.extraScales[label] ? label : 'y',
      type: 'line',
      backgroundColor: [color],
      borderColor: [color],
      pointRadius: 0,
      hidden: !this.featuresGroup.value[label].value
    };
  }

  private _getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  private _createScatterChartDataSet(
    label: string,
    data: ChartEditorLineChartDataItem[]
  ): ScatterChartDataSet {
    return {
      data,
      label: label + '_anomaly',
      order: 0,
      xAxisID: 'x',
      yAxisID: this.extraScales[label] ? label : 'y',
      pointRadius: 5,
      backgroundColor: ['red'],
      borderColor: ['black'],
      type: 'scatter',
      hidden: !this.featuresGroup.value[label].value
    };
  }

  private _getNoAnomalyChartData$(
    params: InputChartEditorChartData,
    start: number = 0,
    stop?: number
  ) {
    return this._fetchChartData$(
      {
        queryErrors: false,
        table: '',
        databaseType: params.dataSource.type,
        dataSourceId: params.dataSource.id
      },
      start,
      stop
    ).pipe(
      map((data: { [key: string]: ChartEditorLineChartDataItem[] }) => {
        this.lineChartDataSets = this.features.reduce((acc, key, i) => {
          const value = (data[key] || []).filter(item => item.y !== null);

          if (!this.colors[i]) {
            this.colors[i] = CHART_COLORS[i] || this._getRandomColor();
          }
          acc.push(
            this._createLineChartDataSet(
              key,
              value.length === 1
                ? [
                    {
                      x: new Date(new Date(value[0].x).valueOf() - 1000).toISOString(),
                      y: value[0].y
                    },
                    ...value
                  ]
                : value,
              this.colors[i]
            )
          );

          this.lineChartColors[key] = this.colors[i];
          return acc;
        }, [] as LineChartDataSet[]);

        if (this.lineChartDataSets?.[0]?.data?.[0]) {
          const timastamp =
            new Date(
              this.lineChartDataSets[0].data[this.lineChartDataSets[0].data.length - 1].x
            ).getTime() - new Date(this.lineChartDataSets[0].data[0].x).getTime();
          const fixedTicksCount = 1000;
          const milliseconds = 1000;
          const seconds = 60;

          this.stepSize = Math.ceil(timastamp / fixedTicksCount / milliseconds / seconds);
        } else {
          this.stepSize = 0;
        }
      })
    );
  }

  private _getAnomalyChartData$(
    params: InputChartEditorChartData,
    start: number = 0,
    stop?: number
  ) {
    return this._fetchChartData$(
      {
        table: '',
        queryErrors: true,
        databaseType: params.dataSource.type,
        dataSourceId: params.dataSource.id
      },
      start,
      stop
    );
  }

  private _loadData$(value: InputChartEditorChartData, zoom: { min?: number; max?: number }) {
    return this._getNoAnomalyChartData$(value, zoom.min, zoom.max).pipe(
      switchMap(() =>
        value.queryErrors ? this._getAnomalyChartData$(value, zoom.min, zoom.max) : of({})
      ),
      map((data: { [key: string]: ChartEditorLineChartDataItem[] }) => {
        if (!value.queryErrors) {
          return;
        }
        this.scatterChartDataSets = Object.keys(data).reduce((acc, key) => {
          const value = data[key];
          acc.push(this._createScatterChartDataSet(key, value));
          return acc;
        }, [] as ScatterChartDataSet[]);
      })
    );
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
    this.extraScales = {};
    this.scatterChartDataSets = [];
    this.lineChartDataSets = [];
    this.chartData = [];
  }

  private _dateToSeconds(date: string) {
    return this._toSeconds(new Date(date).getTime());
  }

  private _toSeconds(ms: number) {
    return Math.floor(ms / 1000);
  }

  private _arraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }

    const frequencyCounter: { [key: string]: number } = {};

    for (const val of arr1) {
      frequencyCounter[val] = (frequencyCounter[val] || 0) + 1;
    }

    for (const val of arr2) {
      if (!frequencyCounter[val]) {
        return false;
      }
      frequencyCounter[val]--;
    }

    return true;
  }
}
