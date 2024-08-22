import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainComponent } from './main/main.component';
import { ChartEditorComponent } from './chart-editor/chart-editor.component';
import { SettingsComponent } from './settings/settings.component';
import { DataSourcesComponent } from './data-sources/data-sources.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [

      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: 'data-sources',
        component: DataSourcesComponent,
      },
      {
        path: 'chart-editor',
        redirectTo: 'chart-editor/new',
        pathMatch: 'full',
      },
      {
        path: 'chart-editor/:sessionId',
        component: ChartEditorComponent,
      },
      {
        path: '',
        redirectTo: 'chart-editor',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
