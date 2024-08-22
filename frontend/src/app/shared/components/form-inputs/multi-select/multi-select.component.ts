import { Component, forwardRef, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListItem, toListItem } from '@shared/models';

import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

// eslint-disable-next-line
type ListInputValue = ListItem<any> | string;
@Component({
  selector: 'app-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => MultiSelectComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => MultiSelectComponent),
    },
  ],
})
export class MultiSelectComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() set list(value: ListInputValue[]) {
    if (!value) return;

    if ((value[0] as ListItem)?.name !== undefined) {
      // eslint-disable-next-line
      this.itemsList = value as ListItem<any>[];
    } else {
      this.itemsList = value.map(item => toListItem(item));
    }

    if (!this.itemsList.length) return;

    // if value is presented BEFORE the list
    if (this.itemsList.find(item => (this.control.value || []).includes(item.value))) {
      this.control.updateValueAndValidity();
    } 
  }

  // eslint-disable-next-line
  itemsList: ListItem<any>[] = [];
  @Input() allowAll = true;
  @Input() loading = false;

  searchControl = new FormControl(null);
  selectedItems: ListItem[] = [];

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer,
  ) {
    super(controlContainer);
  }

  ngOnInit(): void {
    this._setSimpleControl();
    this.control.valueChanges.subscribe(items => {
      this.selectedItems = this.itemsList.filter(listItem =>
        (items || []).includes(listItem.value),
      );
    });

    this.control.updateValueAndValidity();
  }

  isItemChosen(item: ListItem) {
    return (this.control.value as string[]).find(chosenItem => chosenItem === item.value);
  }

  addAllItems() {
    this.control.setValue(
      this.control.value.length === this.itemsList.length
        ? []
        : this.itemsList.map(item => item.value),
    );
  }

  addItem(item: ListItem) {
    this.control.setValue([...(this.control.value || []), item.value]);
  }

  removeItem(item: ListItem) {
    this.control.setValue(
      ((this.control.value as string[]) || []).filter(chosenItem => chosenItem !== item.value),
    );
  }
}
