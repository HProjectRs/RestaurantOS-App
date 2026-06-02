const RTL_LANGUAGES = ['ar', 'arabic'];

export function isRTL(lang) {
  return RTL_LANGUAGES.includes(lang?.toLowerCase());
}

export function getDirection(lang) {
  return isRTL(lang) ? 'rtl' : 'ltr';
}

export function rtlClassName(lang) {
  return isRTL(lang) ? 'rtl' : '';
}

export function flipValue(ltr, rtl) {
  return (dir) => (dir === 'rtl' ? rtl : ltr);
}
