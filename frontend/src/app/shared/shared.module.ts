import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngJsoneditorModule } from '@maaxgr/ang-jsoneditor';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbTimepickerModule,
  NgbTypeaheadModule
} from '@ng-bootstrap/ng-bootstrap';

import { TranslocoRootModule } from '../transloco-root.module';
import {
  CheckboxComponent,
  InputComponent,
  JsonEditorComponent,
  LoadingLayoutComponent,
  MultiSelectComponent,
  RangeComponent,
  SearchComponent,
  SelectComponent,
  SelectDateComponent,
  SidebarComponent,
  StepsComponent,
  SwitchComponent,
  TextareaComponent,
  MultivalueCheckboxComponent,
  LineChartComponent,
  DoughnutChartComponent,
  SelectDatabaseComponent,
  FileDropzoneComponent,
  DataSourceSelectComponent,
  FlexibleLoadingLayoutComponent
} from './components';
import { DeleteConfirmationModalComponent } from './components/modals';
import { FilterPipe, ToListItemsPipe, ToFixedPipe } from './pipes';

const components = [
  SidebarComponent,
  InputComponent,
  LoadingLayoutComponent,
  SelectComponent,
  RangeComponent,
  SelectDateComponent,
  SwitchComponent,
  CheckboxComponent,
  SearchComponent,
  MultiSelectComponent,
  TextareaComponent,
  StepsComponent,
  JsonEditorComponent,
  DeleteConfirmationModalComponent,
  MultivalueCheckboxComponent,
  LineChartComponent,
  DoughnutChartComponent,
  SelectDatabaseComponent,
  FileDropzoneComponent,
  DataSourceSelectComponent,
  FlexibleLoadingLayoutComponent
];
const pipes = [FilterPipe, ToListItemsPipe, ToFixedPipe];

@NgModule({
  declarations: [...components, ...pipes],
  imports: [
    CommonModule,
    RouterModule,
    TranslocoRootModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgbTimepickerModule,
    NgbTypeaheadModule,
    NgbDropdownModule,
    NgbModalModule,
    AngJsoneditorModule
  ],
  exports: [...components, ...pipes, ToFixedPipe]
})
export class SharedModule {}
