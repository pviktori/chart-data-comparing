import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { Setting } from '@shared/models';
import { SettingsService } from '@shared/services';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, catchError, filter, first, of, takeUntil } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  active = 1;
  settingsFormGroup = new FormGroup({});

  settings$: Observable<Setting[]>;
  private _destroyed$ = new Subject<void>();

  constructor(
    private _settingsService: SettingsService,
    private _toaster: ToastrService,
    private _translocoService: TranslocoService,
  ) {
    this.settings$ = this._settingsService.settings$.pipe(takeUntil(this._destroyed$));
    this._settingsService.settings$
      .pipe(
        filter(settings => !!settings.length),
        first(),
      )
      .subscribe(settings => this._initializeFormGroup(settings));
  }

  ngOnInit(): void {
    this._settingsService.loadSettings();
  }

  setActive(n: number) {
    this.active = n;
  }

  updateSetting(id: string) {
    const value = this.settingsFormGroup?.get(id)?.value;
    this._settingsService
      .updateSetting$(id, { value })
      .pipe(catchError(() => of(null)))
      .subscribe(result => {
        if (result)
          this._toaster.success(
            this._translocoService.translate('common.messages.updated_successfully'),
            this._translocoService.translate('common.success') + '!',
          );
        else
          this._toaster.error(
            this._translocoService.translate('common.messages.error_while_processing'),
            this._translocoService.translate('common.error') + '!',
          );
      });
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
  }

  private _initializeFormGroup(settings: Setting[]): void {
    this.settingsFormGroup = settings.reduce((formGroup, setting) => {
      formGroup.addControl(setting.id, new FormControl(setting.value, Validators.required));
      return formGroup;
    }, new FormGroup({}));
  }
}
