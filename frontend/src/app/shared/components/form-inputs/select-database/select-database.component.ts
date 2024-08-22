import { Component, forwardRef, Host, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CustomValueAccessorComponent } from '../custom-value-accessor.component';
import { DatabaseNames } from '@shared/models';

@Component({
  selector: 'app-select-database',
  templateUrl: './select-database.component.html',
  styleUrls: ['./select-database.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => SelectDatabaseComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => SelectDatabaseComponent),
    },
  ],
})
export class SelectDatabaseComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() label = 'databases.database';
  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer,
  ) {
    super(controlContainer);
  }

  dataBaseNames = { ...DatabaseNames };

  ngOnInit(): void {
    this._setSimpleControl();
  }
}
