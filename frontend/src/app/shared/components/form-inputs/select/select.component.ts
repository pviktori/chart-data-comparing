import { Component, forwardRef, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListItem, toListItem } from '@shared/models';

import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

// eslint-disable-next-line
type ListInputValue = ListItem<any> | string;

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => SelectComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => SelectComponent),
    },
  ],
})
export class SelectComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() set list(value: ListInputValue[]) {
    if (!value) return;

    let itemsList = [];
    if ((value[0] as ListItem)?.name !== undefined) {
      // eslint-disable-next-line
      itemsList = value as ListItem<any>[];
    } else {
      itemsList = value.map(item => toListItem(item));
    }

    // do not rerender if value is the same
    if (JSON.stringify(this.itemsList) !== JSON.stringify(itemsList)) {
      this.itemsList = itemsList;

      // if value is presented BEFORE the list
      if (this.itemsList.find(item => this.control.value === item.value)) {
        this.control.updateValueAndValidity();
      } else this.control.reset(null);
    }
  }
  @Input() mode: 'outline' | 'default' | 'light' = 'default';
  @Input() translate = false;
  @Input() deselectOption = false;
  @Input() loading = false;

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
    this._setSimpleControl();
  }
}
