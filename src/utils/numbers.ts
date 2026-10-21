const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function toArabicDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)])
}

export function fromArabicDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_INDIC_DIGITS.indexOf(digit)))
    .replace(/[^0-9]/g, '')
}

export function formatArabicNumber(value: number, minimumIntegerDigits = 1) {
  return toArabicDigits(String(value).padStart(minimumIntegerDigits, '0'))
}
