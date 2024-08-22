import { Component, Host, Input, OnInit, Optional, SkipSelf, forwardRef } from '@angular/core';
import { CustomValueAccessorComponent } from '../custom-value-accessor.component';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-file-dropzone',
  templateUrl: './file-dropzone.component.html',
  styleUrls: ['./file-dropzone.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => FileDropzoneComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => FileDropzoneComponent),
    },
  ],
})
export class FileDropzoneComponent extends CustomValueAccessorComponent implements OnInit {
  @Input() acceptExtensions: string[] = [];
  isDragging = false;

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer,
  ) {
    super(controlContainer);
  }

  ngOnInit(): void {
    this._setSimpleControl();
  }

  onFileSelected(file: File) {
    if (file && this.acceptExtensions.includes(file.type)) {
      this.control.markAsTouched();
      this.control.setValue(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileSelected(files[0]);
    }
  }

  removeFile() {
    this.control.setValue(null);
  }
}
