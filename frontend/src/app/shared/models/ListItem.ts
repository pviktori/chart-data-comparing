export interface ListItem<T = string> {
  name: string;
  value: T;
}

// eslint-disable-next-line
export const toListItem = (target: any, nameProp?: string, valueProp?: string) => {
  return {
    name: nameProp ? target[nameProp] : target,
    value: valueProp ? target[valueProp] : target,
  };
};
