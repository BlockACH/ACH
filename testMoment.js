const moment = require('moment');

const inputDateStinrg = '01050801';
const acDateString = `${(parseInt(inputDateStinrg.substring(0, 4), 10) + 1911).toString()}${inputDateStinrg.substring(4, 8)}`;
const previousDate = moment(acDateString, 'YYYYMMDD').add(-1, 'd');
const previousDateString = `${'0'.concat((parseInt(previousDate.format('YYYY'), 10) - 1911).toString())}${previousDate.format('MMDD')}`;
console.log(previousDateString);
