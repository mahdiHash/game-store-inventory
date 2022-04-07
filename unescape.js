const chars = {
  '&quot;': '"',
  '&#34;': '"',
  '&#x22;': '"',

  '&apos;': "'",
  '&#39;': "'",
  '&#x27;': "'",

  '&amp;': '&',
  '&#38;': '&',
  '&#x26;': '&',

  '&gt;': '>',
  '&#62;': '>',
  '&#x3e;': '>',

  '&lt;': '<',
  '&#60;': '<',
  '&#x3c;': '<',

  '&cent;': '¢',
  '&#162;': '¢',
  '&#xa2;': '¢',

  '&copy;': '©',
  '&#169;': '©',
  '&#xa9;': '©',

  '&euro;': '€',
  '&#8364;': '€',
  '&#x20ac;': '€',

  '&pound;': '£',
  '&#163;': '£',
  '&#xa3;': '£',

  '&reg;': '®',
  '&#174;': '®',
  '&#xae;': '®',

  '&yen;': '¥',
  '&#165;': '¥',
  '&#xa5;': '¥',
};

function unescapeStr (str = '') {
  if (typeof str !== 'string') return str;

  let unicodeChars = Object.keys(chars);

  unicodeChars.forEach((char) => {
    str = str.replaceAll(char, chars[char]);
  });

  return str;
}

module.exports = {
  codes: chars,
  decode: unescapeStr,
}