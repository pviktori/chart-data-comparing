import { Component, forwardRef, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

@Component({
  selector: 'app-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => RangeComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => RangeComponent),
    },
  ],
})
export class RangeComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;

  get rangeProgress(): number {
    return +((this.control.value * 100) / this.max).toFixed(2);
  }

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
}
