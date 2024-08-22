import { Component, forwardRef, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListItem, toListItem } from '@shared/models';
import { debounceTime, distinctUntilChanged, map, Observable, OperatorFunction } from 'rxjs';

import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

// eslint-disable-next-line
type ListInputValue = ListItem<any> | string;
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => SearchComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => SearchComponent),
    },
  ],
})
export class SearchComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() set list(value: ListInputValue[]) {
    if (!value) return;

    if ((value[0] as ListItem)?.name !== undefined) {
      // eslint-disable-next-line
      this.itemsList = value as ListItem<any>[];
    } else {
      this.itemsList = value.map(item => toListItem(item));
    }
  }
  // eslint-disable-next-line
  itemsList: ListItem<any>[] = [];

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer,
  ) {
    super(controlContainer);
  }

  ngOnInit(): void {
    this._setControl();
  }

  formatter = (result: ListItem) => result.name;

  search: OperatorFunction<string, readonly ListItem[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term =>
        this.itemsList
          .filter(
            v =>
              v.value.toLowerCase().indexOf(term.toLowerCase()) > -1 ||
              v.name.toLowerCase().indexOf(term.toLowerCase()) > -1,
          )
          .slice(0, 10),
      ),
    );
}
