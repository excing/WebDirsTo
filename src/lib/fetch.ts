// fetch proxy
export function request(input: string | URL | globalThis.Request, init?: RequestInit) {
  console.log('fetching', init?.method || 'GET', input);

  return fetch(input, init);
}