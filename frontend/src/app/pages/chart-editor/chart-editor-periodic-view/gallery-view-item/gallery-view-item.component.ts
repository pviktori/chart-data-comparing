import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { GalleryItem, GalleryItemStatus, GalleryItemStatusObject } from '../models/gallery-item';
import { Chart, ChartData } from 'chart.js';
import { GallerySelectionService } from '../services/gallery-selection.service';
import { Subject, map, takeUntil } from 'rxjs';
import { AnnotationCategory } from '@shared/models';
import { AnnotationsService } from '@shared/services';

@Component({
  selector: 'app-gallery-view-item',
  templateUrl: './gallery-view-item.component.html',
  styleUrls: ['./gallery-view-item.component.scss']
})
export class GalleryViewItemComponent implements AfterViewInit, OnDestroy {
  @Input() galleryItem!: GalleryItem;
  @Input() status: AnnotationCategory | null = null;
  @Output() onMultipleAnnotate = new EventEmitter();
  @Output() onDeleteAnnotation = new EventEmitter();

  @ViewChild('lineChart') lineChartCanvas!: ElementRef;

  lineChart!: Chart;

  get defectSelected() {
    return this.status?.isDefect === true;
  }

  get noDefectSelected() {
    return this.status?.isDefect === false;
  }

  private _destroyed$ = new Subject<void>();

  isSelectedItem$ = this.gallerySelectionService.selectedItem$.pipe(
    takeUntil(this._destroyed$),
    map(selectedItem => selectedItem?.name === this.galleryItem.name)
  );

  isInSelectedItems$ = this.gallerySelectionService.selectedGalleryItems$.pipe(
    takeUntil(this._destroyed$),
    map(selectedGalleryItems => {
      return selectedGalleryItems.has(this.galleryItem);
    })
  );

  constructor(
    public gallerySelectionService: GallerySelectionService,
    public annotationsService: AnnotationsService
  ) {}

  hasChildren(node: object) {
    return !!Object.keys(node).length;
  }

  ngAfterViewInit(): void {
    const tempData =
      this.galleryItem.chartData.length === 1
        ? [...this.galleryItem.chartData, ...this.galleryItem.chartData]
        : this.galleryItem.chartData;
    const data: ChartData = {
      labels: tempData.map((d, i) => `c${i + 1}`),
      datasets: [
        {
          data: tempData.map(d => d.y),
          borderWidth: 1,
          fill: false,
          pointStyle: false,
          pointHoverRadius: 0
        }
      ]
    };

    this.lineChart = new Chart(this.lineChartCanvas.nativeElement, {
      type: 'line',
      data,
      options: {
        responsive: false,
        scales: {
          y: {
            ticks: {
              display: false
            }
          },
          x: {
            ticks: {
              display: false
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
      }
    });
  }

  addAnnotation(annotationKey: string, annotationName: string, isDefect: boolean) {
    const annotation: GalleryItemStatusObject = {
      displayName: annotationName,
      key: annotationKey,
      value: isDefect ? GalleryItemStatus.Defect : GalleryItemStatus.NoDefect
    };

    this.onMultipleAnnotate.emit(annotation);
  }

  deleteAnnotation() {
    this.onDeleteAnnotation.emit();
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
    this.lineChart.destroy();
  }
}
