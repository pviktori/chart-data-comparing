import { Injectable } from '@angular/core';
import { ApiService } from './api.abstract.service';
import { HttpClient } from '@angular/common/http';
import {
  ANNOTATION_TAG,
  Annotation,
  AnnotationCategory,
  AnnotationTag,
  AnnotationTagEnum,
  Annotations,
  DatabaseUnit,
  SavedAnnotation,
  SessionDataRequest
} from '@shared/models';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';

const ANNOTATION_CATEGORIES_TREE: Annotations = {
  no_defect: {
    display_name: 'No Defect',
    sub_categories: {}
  },
  defect: {
    display_name: 'Defect',
    sub_categories: {
      type_a: {
        display_name: 'Type A',
        sub_categories: {}
      },
      type_b: {
        display_name: 'Type B',
        sub_categories: {}
      }
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class AnnotationsService extends ApiService {
  private _periodicAnnotations$ = new BehaviorSubject<SavedAnnotation[]>([]);

  readonly annotationTree: Annotations = { ...ANNOTATION_CATEGORIES_TREE };
  readonly annotationCategories = this._flattenCategories(ANNOTATION_CATEGORIES_TREE);

  get periodicAnnotations$() {
    return this._periodicAnnotations$.asObservable();
  }

  constructor(private _http: HttpClient) {
    super('data-sources-details');
  }

  getDefectAnnotationCategories(label: AnnotationTag) {
    return this._getChildrenKeys(label);
  }

  isAnnotationDefect(annotationTag: string): boolean {
    return this._getChildrenKeys('defect').includes(annotationTag);
  }

  setPeriodicAnnotations(annotations: SavedAnnotation[]) {
    const currValue = this._periodicAnnotations$.getValue();
    this._periodicAnnotations$.next([...currValue, ...annotations]);
  }

  resetPeriodicAnnotations(annotations: SavedAnnotation[]) {
    this._periodicAnnotations$.next(annotations);
  }

  clearPeriodicAnnotations(label: AnnotationTag, timeFrame?: { start: number; stop: number }) {
    const currValue = this._periodicAnnotations$.getValue();
    const tags = this._getChildrenKeys(label);

    this._periodicAnnotations$.next(
      currValue.filter(
        item =>
          !(
            tags.includes(item[ANNOTATION_TAG]) &&
            (timeFrame ? item.time < timeFrame.stop && item.time >= timeFrame.start : true)
          )
      )
    );
  }

  deletePeriodicAnnotation(timestamp: number) {
    const currValue = this._periodicAnnotations$.getValue();

    this._periodicAnnotations$.next(currValue.filter(a => a.time !== timestamp));
  }

  writeAnnotationForDataset$(
    dsType: DatabaseUnit,
    id: string,
    dataset: string,
    timestamp: number,
    label: string
  ): Observable<SavedAnnotation> {
    const oldValue = this._periodicAnnotations$.value.find(({ time }) => time === timestamp);
    const obs$: Observable<void | null> = oldValue
      ? this.deleteAnnotation$(dsType, id, dataset, oldValue.time, oldValue[ANNOTATION_TAG])
      : of(null);

    return obs$.pipe(
      switchMap(() =>
        this._http.post<SavedAnnotation>(this.getUrl(dsType, id, 'annotate'), {
          dataset,
          timestamp,
          label
        })
      ),
      tap(annotation => {
        this.setPeriodicAnnotations([annotation]);
      })
    );
  }

  readAnnotationsByDataset$(
    dsType: DatabaseUnit,
    id: string,
    dataset: string,
    params: SessionDataRequest
  ): Observable<SavedAnnotation[]> {
    return this._http
      .get<SavedAnnotation[]>(this.getUrl(dsType, id, 'annotations'), {
        params: {
          dataset,
          start: params.start,
          stop: params.stop!
        }
      })
      .pipe(
        tap(annotations => {
          this.resetPeriodicAnnotations(annotations);
        })
      );
  }

  deleteAnnotation$(
    dsType: DatabaseUnit,
    id: string,
    dataset: string,
    timestamp: number,
    label: string
  ): Observable<void> {
    return this._http
      .delete<void>(this.getUrl(dsType, id, 'annotations'), {
        params: { timestamp, label, dataset }
      })
      .pipe(
        tap(() => {
          this.deletePeriodicAnnotation(timestamp);
        })
      );
  }

  deleteSpecificAnnotation$(
    dsType: DatabaseUnit,
    id: string,
    dataset: string,
    label: AnnotationTag,
    timeFrame: { start: number; stop: number }
  ): Observable<void> {
    const labels = this._getChildrenKeys(label);
    return this._http
      .delete<void>(this.getUrl(dsType, id, 'annotations', 'timeframe'), {
        params: { dataset, start: timeFrame.start, stop: timeFrame.stop, labels } as any
      })
      .pipe(
        tap(() => {
          this.clearPeriodicAnnotations(label, timeFrame);
        })
      );
  }

  private _flattenCategories(
    node: Record<string, Annotation>,
    parent: string | null = null,
    isDefect?: boolean
  ): Record<string, AnnotationCategory> {
    let result: Record<string, AnnotationCategory> = {};
    for (const key in node) {
      result[key] = {
        displayName: node[key].display_name,
        parent,
        isDefect: parent ? isDefect! : key === AnnotationTagEnum.DEFECT
      };
      if (Array.isArray(node[key].sub_categories) === false) {
        Object.assign(
          result,
          this._flattenCategories(
            node[key].sub_categories as Record<string, Annotation>,
            key,
            parent ? isDefect : key === AnnotationTagEnum.DEFECT
          )
        );
      }
    }
    return result;
  }

  private _getChildrenKeys(parentKey: string) {
    let children = [parentKey]; // Start with the parent key

    const recurse = (subCategories: Record<string, Annotation>) => {
      for (const key in subCategories) {
        children.push(key);
        recurse(subCategories[key].sub_categories);
      }
    };

    if (this.annotationTree[parentKey]) {
      recurse(this.annotationTree[parentKey].sub_categories);
    }

    return children;
  }
}
