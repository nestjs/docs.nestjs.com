export function base64NunjucksFilter() {
  return {
    name: 'base64',
    process(str: string) {
      return Buffer.from(str).toString('base64');
    },
  };
}
