import { ValidatorFn, Validators } from '@angular/forms';

export function createUrlValidator(): ValidatorFn {
  // Regex now allows dashes in the domain and subdomains parts but not as the starting or ending character.
  const reg = /^http:\/\/[\w-]+(\.[\w-]+)*(:[0-9]+)?\/?$/;
  return Validators.pattern(reg);
}
