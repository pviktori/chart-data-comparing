import { Component, forwardRef, Host, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { JsonEditorOptions } from '@maaxgr/ang-jsoneditor';

import { CustomValueAccessorComponent } from '../custom-value-accessor.component';

@Component({
  selector: 'app-json-editor',
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => JsonEditorComponent),
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => JsonEditorComponent),
    },
  ],
})
export class JsonEditorComponent extends CustomValueAccessorComponent implements OnInit {
  editorOptions!: JsonEditorOptions;

  constructor(
    @Optional()
    @Host()
    @SkipSelf()
    private controlContainer: ControlContainer,
  ) {
    super(controlContainer);

    this.editorOptions = new JsonEditorOptions();
    this.editorOptions.mode = 'code';
    this.editorOptions.mainMenuBar = false;
    this.editorOptions.navigationBar = false;
    this.editorOptions.statusBar = false;
  }

  ngOnInit(): void {
    this._setControl();
  }
}
