export const dateToSeconds = (date: string | number) => {
  return Math.floor(new Date(date).getTime() / 1000);
};
