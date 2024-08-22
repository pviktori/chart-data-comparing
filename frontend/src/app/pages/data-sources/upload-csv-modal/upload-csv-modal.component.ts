import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataSourcesDetailsService } from '@shared/services';
import { catchError, map, of } from 'rxjs';

@Component({
  selector: 'app-upload-csv-modal',
  templateUrl: './upload-csv-modal.component.html',
  styleUrls: ['./upload-csv-modal.component.scss'],
})
export class UploadCsvModalComponent {
  dsFileUploadGroup = new FormGroup({
    dataSource: new FormControl(null, [Validators.required]),
    file: new FormControl(null, [Validators.required]),
  });
  isUploaded = false;
  isProcessing = false;
  isLoading = false;
  samplesCount = 0;
  constructor(
    private _activeModal: NgbActiveModal,
    private _dataSourcesDetailsService: DataSourcesDetailsService,
  ) {}

  submit() {
    this.isProcessing = true;
    this.isLoading = true;
    const { dataSource, file } = this.dsFileUploadGroup.value;
    this._dataSourcesDetailsService
      .uploadDataSourceCsv(dataSource.type, dataSource.id, file)
      .subscribe(result => {
        this.isLoading = false;
        this.isUploaded = !result.error;
        this.samplesCount = result.count || 0;
      });
  }

  dismiss() {
    this._activeModal.dismiss();
  }

  close() {
    this._activeModal.close();
  }

  resetFormGroup() {
    this.isProcessing = false;
    this.dsFileUploadGroup.reset({
      dataSource: null,
      file: null,
    });
  }
}
