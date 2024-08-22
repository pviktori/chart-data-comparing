import { Component, forwardRef, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ListItem } from '../../../models';
import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => SwitchComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => SwitchComponent),
    },
  ],
})
export class SwitchComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() list: ListItem<any>[] = [];
  isBoolean = true;
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

    if (!this.list.length) {
      this.list = [
        {
          name: '',
          value: false,
        },
        {
          name: '',
          value: true,
        },
      ];
    } else {
      this.isBoolean = false;
    }
  }

  setValue(item?: ListItem) {
    if (item) this.control.setValue(item.value);
    else this.control.setValue(!this.control.value);
  }
}
