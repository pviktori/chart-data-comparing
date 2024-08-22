import { Component, forwardRef, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListItem } from '@shared/models';
import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

@Component({
  selector: 'app-multivalue-checkbox',
  templateUrl: './multivalue-checkbox.component.html',
  styleUrls: ['./multivalue-checkbox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => MultivalueCheckboxComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => MultivalueCheckboxComponent),
    },
  ],
})
export class MultivalueCheckboxComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() list: ListItem<boolean | string | number>[] = [];
  @Input() multicolor?: string = 'gray';

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

  nextValue() {
    let result = 0;
    const currIndex = this.list.findIndex(item => item.value === this.control?.value.value);

    if (currIndex != -1 && currIndex < this.list.length - 1) result = currIndex + 1;

    this.control?.setValue(this.list[result]);
  }
}
