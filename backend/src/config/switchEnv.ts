export function switchEnv<T>(cases: { [key: string]: T }, defaultVal: T): T {
  console.log('process.env.NODE_ENV', process.env.NODE_ENV);

  if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV is required');
  }

  if (Object.prototype.hasOwnProperty.call(cases, process.env.NODE_ENV)) {
    return cases[process.env.NODE_ENV];
  }

  return defaultVal;
}
