import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-delete-confirmation-modal',
  templateUrl: './delete-confirmation-modal.component.html',
  styleUrls: ['./delete-confirmation-modal.component.scss'],
})
export class DeleteConfirmationModalComponent {
  @Input() message = '';

  constructor(private _activeModal: NgbActiveModal) {}

  close() {
    this._activeModal.dismiss();
  }

  submit() {
    this._activeModal.close();
  }
}
