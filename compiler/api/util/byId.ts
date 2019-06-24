export function byId(a: { id: number } & any, b: { id: number } & any) {
  return a.id > b.id ? 1 : -1;
}
