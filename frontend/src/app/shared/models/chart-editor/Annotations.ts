export interface Annotation {
  display_name: string;
  sub_categories: { [key: string]: Annotation };
}

export interface Annotations {
  [key: string]: Annotation;
}

export const ANNOTATION_TAG = 'annotation_tag';
export interface SavedAnnotation {
  time: number;
  [ANNOTATION_TAG]: string;
}

export enum AnnotationTagEnum {
  NO_DEFECT = 'no_defect',
  DEFECT = 'defect',
}

export const ANNOTATION_TAGS = [AnnotationTagEnum.NO_DEFECT, AnnotationTagEnum.DEFECT] as const;
export type AnnotationTag = (typeof ANNOTATION_TAGS)[number];

export interface AnnotationCategory {
  parent?: string | null;
  displayName: string;
  isDefect: boolean;
}
