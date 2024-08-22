export const ANNOTATION_TAG = 'annotation_tag';
export const ANNOTATIONS_DATASET = 'annotations';

export interface DataPointDto {
  feature: string;
  value: any;
}

export interface AnnotationDto {
  time?: number;
  [ANNOTATION_TAG]: string;
}
