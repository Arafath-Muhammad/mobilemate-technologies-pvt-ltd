/**
 * numbers_to_words.js
 * Simple English number-to-words converter tailored for cheque amounts.
 * Exposes:
 *  - numberToWords(number) -> 'One hundred twenty-three'
 *  - amountToChequeWords(amount, opts) -> 'One hundred twenty-three and 45/100 only'
 */
(function () {
    'use strict';

    const SMALL = ['zero','one','two','three','four','five','six','seven','eight','nine'];
    const TEENS = ['ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
    const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
    const SCALE = ['','thousand','million','billion','trillion'];

    function chunkToWords(n){
        let words = [];
        n = Number(n);
        let hadHundreds = false;
        if(n >= 100){
            words.push(SMALL[Math.floor(n/100)] + ' hundred');
            n = n % 100;
            hadHundreds = true;
        }
        let rem = '';
        if(n >= 20){
            rem = TENS[Math.floor(n/10)] + (n%10 ? '-' + SMALL[n%10] : '');
        } else if(n >= 10){
            rem = TEENS[n-10];
        } else if(n > 0){
            rem = SMALL[n];
        }
        if(rem){
            if(hadHundreds) rem = 'and ' + rem;
            words.push(rem);
        } else if(!words.length){
            // zero
            words.push(SMALL[0]);
        }
        return words.join(' ');
    }

    function numberToWords(num){
        if(num === null || num === undefined || num === '') return '';
        if(typeof num === 'string'){
            num = num.replace(/[,\s]/g,'');
        }
        num = Number(num);
        if(Number.isNaN(num)) return '';
        if(num === 0) return 'zero';
        if(num < 0) return 'minus ' + numberToWords(Math.abs(num));

        let parts = [];
        let scaleIndex = 0;
        while(num > 0){
            const chunk = num % 1000;
            if(chunk){
                const chunkWords = chunkToWords(chunk);
                parts.unshift((chunkWords + (SCALE[scaleIndex] ? ' ' + SCALE[scaleIndex] : '')).trim());
            }
            num = Math.floor(num / 1000);
            scaleIndex++;
        }
        return parts.join(' ').replace(/\s+/g,' ').trim();
    }

    /**
     * amountToChequeWords(1234.56) -> "One thousand two hundred thirty-four and 56/100 only"
     * opts: {currencyName: '', includeOnlySuffix: true}
     */
    function amountToChequeWords(amount, opts){
        opts = opts || {};
        if(typeof amount === 'string') amount = amount.replace(/[,\s]/g,'');
        amount = Number(amount);
        if(Number.isNaN(amount)) return '';
        const rounded = Math.round(Math.abs(amount) * 100) / 100;
        const integer = Math.floor(rounded);
        const cents = Math.round((rounded - integer) * 100);
        const integerWords = numberToWords(integer);
        const centsStr = String(cents).padStart(2,'0');
        const sign = amount < 0 ? 'minus ' : '';
        const currency = opts.currencyName ? ' ' + opts.currencyName : '';
        const only = opts.includeOnlySuffix === false ? '' : ' only';
        const main = integer === 0 ? 'zero' : integerWords;
        if(cents === 0){
            // When there are no cents, return simple wording without cents fraction
            return (sign + capitalize(main) + currency + only).trim();
        }
        // Typical cheque format when cents exist: "One thousand two hundred thirty-four and 56/100"
        return (sign + capitalize(main) + currency + ' and ' + centsStr + '/100' + only).trim();
    }

    function capitalize(str){
        if(!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Expose
    window.NumberToWords = {
        numberToWords: numberToWords,
        amountToChequeWords: amountToChequeWords
    };

})();
