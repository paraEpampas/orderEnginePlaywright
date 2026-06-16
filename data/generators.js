function randomAlphanumeric(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function randomDigits(len = 6) {
  let result = '';
  for (let i = 0; i < len; i++) result += Math.floor(Math.random() * 10);
  return result;
}

function randomLetters(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Anderson'];

function randomFirstName() { return pickRandom(FIRST_NAMES); }
function randomLastName() { return pickRandom(LAST_NAMES); }
function randomFullName() { return `${randomFirstName()} ${randomLastName()}`; }
function randomEmail() { return `AutoTest_${randomFirstName().toLowerCase()}.${randomLastName().toLowerCase()}${randomDigits(3)}@test.com`; }
function randomPhoneNumber() { return `+44${randomDigits(10)}`; }

function randomCustomerOrderRef() { return `AutoTest_COR_${randomAlphanumeric(8)}`; }
function randomMessageReference() { return `AutoTest_MSG_${randomDigits(10)}_${Date.now()}`; }
function randomOrderDescription() { return `AutoTest Order ${randomAlphanumeric(6)}`; }

function randomDate(minYear = 2025, maxYear = 2027) {
  const year = minYear + Math.floor(Math.random() * (maxYear - minYear + 1));
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

function randomFutureDate() {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 90) + 7);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArray(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function takeRandom(arr, n) { return shuffleArray(arr).slice(0, n); }

module.exports = {
  randomAlphanumeric, randomDigits, randomLetters,
  randomFirstName, randomLastName, randomFullName, randomEmail, randomPhoneNumber,
  randomCustomerOrderRef, randomMessageReference, randomOrderDescription,
  randomDate, randomFutureDate,
  pickRandom, shuffleArray, takeRandom,
};
