import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ANNOTATION_TAG,
  AnnotationTag,
  AnnotationTagEnum,
  CreateSession,
  DataSource,
  DatabaseNames,
  DateRange,
  ListItem,
  OkSequence,
  SessionFilter
} from '@shared/models';
import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { ChartEditorService, SessionLocal } from '../chart-editor.service';
import {
  AnnotationsService,
  DataSourcesDetailsService,
  DataSourcesService,
  SessionService
} from '@shared/services';
import { Router } from '@angular/router';
import { TopChartService } from '../chart-editor-periodic-view/services/top-chart.service';

const filterOperators = {
  array: ['in', 'not in'],
  numeric: ['<', '<=', '>', '>='],
  stringOrNumeric: ['equals', 'not equals']
};
@Component({
  selector: 'app-chart-editor-configuration-form',
  templateUrl: './chart-editor-configuration-form.component.html',
  styleUrls: ['./chart-editor-configuration-form.component.scss']
})
export class ChartEditorConfigurationFormComponent implements OnInit, OnDestroy {
  @Input() viewMode: string = '';
  @Output() activateChartSelection = new EventEmitter<boolean>();
  @Output() formChanged = new EventEmitter();
  @Output() okSequencesChanged = new EventEmitter();

  session: null | SessionLocal = null;
  selectedDataSource!: DataSource;

  databases = { ...DatabaseNames };
  dataSources: DataSource[] = [];
  dataSets: string[] = [];
  features: string[] = [];
  steps: ListItem<number>[] = [
    {
      name: 'Setup',
      value: 0
    },
    {
      name: 'Filter',
      value: 1
    },
    {
      name: 'Sequences',
      value: 2
    }
  ];
  operators: string[] = [
    ...filterOperators.stringOrNumeric,
    ...filterOperators.array,
    ...filterOperators.numeric
  ];
  filterValues: string[] = [];
  periodicAnnotationsCount$!: Observable<{
    defect: { [key: string]: number };
    noDefect: { [key: string]: number };
  }>;
  annotationEnum = AnnotationTagEnum;
  periodicAnnotationsCountNoDefect = 0;
  periodicAnnotationsCountDefect = 0;
  annotationCategories = this._annotationsService.annotationCategories;
  sequences: OkSequence[] = [];

  newTimestampsMode = false;
  dataSetLoading = false;

  stepControl = new FormControl(0);
  dataSetupGroup = new FormGroup({
    dataSourceId: new FormControl(null, Validators.required),
    datasetId: new FormControl(null),
    timeFrame: new FormControl(null, Validators.required)
  });
  filtersGroup = new FormGroup({
    features: new FormControl([], Validators.required),
    filters: new FormArray([])
  });
  activateDateRange = new FormControl(false);
  modelDateRangeControl = new FormControl(null);

  private _destroyed$ = new Subject<void>();

  get isStepValid() {
    switch (this.stepControl.value) {
      case 0:
        return this.dataSetupGroup.valid;
      case 1:
        return this.filtersGroup.valid;
      case 2:
        return true;

      default:
        return false;
    }
  }

  public get filtersFormArray(): FormArray {
    return this.filtersGroup.get('filters') as FormArray;
  }

  constructor(
    private _dataSourcesService: DataSourcesService,
    private _dataSourcesDetailsService: DataSourcesDetailsService,
    private _router: Router,
    private _chartEditorService: ChartEditorService,
    private _sessionService: SessionService,
    private _annotationsService: AnnotationsService,
    private _topChartService: TopChartService
  ) {
    this._watchPeriodicAnnotationsCount();
  }

  ngOnInit(): void {
    this._dataSourcesService.getDataSources();
    this._getDataSources();
    this._watchDataSourceId();
    this._watchDataSetId();
    this._watchActiveTab();
    this._watchDatasets();
  }

  getFilterGroupValueType(index: number) {
    return filterOperators.numeric.includes(this.filtersFormArray.at(index).get('operator')?.value)
      ? 'number'
      : 'string';
  }

  getSessionUpdatedFields(): Partial<CreateSession> {
    const dataSetupFormValue = this.dataSetupGroup.value;
    return {
      dataSourceId: this.selectedDataSource?.id,
      databaseType: this.selectedDataSource?.type,
      dataset: dataSetupFormValue.datasetId,
      features: this.filtersGroup.get('features')?.value,
      filters: (this.filtersFormArray.value as SessionFilter[]).map(filter =>
        this._convertFilterValueTypes(filter)
      ),
      dataTimerangeStart: dataSetupFormValue.timeFrame
        ? new Date(dataSetupFormValue.timeFrame.from).toISOString()
        : null,
      dataTimerangeStop: dataSetupFormValue.timeFrame
        ? new Date(dataSetupFormValue.timeFrame.to).toISOString()
        : null
    };
  }

  goToStep(step: number) {
    // if session is local, navigate by bookmarks is not allowed
    // user can inly go back and edit previous steps
    if (!this.session?.sessionLocal && step < this.stepControl.value) {
      this.stepControl.setValue(step);
    }
  }

  nextStep() {
    if (this.stepControl.value === 0) {
      this.handleDataSetupStep();
    }
    if (this.stepControl.value === 1) {
      this.handleDataFiltersStep();
    }

    if (this.stepControl.value < 2) this.stepControl.setValue(this.stepControl.value + 1);
  }

  handleDataSetupStep() {
    if (!this.dataSetupGroup.valid) return;
    this.getInfluxTagsAndFields();
  }

  handleDataFiltersStep() {
    if (this.filtersGroup.valid) this.onCreateSession();
  }

  onCreateSession() {
    if (!this.session) return;
    this._chartEditorService.startLoading();

    const sessionParams: CreateSession = this.getSessionUpdatedFields() as CreateSession;

    const obs$: Observable<SessionLocal> = this.session.sessionLocal
      ? this._sessionService.createSession$(sessionParams)
      : this._resetSession$(sessionParams);

    obs$.subscribe(session => {
      this._chartEditorService.updateActiveTab({
        ...session,
        sessionLocal: false
      });
      this.dataSetupGroup.markAsUntouched();
      this.goToSession(session!.id);
      this.formChanged.emit(session);
      this._chartEditorService.stopLoading();
    });
  }

  goToSession(sessionId: string) {
    this._router.navigate(['chart-editor', sessionId], { queryParamsHandling: 'merge' });
  }

  selectDateRangeWithChart(value: DateRange) {
    this.setNewDateRange(value.from as string, value.to as string);
  }

  addDateRangeByInput() {
    const { from, to } = this.modelDateRangeControl.value;
    this.setNewDateRange(from, to);
  }

  setNewDateRange(from: string, to: string) {
    this.sequences = [...this.sequences, new OkSequence(from as string, to as string)];
    this.okSequencesChanged.emit(this.sequences);
  }

  removeDateRange(index: number) {
    this.sequences = this.sequences.filter((_, i) => {
      return i !== index;
    });

    this.okSequencesChanged.emit(this.sequences);
  }

  activateSelectChartPeriod(value: boolean) {
    this.activateDateRange.setValue(value);
    this.newTimestampsMode = true;
    this.activateChartSelection.emit(value);
    this.resetDateRanges();
  }

  resetDateRanges() {
    const prevSequences = this.sequences || [];

    this.okSequencesChanged.emit(
      prevSequences.map(item => {
        if (this.newTimestampsMode) item.mode = item.saved ? 'default' : 'extra';
        else item.mode = 'default';
        return item;
      })
    );
  }

  addFilter(filter?: SessionFilter) {
    this.filtersFormArray.push(
      new FormGroup({
        feature: new FormControl(filter?.feature || null, [Validators.required]),
        operator: new FormControl(filter?.operator || null, [Validators.required]),
        value: new FormControl(filter?.value || null, [Validators.required])
      })
    );
  }

  getInfluxTagsAndFields() {
    this._dataSourcesDetailsService
      .getInfluxTagsAndFields(
        this.selectedDataSource.type,
        this.selectedDataSource.id,
        this.dataSetupGroup.get('datasetId')?.value
      )
      .subscribe(({ fields }) => {
        this.features = [...fields];
      });
  }

  removeFilter(index: number) {
    this.filtersFormArray.removeAt(index);
  }

  removeAnnotations(label: AnnotationTag) {
    this._topChartService.zoom$
      .pipe(
        first(),
        switchMap(zoom =>
          this._annotationsService.deleteSpecificAnnotation$(
            this.selectedDataSource.type,
            this.selectedDataSource.id,
            this.session!.dataset as string,
            label,
            {
              start: zoom.min || new Date(this.session?.dataTimerangeStart!).getTime(),
              stop: zoom.max || new Date(this.session?.dataTimerangeStop!).getTime()
            }
          )
        )
      )
      .subscribe();
  }

  ngOnDestroy() {
    this._destroyed$.next();
    this._destroyed$.complete();
  }

  private _getDataSources() {
    this._dataSourcesService.dataSources$
      .pipe(
        takeUntil(this._destroyed$),
        distinctUntilChanged(),
        filter(values => !!values)
      )
      .subscribe(values => {
        this.dataSources = Object.values(values || {}).flat() as DataSource[];
      });
  }

  private _watchDataSourceId() {
    this.dataSetupGroup
      .get('dataSourceId')
      ?.valueChanges.pipe(
        takeUntil(this._destroyed$),
        tap(value => {
          if (!value) {
            this.dataSetupGroup.get('datasetId')?.disable();
          } else {
            this.dataSetupGroup.get('datasetId')?.enable();
          }
        }),
        filter(value => !!value),
        distinctUntilChanged(),
        tap(dataSourceId => {
          this.dataSetLoading = true;
          this.selectedDataSource = this._dataSourcesService.getCurrentDataSource<DataSource>(
            dataSourceId
          ) as DataSource;
        }),
        switchMap(() =>
          this._dataSourcesDetailsService.getDataSetNames$(
            this.selectedDataSource.type,
            this.selectedDataSource.id
          )
        )
      )
      .subscribe(() => {
        this.dataSetLoading = false;
        this.dataSetupGroup.get('datasetId')!.reset(null);
        this.dataSetupGroup.get('datasetId')?.markAsUntouched();
      });
  }

  private _watchDatasets() {
    this._dataSourcesDetailsService.dataSetsAndFeatures$.subscribe(dataSetNames => {
      this.dataSets = Array.isArray(dataSetNames) ? dataSetNames : Object.keys(dataSetNames || {});
    });
  }

  private _watchDataSetId() {
    this.dataSetupGroup
      .get('datasetId')!
      .valueChanges.pipe(
        takeUntil(this._destroyed$),
        debounceTime(500),
        distinctUntilChanged(),
        filter(v => !!v),
        switchMap((dataset: string) =>
          forkJoin({
            features: this._getFeaturesByDataset$(dataset),
            timeFrame: this._getDatasetTimeRange$(dataset)
          })
        )
      )
      .subscribe(({ timeFrame, features }) => {
        this.features = features;
        if (timeFrame) {
          this.dataSetupGroup.get('timeFrame')?.enable();
          this.dataSetupGroup.get('timeFrame')?.setValue({
            from: timeFrame.start,
            to: timeFrame.stop
          });
        } else {
          this.dataSetupGroup.get('timeFrame')?.disable();
          this.dataSetupGroup.get('timeFrame')?.reset(null);
        }
      });
  }

  private _getDatasetTimeRange$(dataset: string): Observable<{ start: number; stop: number }> {
    return this._dataSourcesDetailsService
      .getAvailableDatasetTimeFrame$(
        (this.selectedDataSource || this.session?.dataSource)?.type,
        (this.selectedDataSource || this.session?.dataSource)?.id,
        dataset
      )
      .pipe(
        map(timeRanges => {
          return timeRanges;
        })
      );
  }

  private _getFeaturesByDataset$(dataset: string) {
    return this._dataSourcesDetailsService
      .getFeatures(this.selectedDataSource.type, this.selectedDataSource.id, dataset)
      .pipe(
        map(features => {
          return features.sort((a: string, b: string) => {
            const numA: number | null = parseInt((a.match(/\d+/)! || [])[0]);
            const numB: number | null = parseInt((b.match(/\d+/)! || [])[0]);
            if (numA === null || numB === null) {
              return 0; // fallback to no sorting
            }
            return numA - numB || a.localeCompare(b);
          });
        })
      );
  }

  private _convertFilterValueTypes(filter: SessionFilter) {
    if (filterOperators.numeric.includes(filter.operator)) {
      filter.value = +filter.value;
    } else if (filterOperators.stringOrNumeric.includes(filter.operator)) {
      filter.value = Number.isNaN(+filter.value) ? filter.value : +filter.value;
    } else if (filterOperators.array.includes(filter.operator)) {
      filter.value = (filter.value as string)
        .split(',')
        .map(item => (Number.isNaN(+item) ? item : +item));
    }

    return filter;
  }

  private _watchPeriodicAnnotationsCount() {
    this.periodicAnnotationsCount$ = this._annotationsService.periodicAnnotations$.pipe(
      distinctUntilChanged(),
      takeUntil(this._destroyed$),
      map(periodicAnnotations =>
        periodicAnnotations.reduce(
          (acc, annotation) => {
            const tag = annotation[ANNOTATION_TAG];
            const name = this._annotationsService.annotationCategories[tag].isDefect
              ? 'defect'
              : 'noDefect';
            acc[name][tag] = (acc[name][tag] || 0) + 1;
            return acc;
          },
          { defect: {}, noDefect: {} } as {
            defect: { [key: string]: number };
            noDefect: { [key: string]: number };
          }
        )
      ),
      tap(result => {
        this.periodicAnnotationsCountNoDefect = Object.values(result.noDefect || {}).reduce(
          (a, b) => a + b,
          0
        );
        this.periodicAnnotationsCountDefect = Object.values(result.defect || {}).reduce(
          (a, b) => a + b,
          0
        );
      })
    );
  }

  private _watchActiveTab() {
    this._chartEditorService.activeTab$
      .pipe(
        takeUntil(this._destroyed$),
        filter(session => !!session),
        debounceTime(500),
        distinctUntilChanged((prev, curr) => {
          if (this.dataSetupGroup.touched) {
            this._chartEditorService.updateTabs(prev!.id, this.getSessionUpdatedFields());
            if (prev && !prev.sessionLocal)
              this._sessionService
                .updateSession$(prev!.id, this.getSessionUpdatedFields())
                .subscribe();
          }

          return prev === curr;
        })
      )
      .subscribe(session => {
        this.session = session;
        if (!session?.sessionLocal) {
          this.stepControl.setValue(2);
        } else {
          this.stepControl.setValue(0);
        }
        if (session) {
          this.dataSetupGroup.patchValue({
            dataSourceId: session.dataSourceId,
            datasetId: session.dataset,
            timeFrame: session.dataTimerangeStart
              ? { from: session.dataTimerangeStart, to: session.dataTimerangeStop }
              : null
          });

          this.filtersGroup.patchValue({
            features: session.features
          });
          this.filtersFormArray.clear();

          session.filters.map(filter => {
            this.addFilter(filter);
          });

          this.dataSetupGroup.markAsUntouched();
        }
      });
  }

  private _resetSession$(sessionParams: CreateSession): Observable<SessionLocal> {
    const oldSession = this.session as SessionLocal;
    const sessionReset$ = this._sessionService
      .deleteSession$(oldSession.id)
      .pipe(switchMap(() => this._sessionService.createSession$(sessionParams)));

    return sessionReset$;
  }
}
