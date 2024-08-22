import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GalleryItem } from '../models/gallery-item';

@Injectable({
  providedIn: 'root',
})
export class GallerySelectionService {
  private _selectedGalleryItem$ = new BehaviorSubject<GalleryItem | null>(null);
  private _selectedGalleryItems$ = new BehaviorSubject<Set<GalleryItem>>(new Set());
  private _isMultipleSelectionActive$ = new BehaviorSubject<boolean>(false);

  get selectedItem$() {
    return this._selectedGalleryItem$.asObservable();
  }

  get selectedGalleryItems$() {
    return this._selectedGalleryItems$.asObservable();
  }

  get isMultipleSelectionActive$() {
    return this._isMultipleSelectionActive$.asObservable();
  }

  selectGalleryItem(item: GalleryItem) {
    this._selectedGalleryItem$.next(item);
  }

  toggleMultipleSelectionActive() {
    this._isMultipleSelectionActive$.next(!this._isMultipleSelectionActive$.value);
    const set = this._selectedGalleryItems$.value;
    set.clear();
    this._selectedGalleryItems$.next(set);
  }

  inactivateMultipleSelection() {
    this._isMultipleSelectionActive$.next(false);
    const set = this._selectedGalleryItems$.value;
    if (!set.size) return;
    set.clear();
    this._selectedGalleryItems$.next(set);
  }

  onItemsSelectionChange(selected: boolean, galleryItem: GalleryItem) {
    const set = this._selectedGalleryItems$.value;
    if (selected) {
      set.add(galleryItem);
    } else {
      set.delete(galleryItem);
    }
    this._selectedGalleryItems$.next(set);
  }
}
