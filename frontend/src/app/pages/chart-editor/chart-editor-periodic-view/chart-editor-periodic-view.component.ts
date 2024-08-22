import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  Observable,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  startWith,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { GalleryItem } from './models/gallery-item';
import { Chart } from 'chart.js';
import { GalleryPaginationService } from './services/gallery-pagination.service';
import { GallerySelectionService } from './services/gallery-selection.service';
import { TopChartService } from './services/top-chart.service';
import { ChartEditorService, SessionLocal } from '../chart-editor.service';
import { DataSource, ZoomArea } from '@shared/models';
import { AnnotationsService } from '@shared/services';

@Component({
  selector: 'app-chart-editor-periodic-view',
  templateUrl: './chart-editor-periodic-view.component.html',
  styleUrls: ['./chart-editor-periodic-view.component.scss']
})
export class ChartEditorPeriodicViewComponent implements OnInit, AfterViewInit, OnDestroy {
  showBigChart = false;
  selectedItemChart!: Chart;
  loading = true;
  currentSession!: SessionLocal;

  dateRange$!: Observable<ZoomArea>;
  selectedGalleryItem$: Observable<GalleryItem | null> = this.gallerySelectionService.selectedItem$;
  private _destroyed$ = new Subject<void>();

  @ViewChild('selectedItem') selectedItemCanvas!: ElementRef;

  constructor(
    private galleryPaginationService: GalleryPaginationService,
    private gallerySelectionService: GallerySelectionService,
    private topChartService: TopChartService,
    private chartEditorService: ChartEditorService,
    private _annotationsService: AnnotationsService
  ) {
    this._watchDateRange();
  }

  ngOnInit(): void {
    (this.chartEditorService.activeTab$ as Observable<SessionLocal>)
      .pipe(
        takeUntil(this._destroyed$),
        filter(session => !!(session?.id || !session?.sessionLocal)),
        distinctUntilChanged((prev, curr) => curr!.id === prev!.id)
      )
      .subscribe(session => {
        this.currentSession = session;
      });

    this._watchGalleryItemsLoad();
    this._watchSelectedItem();
    this._loadAnnotations();
  }

  private _loadAnnotations() {
    this.dateRange$
      .pipe(
        takeUntil(this._destroyed$),
        switchMap(zoom =>
          this._annotationsService.readAnnotationsByDataset$(
            this.currentSession.databaseType,
            this.currentSession.dataSourceId as string,
            this.currentSession!.dataset as string,
            {
              start:
                zoom.min || new Date(this.currentSession!.dataTimerangeStart as string).getTime(),
              stop:
                zoom.max || new Date(this.currentSession!.dataTimerangeStop as string).getTime(),
              queryErrors: 0
            }
          )
        )
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    const data = {
      datasets: [
        {
          data: []
        }
      ]
    };
    this.selectedItemChart = new Chart(this.selectedItemCanvas.nativeElement, {
      type: 'line',
      data,
      options: {
        responsive: true,
        animation: false,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              sampleSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  zoomOut() {
    this.topChartService.zoom$.next({ min: 0 });
  }

  private _watchGalleryItemsLoad() {
    combineLatest([this.dateRange$, this.galleryPaginationService.currentPage$])
      .pipe(
        takeUntil(this._destroyed$),
        debounceTime(500),
        switchMap(([dateRange, page]) =>
          this.topChartService
            .loadGalleryItems$(
              {
                dataset: this.currentSession!.dataset as string,
                dataSource: {
                  id: this.currentSession!.dataSourceId as string,
                  type: this.currentSession!.databaseType
                } as DataSource,
                features: this.currentSession!.features,
                start: this.currentSession!.dataTimerangeStart,
                stop: this.currentSession!.dataTimerangeStop
              },
              this.currentSession!.id
            )
            .pipe(
              tap(() => {
                this.chartEditorService.stopChartLoading();
              }),
              switchMap(() =>
                this.galleryPaginationService.loadGalleryItems$(
                  {
                    dataset: this.currentSession!.dataset as string,
                    dataSource: {
                      id: this.currentSession!.dataSourceId as string,
                      type: this.currentSession!.databaseType
                    } as DataSource,
                    features: this.currentSession!.features,
                    start: this.currentSession!.dataTimerangeStart,
                    stop: this.currentSession!.dataTimerangeStop
                  },
                  this.currentSession!.id,
                  dateRange,
                  page
                )
              )
            )
        )
      )
      .subscribe(() => {
        this.loading = false;
      });
  }

  private _watchSelectedItem() {
    this.gallerySelectionService.selectedItem$
      .pipe(takeUntil(this._destroyed$))
      .subscribe(selectedItem => {
        this.showBigChart = selectedItem !== null;
        if (!selectedItem) {
          this.selectedItemChart?.reset();
          this.selectedItemChart?.update('none');

          return;
        }

        if (this.selectedItemChart) {
          (this.selectedItemChart.data.labels = selectedItem.chartData.map(d =>
            d.x.toLowerCase().replace('column', 'c')
          )),
            (this.selectedItemChart.data.datasets[0] = {
              data: selectedItem.chartData.map(d => d.y),
              pointStyle: false,
              pointHoverRadius: 1
            });
          this.selectedItemChart.resize();
          this.selectedItemChart.update('none');
        }
      });
  }

  private _watchDateRange() {
    this.dateRange$ = this.topChartService.zoom$.pipe(
      startWith({
        min: 0,
        max: null
      }),
      distinctUntilChanged((prev, curr) => prev.min === curr.min && prev.max === curr.max),
      tap(() => {
        this.loading = true;
      }),
      debounceTime(500),
      tap(() => {
        this.galleryPaginationService.selectPage(1);
      })
    );
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
    this.topChartService.resetData();
    this.galleryPaginationService.resetData();
    this.selectedItemChart.destroy();
  }
}
