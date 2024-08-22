import { Component, forwardRef, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => InputComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => InputComponent),
    },
  ],
})
export class InputComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() type = 'text';
  @Input() max!: number;
  @Input() min!: number;
  @Input() step!: number;
  @Input() integerOnly?: boolean = false;
  @Input() useDebounce = false;
  @Input() labelPosition: 'top' | 'start' = 'top';

  @Input() mode: 'outline' | 'default' | 'light' = 'default';

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer,
  ) {
    super(controlContainer);
  }

  ngOnInit(): void {
    if (this.useDebounce) this._setControl();
    else this._setSimpleControl();
  }

  onChange() {
    if (this.integerOnly) {
      this.control.setValue(this.control.value.replace(/\D/g, '') || '');
    }
  }
}
