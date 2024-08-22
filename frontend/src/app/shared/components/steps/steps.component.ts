import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-steps',
  templateUrl: './steps.component.html',
  styleUrls: ['./steps.component.scss'],
})
export class StepsComponent implements OnInit {
  @Input() step = 0;
  @Input() start = 0;
  @Input() end = 10;
  @Input() disableNext = false;

  @Output() stepChanges = new EventEmitter();

  steps: number[] = [];

  constructor() {}

  ngOnInit(): void {
    this.steps = [
      this.start,
      ...Array(this.end - this.start)
        .fill(1)
        .map((_, i) => this.start + i + 1),
    ];
    this.step = this.step || this.steps[0];
  }

  setStep(nextStep: number) {
    if (this.disableNext) return;
    this.step = nextStep;
    this.stepChanges.emit(nextStep);
  }
}
