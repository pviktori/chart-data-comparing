import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  closed = false;
  routes: { name: string; value: string; icon: string }[] = [
    {
      name: 'sidebar.charts',
      value: '/chart-editor',
      icon: 'poll'
    },
    {
      name: 'sidebar.settings',
      value: '/settings',
      icon: 'settings'
    },
    {
      name: 'sidebar.data_sources',
      value: '/data-sources',
      icon: 'account_tree'
    }
  ];

  constructor() {}

  ngOnInit(): void {}
}
