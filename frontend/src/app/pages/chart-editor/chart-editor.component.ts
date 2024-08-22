import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';

import {
  DataSource,
  InputChartEditorChartData,
  ListItem,
  OkSequence,
  SelectionRect
} from '../../shared/models';
import { SessionService } from '../../shared/services';
import { ChartEditorLineChartComponent } from './chart-editor-line-chart/chart-editor-line-chart.component';
import { ChartEditorService, SessionLocal } from './chart-editor.service';
import { ChartEditorConfigurationFormComponent } from './chart-editor-configuration-form/chart-editor-configuration-form.component';

@Component({
  selector: 'app-chart-editor',
  templateUrl: './chart-editor.component.html',
  styleUrls: ['./chart-editor.component.scss']
})
export class ChartEditorComponent implements OnInit, OnDestroy {
  viewModes: ListItem[] = [
    { name: 'Graph', value: 'graph' },
    { name: 'List', value: 'list' }
  ];
  currentSession: SessionLocal | null = null;
  chartData: InputChartEditorChartData | null = null;
  selectedTimestamps: OkSequence[] = [];
  selectionChartPeriodActivated = false;
  showChartSelectionTooltip = true;

  viewModeControl = new FormControl(this.viewModes[0].value);
  chartViewControl = new FormControl('time-series');

  @ViewChild('lineChart') lineChart!: ChartEditorLineChartComponent;
  @ViewChild('chartEditorConfigForm') chartEditorConfigForm!: ChartEditorConfigurationFormComponent;

  private readonly _destroyed$ = new Subject<void>();

  constructor(
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _chartEditorService: ChartEditorService,
    private readonly _sessionService: SessionService
  ) {}

  get loading$() {
    return this._chartEditorService.loading$;
  }

  get tabs$() {
    return this._chartEditorService.tabs$;
  }

  get activeTab$() {
    return this._chartEditorService.activeTab$;
  }

  ngOnInit(): void {
    this._watchCurrentModel();
  }

  okSequencesChanged(selectedTimestamps: OkSequence[]): void {
    this.selectedTimestamps = selectedTimestamps;
  }

  addOkSequenceByEvent(newSeq: SelectionRect): void {
    const from = Math.min(
      new Date(newSeq.startTime).getTime(),
      new Date(newSeq.stopTime).getTime()
    );
    const to = Math.max(new Date(newSeq.startTime).getTime(), new Date(newSeq.stopTime).getTime());

    this.chartEditorConfigForm.selectDateRangeWithChart({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString()
    });
  }

  activateSelectChartPeriod(value: boolean): void {
    this.selectionChartPeriodActivated = value;
    if (value) {
      this.lineChart.addSelectionOverlay();
    } else {
      this.lineChart.removeSelectionOverlay();
    }

    if (!value && this.showChartSelectionTooltip) {
      this.disableChartSelectionTooltip();
    }
  }

  disableChartSelectionTooltip(): void {
    this.showChartSelectionTooltip = false;
  }

  zoomOut(): void {
    this.lineChart.zoomOut();
  }

  createEmptySavedModel(): void {
    this._chartEditorService.createEmptyTab();
  }

  goToSession(sessionId: string): void {
    this._router.navigate(['chart-editor', sessionId], { queryParamsHandling: 'merge' });
  }

  removeTab(tabId: string): void {
    this._chartEditorService.deleteTab(tabId);
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
    this._sessionService.clearCurrentSession();
    this._chartEditorService.deselectActiveTab();
  }

  private _watchCurrentModel(): void {
    this._route.params
      .pipe(
        takeUntil(this._destroyed$),
        map(params => params['sessionId']),
        distinctUntilChanged(),
        filter(sessionId => {
          if (sessionId === 'new') {
            const tab = this._chartEditorService.createInitialTab();
            this.goToSession(tab.id);
          }
          return sessionId && sessionId !== 'new';
        }),
        switchMap((sessionId: string) => {
          const existedTab = this._chartEditorService.findTab(sessionId);
          return existedTab
            ? of(existedTab)
            : this._sessionService.getSession$(sessionId).pipe(
                map(
                  newSession =>
                    ({
                      ...newSession,
                      sessionLocal: false
                    }) as SessionLocal
                ),
                tap(newSession => {
                  this._chartEditorService.addTab(newSession);
                }),
                catchError(() => {
                  const item = this._chartEditorService.createEmptyTab();
                  return of(item);
                })
              );
        }),
        tap(session => {
          this._chartEditorService.selectActiveTab(session.id);
        }),
        debounceTime(500)
      )
      .subscribe(session => {
        this.chartViewControl.setValue('time-series');
        this.currentSession = session as SessionLocal;
        this.updateChartData(session);
        this._chartEditorService.stopLoading();
      });
  }

  updateChartData(session: Partial<SessionLocal>): void {
    this.chartData = {
      ...this.chartData,
      dataset: session.dataset as string,
      dataSource:
        session.dataSource ||
        ({
          id: session.dataSourceId,
          type: session.databaseType
        } as DataSource),
      features: session.features || [],
      queryErrors: true,
      start: session.dataTimerangeStart || '',
      stop: session.dataTimerangeStop || ''
    };
  }
}
