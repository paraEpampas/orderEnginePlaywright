const COUNTRIES = {
  UK: {
    accounts: '81039259',
    item1: '3642738',
    item2: 'EP-DG930DWEGWW',
    item3: 'PSM-IPEE-A',
    mapCcPart: '3642738',
    countryName: 'United Kingdom',
    quickAddSearchKeyword: 'laptop',
  },
  US: {
    accounts: '91000376',
    item1: '4290023',
    item2: 'C9200L-24T-4X-A',
    item3: 'C9200L-24T-4X-A',
    mapCcPart: '4249461',
    countryName: 'United States',
    quickAddSearchKeyword: 'laptop',
  },
  DE: {
    accounts: '1114013',
    item1: '599526',
    item2: '210-AJBT',
    item3: 'CZ12X-011000',
    mapCcPart: '3206759',
    countryName: 'Germany',
    quickAddSearchKeyword: 'laptop',
  },
  BE: {
    accounts: '61000315',
    item1: '4128794',
    item2: 'MXYH2ZM/A',
    item3: '5721163',
    mapCcPart: '4129929',
    countryName: 'Belgium',
    quickAddSearchKeyword: 'laptop',
  },
  NL: {
    accounts: '63001051',
    item1: '4146753',
    item2: '407-BBZL',
    item3: '4491894',
    mapCcPart: '4332882',
    countryName: 'Netherlands',
    quickAddSearchKeyword: 'laptop',
  },
  FR: {
    accounts: '51005267',
    item1: '4339804',
    item2: 'MBI1434',
    item3: 'MBI1434',
    mapCcPart: '3505053',
    countryName: 'France',
    quickAddSearchKeyword: 'laptop',
  },
};

const DEFAULT_COUNTRY = (process.env.COUNTRY && process.env.COUNTRY.toUpperCase() !== 'ALL')
  ? process.env.COUNTRY
  : 'UK';

function getCountryConfig(country) {
  const code = (country || DEFAULT_COUNTRY).toUpperCase();
  if (code === 'ALL') return getCountryConfig('UK');
  if (!COUNTRIES[code]) throw new Error(`Unknown country code: ${code}`);
  return { code, ...COUNTRIES[code] };
}

module.exports = { COUNTRIES, DEFAULT_COUNTRY, getCountryConfig };
