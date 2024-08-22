import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService } from '@ngneat/transloco';
import { map, Observable, tap } from 'rxjs';

import { DeleteConfirmationModalComponent } from '@shared/components';
import { DatabaseNames, DataSourceCommonForm, ListItem } from '@shared/models';
import { DataSourcesService } from '@shared/services';
import { AddDataSourceModalComponent } from './add-data-source-modal/add-data-source-modal.component';
import { UploadCsvModalComponent } from './upload-csv-modal/upload-csv-modal.component';

@Component({
  selector: 'app-data-sources',
  templateUrl: './data-sources.component.html',
  styleUrls: ['./data-sources.component.scss'],
})
export class DataSourcesComponent implements OnInit {
  dataSources$!: Observable<DataSourceCommonForm[]>;
  databaseNames = DatabaseNames;

  testedDataSources: { [key: string]: boolean } = {};

  filtersForm!: FormGroup;

  get filtersFormValues() {
    return this.filtersForm.value;
  }

  constructor(
    private _dataSourcesService: DataSourcesService,
    private _fb: FormBuilder,
    private _modalService: NgbModal,
    private _translocoService: TranslocoService,
  ) {}

  ngOnInit(): void {
    this._getDataSources();
    this._buildForm();
  }

  getDataSourcesPropertyFilterList(
    dataSources: DataSourceCommonForm[],
    property: keyof DataSourceCommonForm,
  ): ListItem[] {
    return [...new Set(dataSources.map(ds => ds[property]))].map(value => ({
      name: typeof value === 'string' ? value : JSON.stringify(value),
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));
  }

  openCreateModal(dataSource?: DataSourceCommonForm) {
    const modal = this._modalService.open(AddDataSourceModalComponent, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      centered: true,
    });

    if (dataSource) {
      modal.componentInstance.prepareEditMode();
      modal.shown.subscribe(() => {
        modal.componentInstance.setUpEditModeFor(dataSource);
      });
    }
  }

  openUploadCsvFileModal() {
    this._modalService.open(UploadCsvModalComponent, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'md',
      centered: true,
    });
  }

  openDeleteConfirmationModal(dataSource: DataSourceCommonForm) {
    const modal = this._modalService.open(DeleteConfirmationModalComponent, {
      size: 'md',
      centered: true,
    });

    modal.componentInstance.message = this._translocoService.translate(
      'common.modal.delete.subject_message',
      { value: dataSource.name },
    );

    modal.closed.subscribe(() => {
      this._dataSourcesService.deleteDataSource(dataSource.type, dataSource.id);
    });
  }

  private _getDataSources() {
    this.dataSources$ = this._dataSourcesService.dataSources$.pipe(
      tap(values => {
        if (!values) this._dataSourcesService.getDataSources();
      }),
      map(values =>
        Object.values(values || {})
          .flat()
          .map(ds => this._dataSourcesService.getDataSourceCommonForm(ds)),
      ),
    );
  }

  private _buildForm() {
    this.filtersForm = this._fb.group({
      title: '',
      type: '',
      url: '',
      table: '',
    });
  }
}
