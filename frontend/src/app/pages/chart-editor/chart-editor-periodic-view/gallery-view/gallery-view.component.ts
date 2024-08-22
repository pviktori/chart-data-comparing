import { Component, OnDestroy, OnInit } from '@angular/core';
import { GalleryItemStatusObject } from '../models/gallery-item';
import {
  Observable,
  Subject,
  combineLatest,
  first,
  forkJoin,
  map,
  switchMap,
  takeUntil
} from 'rxjs';
import { GalleryPaginationService } from '../services/gallery-pagination.service';
import { ChartEditorService } from '../../chart-editor.service';
import { GallerySelectionService } from '../services/gallery-selection.service';
import { AnnotationsService } from '@shared/services';
import { ANNOTATION_TAG } from '@shared/models';

@Component({
  selector: 'app-gallery-view',
  templateUrl: './gallery-view.component.html',
  styleUrls: ['./gallery-view.component.scss']
})
export class GalleryViewComponent implements OnInit, OnDestroy {
  pageCount = 0;
  pages: number[] = [];
  annotationKey = ANNOTATION_TAG;

  private _destroyed$ = new Subject<void>();
  currentPage$ = this._galleryPaginationService.currentPage$.pipe(takeUntil(this._destroyed$));
  galleryItems$: Observable<any[]> = this._galleryPaginationService.page$.pipe(
    takeUntil(this._destroyed$),
    map(items => {
      return items.map(item => ({ ...item, name: new Date(item.name).getTime() }));
    })
  );
  itemsStatuses$ = this._annotationsService.periodicAnnotations$.pipe(
    takeUntil(this._destroyed$),
    map(items =>
      items.reduce(
        (acc, curr) => {
          acc[new Date(curr.time).getTime() + ''] = {
            ...this._annotationsService.annotationCategories[curr[ANNOTATION_TAG]],
            ...curr
          };
          return acc;
        },
        {} as Record<string, any>
      )
    )
  );

  constructor(
    public gallerySelectionService: GallerySelectionService,
    private _galleryPaginationService: GalleryPaginationService,
    private _chartEditorService: ChartEditorService,
    private _annotationsService: AnnotationsService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this._galleryPaginationService.pageCount$,
      this._galleryPaginationService.currentPage$
    ])
      .pipe(takeUntil(this._destroyed$))
      .subscribe(([pageCount, currentPage]) => {
        this.pageCount = pageCount;
        if (pageCount < 5) {
          this.pages = Array.from({ length: pageCount }).map((_, i) => 1 + i);
        } else if (currentPage <= 2) {
          this.pages = Array.from({ length: 5 }).map((_, i) => 1 + i);
        } else if (pageCount - currentPage < 2) {
          this.pages = Array.from({ length: 5 }).map((_, i) => pageCount - 4 + i);
        } else {
          this.pages = Array.from({ length: 5 }).map((_, i) => currentPage - 2 + i);
        }

        if (this.pages[this.pages.length - 1] !== this.pageCount) {
          this.pages = [...this.pages, this.pageCount];
        }
      });
  }

  annotateSelectedItems(annotation: GalleryItemStatusObject) {
    combineLatest([
      this.gallerySelectionService.selectedGalleryItems$,
      this.gallerySelectionService.selectedItem$,
      this.gallerySelectionService.isMultipleSelectionActive$,
      this._chartEditorService.activeTab$
    ])
      .pipe(
        first(),
        map(([selectedGalleryItems, selectedItem, isMultipleSelectionActive, activeTab]) =>
          isMultipleSelectionActive
            ? { items: Array.from(selectedGalleryItems).map(item => item.name), activeTab }
            : { items: [selectedItem!.name], activeTab }
        ),
        switchMap(({ items, activeTab }) =>
          forkJoin(
            items.map(item =>
              this._annotationsService.writeAnnotationForDataset$(
                activeTab!.databaseType,
                activeTab!.dataSourceId as string,
                activeTab!.dataset as string,
                new Date(item).getTime(),
                annotation.key
              )
            )
          )
        )
      )
      .subscribe(() => {
        this.gallerySelectionService.inactivateMultipleSelection();
      });
  }

  deleteAnnotation(timestamp: string, label: string) {
    this._chartEditorService.activeTab$
      .pipe(
        first(),
        switchMap(activeTab =>
          this._annotationsService.deleteAnnotation$(
            activeTab!.databaseType,
            activeTab!.dataSourceId as string,
            activeTab!.dataset as string,
            +timestamp,
            label
          )
        )
      )
      .subscribe();
  }

  onPage(page: number) {
    this._galleryPaginationService.selectPage(page);
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
  }
}
