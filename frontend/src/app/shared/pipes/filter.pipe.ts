import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform(
    // eslint-disable-next-line
    items: any[],
    // allow multiple filtering by several values
    // eslint-disable-next-line
    ...configs: any[]
    // eslint-disable-next-line
  ): any[] {
    if (!configs || !configs.length || !configs.find(c => c.value)) {
      return items;
    }

    return items.reduce((acc, item) => {
      // count of matched filter config
      let matches = 0;

      // run through filter configs
      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];

        // if no filter value is presented, flag as matched
        if (!config.value) {
          matches += 1;
          continue;
        }

        // get property from current item to filter
        const property = this.getProperty(
          item,
          typeof config.path === 'string' ? [config.path] : config.path,
        );

        if (!property) continue;

        if (
          JSON.stringify(property)
            .toLowerCase()
            .includes(('' + config.value).toLowerCase())
        ) {
          matches += 1;
        }
      }

      // add to result, if ALL filters are fine for current item
      if (matches === configs.length) acc.push(item);

      return acc;
    }, []);
  }

  // eslint-disable-next-line
  getProperty(item: any, paths?: string[]): string[] {
    return paths?.length
      ? paths?.map(path =>
          path
            .split('.')
            // eslint-disable-next-line
            .reduce<string | any>(
              // eslint-disable-next-line
              (acc, cur) => (acc[cur as keyof any] ? acc[cur as keyof any] : {}),
              item,
            ),
        )
      : [item];
  }
}
