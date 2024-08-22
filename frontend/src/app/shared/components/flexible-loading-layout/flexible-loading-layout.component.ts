import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-flexible-loading-layout',
  templateUrl: './flexible-loading-layout.component.html',
  styleUrls: ['./flexible-loading-layout.component.scss']
})
export class FlexibleLoadingLayoutComponent implements OnInit {
  @Input() message = '';

  constructor() {}

  ngOnInit(): void {}
}
