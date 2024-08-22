import {
  Component,
  EventEmitter,
  forwardRef,
  Host,
  Input,
  OnInit,
  Optional,
  Output,
  SkipSelf,
  ViewChild,
} from '@angular/core';
import {
  ControlContainer,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { NgbDate, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { NgbTime } from '@ng-bootstrap/ng-bootstrap/timepicker/ngb-time';

import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

@Component({
  selector: 'app-select-date',
  templateUrl: './select-date.component.html',
  styleUrls: ['./select-date.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => SelectDateComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => SelectDateComponent),
    },
  ],
})
export class SelectDateComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() mode: 'outline' | 'default' | 'light' = 'default';

  dateForm!: FormGroup;
  hoveredDate: NgbDate | null = null;

  @Output() activateDateRange = new EventEmitter<boolean>();

  @ViewChild('datepicker') datepicker!: NgbInputDatepicker;

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer,
    private _fb: FormBuilder,
  ) {
    super(controlContainer);
  }

  get fromDateControl(): FormControl {
    return this.dateForm.get('startDate') as FormControl;
  }

  get toDateControl(): FormControl {
    return this.dateForm.get('endDate') as FormControl;
  }

  ngOnInit(): void {
    this._setSimpleControl();
    this._buildForm();
    this._watchTime();
  }

  clear() {
    this.fromDateControl.reset(null);
    this.toDateControl.reset(null);
    this.control.reset(null);
  }

  save() {
    this.datepicker.close();
    const fromDateValue = this.fromDateControl.value as NgbDate | null;
    const toDateValue = this.toDateControl.value as NgbDate | null;

    if (
      fromDateValue?.day !== null &&
      toDateValue?.day !== null &&
      this.dateForm.get('endTime')?.valid
    ) {
      const fromTimeValue = this.dateForm.get('startTime')?.value as NgbTime | null;
      const toTimeValue = this.dateForm.get('endTime')?.value as NgbTime | null;

      this.control.setValue({
        from: new Date(
          `${fromDateValue?.month}.${fromDateValue?.day}.${fromDateValue?.year} ${
            fromTimeValue?.hour || 0
          }:${fromTimeValue?.minute || 0}:${fromTimeValue?.second || 0}`,
        ).toISOString(),
        to: new Date(
          `${toDateValue?.month}.${toDateValue?.day}.${toDateValue?.year} ${
            toTimeValue?.hour || 0
          }:${toTimeValue?.minute || 0}:${toTimeValue?.second || 0}`,
        ).toISOString(),
      });
    } else {
      this.control.reset(null);
      this.clear();
    }
  }

  isHovered(date: NgbDate) {
    const fromDate = this.fromDateControl.value as NgbDate;
    const toDate = this.toDateControl.value as NgbDate;
    return (
      fromDate &&
      !toDate &&
      this.hoveredDate &&
      date.after(fromDate) &&
      date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    if (!this.fromDateControl?.value) {
      return false;
    }

    const fromDate = this.fromDateControl.value as NgbDate;
    const toDate = this.toDateControl.value as NgbDate;

    return (
      (toDate && date.after(fromDate) && date.before(toDate)) ||
      this.isStartDate(date) ||
      this.isEndDate(date) ||
      (!toDate && date.before(this.hoveredDate) && date.after(fromDate))
    );
  }

  isRange(date: NgbDate) {
    return this.isStartDate(date) || this.isEndDate(date);
  }

  isStartDate(date: NgbDate) {
    const fromDate = this.fromDateControl.value as NgbDate;
    return date.equals(fromDate);
  }

  isEndDate(date: NgbDate) {
    const toDate = this.toDateControl.value as NgbDate;
    return date.equals(toDate);
  }

  onDateSelection(date: NgbDate) {
    const fromDate = this.fromDateControl.value as NgbDate;
    const toDate = this.toDateControl.value as NgbDate;
    if (!fromDate && !toDate) {
      this.fromDateControl.setValue(date);
    } else if (fromDate && !toDate && date.after(fromDate)) {
      this.toDateControl.setValue(date);
    } else {
      this.toDateControl.setValue(null);
      this.fromDateControl.setValue(date);
    }
  }

  closed() {
    this.activateDateRange.emit(false);
  }

  triggerCalendar() {
    this.datepicker.toggle();
    this.activateDateRange.emit(this.datepicker.isOpen());
  }

  private _buildForm() {
    this.dateForm = this._fb.group({
      endDate: null,
      endTime: null,
      startDate: null,
      startTime: null,
    });

    // update inside controls on control change
    this.control.valueChanges.subscribe(value => {
      const fromDate = new Date(value?.from);
      const toDate = new Date(value?.to);
      const endDate: NgbDate = new NgbDate(
        fromDate.getFullYear(),
        fromDate.getMonth() + 1,
        fromDate.getDate(),
      );
      const endTime = {
        hour: toDate.getHours(),
        minute: toDate.getMinutes(),
        second: toDate.getSeconds(),
      };

      const startDate: NgbDate = new NgbDate(
        fromDate.getFullYear(),
        fromDate.getMonth() + 1,
        fromDate.getDate(),
      );
      const startTime = {
        hour: fromDate.getHours(),
        minute: fromDate.getMinutes(),
        second: fromDate.getSeconds(),
      };

      this.dateForm.setValue({
        endDate,
        endTime,
        startDate,
        startTime,
      });
    });
  }

  private _watchTime() {
    const endTimeControl = this.dateForm.get('endTime');

    endTimeControl?.setValidators(control => {
      const endTime = control.value;
      const startDateControl = this.dateForm.get('startDate');
      const endDateControl = this.dateForm.get('endDate');
      const startTimeControl = this.dateForm.get('startTime');

      const startDate = startDateControl?.value as NgbDate;
      const endDate = endDateControl?.value as NgbDate;
      const startTime = startTimeControl?.value as NgbTime;

      if (
        startDate?.day === endDate?.day &&
        startDate?.month === endDate?.month &&
        startDate?.year === endDate?.year
      ) {
        const earlyHour = endTime?.hour < startTime?.hour;
        const earlyMinute =
          endTime?.hour === startTime?.hour && endTime?.minute < startTime?.minute;
        const earlySecond =
          endTime?.hour === startTime?.hour &&
          endTime?.minute === startTime?.minute &&
          endTime?.second < startTime?.second;
        if (earlyHour || earlyMinute || earlySecond) {
          return { tooEarly: true };
        }
      }
      return null;
    });

    this.dateForm.get('endDate')?.valueChanges.subscribe(() => {
      endTimeControl?.updateValueAndValidity();
    });
    this.dateForm.get('startTime')?.valueChanges.subscribe(() => {
      endTimeControl?.updateValueAndValidity();
    });
  }
}
