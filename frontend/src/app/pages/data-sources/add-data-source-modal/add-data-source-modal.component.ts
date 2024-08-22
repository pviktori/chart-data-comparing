import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService } from '@ngneat/transloco';
import {
  DatabaseCategoryUnit,
  DatabasesInfo,
  DatabaseUnit,
  DataSource,
  ListItem,
  DataSourceConfigs,
  DatabaseConfig,
} from '@shared/models';
import { DatabasesService, DataSourcesService } from '@shared/services';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  catchError,
  filter,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

type KeysDataSource = keyof DataSource;

@Component({
  selector: 'app-add-data-source-modal',
  templateUrl: './add-data-source-modal.component.html',
  styleUrls: ['./add-data-source-modal.component.scss'],
})
export class AddDataSourceModalComponent implements OnInit {
  step: number | null = null;
  mode: 'edit' | 'create' = 'create';
  dataSourceId: string | null = null;
  categories: ListItem<DatabaseCategoryUnit>[] = [];
  databaseNames: ListItem[] = [];
  testPassed = false;
  dataSourceConfigs!: { [key: string]: DatabaseConfig };

  dataSourceForm!: FormGroup;
  databasesFiltersForm!: FormGroup;

  databases$!: Observable<DatabasesInfo | null>;
  loading$ = new BehaviorSubject(false);

  private _destroyed$ = new Subject();

  get dataSourceDto() {
    return this.dataSourceForm.value;
  }

  get allowedToTest() {
    return this.dataSourceForm.valid;
  }

  constructor(
    private _activeModal: NgbActiveModal,
    private _dataSourcesService: DataSourcesService,
    private _databasesService: DatabasesService,
    private _fb: FormBuilder,
    private _translocoService: TranslocoService,
    private _toaster: ToastrService,
  ) {
    this._createDatabasesFiletrs();
  }

  ngOnInit(): void {
    this._createBasicDataSourceForm();
    this._watchDataSourcesDefaultSettings();
    this._setDatabases();
  }

  prepareEditMode() {
    this.mode = 'edit';
  }

  setUpEditModeFor(dataSource: DataSource) {
    this.dataSourceId = dataSource.id;
    this.chooseDatabase(dataSource.type);
    this.setDataSourceForm(dataSource);
  }

  setUpCreateMode() {
    if (this.mode === 'create') {
      this.setStep(1);
    }
  }

  setStep(step: number) {
    this.step = step;
  }

  close() {
    this._activeModal.close();
  }

  keyValueOrig = () => 0;

  chooseDatabase(databaseType: DatabaseUnit) {
    const database = this.databaseNames.find(item => item.value === databaseType);

    if (!database) return;

    this.dataSourceForm.get('type')?.setValue(databaseType);
    this.setStep(2);
  }

  isCategoryAllowed(category: DatabaseCategoryUnit | string) {
    if (!this.databasesFiltersForm.value.category.length) return true;

    return (this.databasesFiltersForm.value.category as DatabaseCategoryUnit[]).find(
      c => c === category,
    );
  }

  submit() {
    const typeFormValue = this.dataSourceForm.get('type')?.value;

    if (this.mode === 'edit' && this.dataSourceId) {
      this._dataSourcesService.updateDataSource(
        typeFormValue,
        this.dataSourceId,
        this.dataSourceDto,
        () => this.close(),
      );
    } else {
      this._dataSourcesService.createDataSource(typeFormValue, this.dataSourceDto, () =>
        this.close(),
      );
    }
  }

  setDataSourceForm(dataSource: DataSource) {
    const configs = dataSource ? this._dataSourcesService.getDataSourceConfigs(dataSource) : {};
    this.dataSourceForm.patchValue({
      name: dataSource.name || '',
      ...configs,
    });
  }

  testConnection() {
    this.loading$.next(true);
    this._dataSourcesService
      .testConnection$(this.dataSourceForm.get('type')?.value, this.dataSourceDto)
      .pipe(
        catchError(() => of(false)),
        tap(() => this.loading$.next(false)),
        takeUntil(this._destroyed$),
      )
      .subscribe(res => {
        this.testPassed = res;
        if (res)
          this._toaster.success(
            this._translocoService.translate('settings.test_success'),
            this._translocoService.translate('common.success') + '!',
          );
        else
          this._toaster.error(
            this._translocoService.translate('settings.test_failed'),
            this._translocoService.translate('common.error') + '!',
          );
      });
  }

  private _setDatabases() {
    this.databases$ = this._databasesService.databases$.pipe(
      takeUntil(this._destroyed$),
      filter(databases => !!databases),
      tap(databases => {
        this.categories = (Object.keys(databases || {}) as DatabaseCategoryUnit[]).map(category => {
          return {
            name: this._translocoService.translate('databases.' + category),
            value: category,
          };
        });

        this.databaseNames = Object.values(databases || {})
          .map(dbsInCategory => {
            return dbsInCategory.map(db => ({
              name: db.name,
              value: db.type,
            }));
          })
          .flat();

        this.setUpCreateMode();
      }),
    );
  }

  private _createDatabasesFiletrs() {
    this.databasesFiltersForm = this._fb.group({
      name: '',
      category: [[]],
    });
  }

  private _createBasicDataSourceForm(dataSource?: DataSource) {
    this.dataSourceForm = this._fb.group({
      name: [dataSource?.name || '', [Validators.required]],
      type: [dataSource?.type || null, [Validators.required]],
    });
  }

  private _watchDataSourcesDefaultSettings() {
    this.dataSourceForm
      .get('type')
      ?.valueChanges.pipe(
        takeUntil(this._destroyed$),
        switchMap((databaseType: DatabaseUnit) =>
          this._databasesService.databasesConfig$.pipe(
            takeUntil(this._destroyed$),
            map(databasesConfig => databasesConfig?.[databaseType as DatabaseUnit]),
          ),
        ),
      )
      .subscribe(databaseConfig => {
        if (!databaseConfig) return;
        if (this.dataSourceConfigs)
          Object.keys(this.dataSourceConfigs).forEach(key => {
            if (key !== 'type' && key !== 'name') this.dataSourceForm.removeControl(key);
          });

        this.dataSourceConfigs = databaseConfig;
        Object.keys(databaseConfig).forEach(key => {
          this.dataSourceForm.addControl(
            key,
            this._fb.control(databaseConfig[key as keyof DataSourceConfigs<DataSource>].default, [
              ...(databaseConfig[key].validators
                ? (databaseConfig[key].validators as (keyof Validators)[])?.map(v => {
                    switch (v) {
                      case 'url':
                        return this._validatorUrl();

                      default:
                        return Validators[v];
                    }
                  })
                : []),
            ]),
          );
        });
      });
  }

  private _validatorUrl(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const url = control.value || '';
      let parsedURL: URL;

      try {
        parsedURL = new URL(url);
      } catch (error) {
        return { invalidURL: url };
      }

      if (!['http:', 'https:'].includes(parsedURL.protocol)) {
        return { invalidProtocol: url };
      }

      return null;
    };
  }
}
