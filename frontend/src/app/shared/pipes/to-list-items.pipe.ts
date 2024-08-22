import { Pipe, PipeTransform } from '@angular/core';
import { ListItem } from '@shared/models';

@Pipe({
  name: 'toListItems',
})
export class ToListItemsPipe implements PipeTransform {
  transform(
    array: any[],
    options?: { pathValue?: string[]; translatePreName?: string },
  ): ListItem[] {
    return array.reduce((acc: ListItem[], item) => {
      const property = options?.pathValue
        ? this.toJson(this.getObjectProperty(item, options?.pathValue))
        : item;
      if (property && !acc.some(item => item.value === (property.value || property))) {
        acc.push(
          property.value
            ? property
            : {
                name: options?.translatePreName + '' + property,
                value: property,
              },
        );
      }

      return acc;
    }, []);
  }

  getObjectProperty(item: { [key: string]: any }, path: string[]) {
    return path.reduce((acc, part) => (acc ? acc[part] : item[part]) || '', '' as any);
  }

  toJson(prop: any) {
    return typeof prop === 'object' ? JSON.stringify(prop) : prop;
  }
}
