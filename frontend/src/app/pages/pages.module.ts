import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NgbCarouselModule,
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbNavModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../shared/shared.module';
import { TranslocoRootModule } from '../transloco-root.module';
import { MainComponent } from './main/main.component';
import { PagesRoutingModule } from './pages-routing.module';
import { ChartEditorLineChartComponent } from './chart-editor/chart-editor-line-chart/chart-editor-line-chart.component';
import { ChartEditorComponent } from './chart-editor/chart-editor.component';
import { AddDataSourceModalComponent } from './data-sources/add-data-source-modal/add-data-source-modal.component';
import { SettingsComponent } from './settings/settings.component';
import { MarkdownModule } from 'ngx-markdown';
import { ChartEditorConfigurationFormComponent } from './chart-editor/chart-editor-configuration-form/chart-editor-configuration-form.component';
import { ChartEditorPeriodicViewComponent } from './chart-editor/chart-editor-periodic-view/chart-editor-periodic-view.component';
import { GalleryViewComponent } from './chart-editor/chart-editor-periodic-view/gallery-view/gallery-view.component';
import { GalleryViewItemComponent } from './chart-editor/chart-editor-periodic-view/gallery-view-item/gallery-view-item.component';
import { TopChartComponent } from './chart-editor/chart-editor-periodic-view/top-chart/top-chart.component';
import { UploadCsvModalComponent } from './data-sources/upload-csv-modal/upload-csv-modal.component';
import { DataSourcesComponent } from './data-sources/data-sources.component';

const pages = [
  SettingsComponent,
  ChartEditorComponent,
  MainComponent,
  DataSourcesComponent,
];

@NgModule({
  declarations: [
    ...pages,
    ChartEditorLineChartComponent,
    AddDataSourceModalComponent,
    ChartEditorConfigurationFormComponent,
    ChartEditorPeriodicViewComponent,
    GalleryViewComponent,
    GalleryViewItemComponent,
    TopChartComponent,
    UploadCsvModalComponent,
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    NgbTooltipModule,
    TranslocoRootModule,
    NgbModalModule,
    NgbCollapseModule,
    MarkdownModule,
    NgbCarouselModule,
    NgbNavModule
  ],
  exports: [...pages],
})
export class PagesModule {}
