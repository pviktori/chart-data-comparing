import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlContainer, ControlValueAccessor, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  template: '',
})
export class CustomValueAccessorComponent implements ControlValueAccessor {
  @Input() formControlName!: string;
  @Input() formControl!: FormControl;
  @Input() placeholder = '';

  control = new FormControl(null);
  protected _control!: FormControl;

  get controlValid(): boolean {
    return (this._control || this.control).touched ? (this._control || this.control).valid : true;
  }

  @Output() changed = new EventEmitter();

  constructor(protected _controlContainer: ControlContainer) {}

  // eslint-disable-next-line
  protected _setControl(defaultValue?: any) {
    // set control based on provided formControlName or formControl
    this._control =
      (this._controlContainer?.control?.get(this.formControlName) as FormControl) ??
      this.formControl ??
      new FormControl(defaultValue || null);
    this.control.setValue(this._control.value, { emitEvent: false });

    if (this._control.disabled) this.control.disable();
    // watch if there are any changes outside
    this._control?.valueChanges.subscribe(v => {
      if (JSON.stringify(v) !== JSON.stringify(this.control.value)) {
        this.control.setValue(v);
      }
    });

    // wait 500ms to set value to avoid unnecessary update
    this.control.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(value => {
      if (JSON.stringify(value) !== JSON.stringify(this._control.value)) {
        this._control.setValue(value);
        if (!this._control?.touched) this._control?.markAsTouched();
      }

      // custom hendling control change
      this.changed.emit(value);
    });
  }

  protected _setSimpleControl() {
    this.control =
      (this._controlContainer?.control?.get([this.formControlName]) as FormControl) ??
      this.formControl ??
      new FormControl(null);

    this.control.valueChanges.subscribe(value => {
      this.changed.emit(value);
    });
  }

  // --- ControlValueAccessor essential methods

  writeValue(): void {}

  validate() {
    return null;
  }

  registerOnValidatorChange?(fn: () => void): void {
    this._onChange = fn;
  }
  registerOnChange(fn: () => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouch = fn;
  }
  protected _onChange: () => void = () => {};
  protected _onTouch: () => void = () => {};
}
