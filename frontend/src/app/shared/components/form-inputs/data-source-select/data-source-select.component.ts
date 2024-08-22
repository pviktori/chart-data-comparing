import { Component, Host, OnInit, Optional, SkipSelf, forwardRef } from '@angular/core';
import { CustomValueAccessorComponent } from '../custom-value-accessor.component';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DataSource } from '@shared/models';
import { Observable, map } from 'rxjs';
import { DataSourcesService } from '@shared/services';

@Component({
  selector: 'app-data-source-select',
  templateUrl: './data-source-select.component.html',
  styleUrls: ['./data-source-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => DataSourceSelectComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => DataSourceSelectComponent),
    },
  ],
})
export class DataSourceSelectComponent extends CustomValueAccessorComponent implements OnInit {
  dataSources$!: Observable<DataSource[] | null>;

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer,
    private _dataSourcesService: DataSourcesService,
  ) {
    super(controlContainer);
  }

  ngOnInit(): void {
    this.dataSources$ = this._dataSourcesService.dataSources$.pipe(
      map(response => Object.values(response || {}).flat()),
    );
    this._setSimpleControl();
  }
}
