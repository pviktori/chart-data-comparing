import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-doughnut-chart',
  templateUrl: './doughnut-chart.component.html',
  styleUrls: ['./doughnut-chart.component.scss'],
})
export class DoughnutChartComponent implements OnInit, AfterViewInit {
  @Input() totalNumber = 100;
  @Input() set currentData(value: number) {
    this._currentData = value;
    this.updateChart();
  }
  @Input() label = '';

  chart!: Chart<'doughnut'>;
  backgroundChart!: Chart<'doughnut'>;

  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLCanvasElement>;
  @ViewChild('backgroundChartContainer') backgroundChartContainer!: ElementRef<HTMLCanvasElement>;

  get currentData() {
    return this._currentData;
  }

  private _currentData = 0;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createBackgroundChart();
    this.updateChart();
  }

  updateChart() {
    if (!this.chart || !this.chart.canvas) {
      this.createChart();
      return;
    }

    this.chart.data.datasets = this._getDatasets();
    this.chart.update();
  }

  createChart() {
    if(!this.chartContainer) return;
    
    this.chart = new Chart(this.chartContainer?.nativeElement, {
      data: {
        datasets: this._getDatasets(),
        labels: [this.label],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: 50,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
      },
    } as ChartConfiguration<'doughnut'>);
  }

  createBackgroundChart() {
    this.backgroundChart = new Chart(this.backgroundChartContainer?.nativeElement, {
      data: {
        datasets: [
          {
            data: [100],
            label: '',
            backgroundColor: ['#DADBDE'],
            borderRadius: 0,
            borderWidth: 0,
            type: 'doughnut',
          } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: 50,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
      },
    } as ChartConfiguration<'doughnut'>);
  }

  private _getDatasets() {
    const emptySpace = this.totalNumber - this.currentData;
    return [
      {
        data: [this.currentData, emptySpace],
        label: '',
        backgroundColor: ['rgb(255, 99, 132)', '#00000000'],
        borderRadius: emptySpace ? 10 : 0,
        borderWidth: 0,
        type: 'doughnut',
      } as any,
    ];
  }
}
