const RutUtils = (() => {
  const NON_ZERO_DIGITS_SET = '123456789';
  const DIGITS_SET = '0123456789';

  const RUT_BODY_LENGTH = 8;
  const RUT_FACTORS = [ 2, 3, 4, 5, 6, 7 ];
  const RUT_CHECK_DIGITS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'K', 0 ];

  const getRandomInt = (min, max) => Math.trunc((Math.random() + min) * (max + 1));

  const getRandomChar = (charSet = '') => charSet[getRandomInt(0, charSet.length - 1)];

  const getRutCheckDigit = (rutChars = []) => {
    const sum = rutChars.reduceRight(
        (partialSum, rutChar, i) => {
          const reverseIndex = rutChars.length - i - 1;
          const factor = RUT_FACTORS[reverseIndex % RUT_FACTORS.length];
          const digit = parseInt(rutChar, 10);

          return partialSum + (digit * factor);
        },
        0,
    );

    return RUT_CHECK_DIGITS[11 - (sum % 11)];
  };

  const defaultFormat = { checkDigitSeparator: '-', bodySeparator: '' };

  const getRandomRut = (options = defaultFormat) => {
    const rutChars = Array.from({ length: RUT_BODY_LENGTH }, () => getRandomChar(DIGITS_SET));
    rutChars[0] = getRandomChar(NON_ZERO_DIGITS_SET);
    rutChars.push(getRutCheckDigit(rutChars));

    return formatRut(rutChars.join(''), options);
  };

  const formatRut = (rut, options = defaultFormat) => {
    if (typeof rut !== 'string')
      throw new Error('RUT must be a string');

    if (typeof options.bodySeparator !== 'string')
      options.bodySeparator = '';

    if (typeof options.checkDigitSeparator !== 'string')
      options.checkDigitSeparator = '-';

    // TODO: Strip from input rut everything but digits (0 to 9) and the char 'k' or 'K' and also normalize it to be 'K';

    const rawBody = rut.slice(0, rut.length - 1);
    const rawCheckDigit = rut.slice(-1);

    const formattedBody = Array
        .from(rawBody)
        .reduceRight(
            (output, char, i) => {
              const separator = i > 0 && (i % 3) === 0 ? options.bodySeparator : '';
              return separator + char + output;
            },
            '',
        );

    return formattedBody + options.checkDigitSeparator + rawCheckDigit;
  }

  return {
    getRandomRut,
    formatRut,
    defaultRutFormat: { ...defaultFormat },
  };
})();

const getPageManager = () => {
  const api = {};
  const state = {
    rutListSize: 10,
    rutFormat: RutUtils.defaultRutFormat,
  };

  const copyToClipboard = (content, handler) => {
    const _handler = typeof handler === 'function' ? handler : () => {};
    navigator.clipboard.writeText(content)
        .then(_handler)
        .catch((error) => console.error({ error }));
  }

  const toCopyableOnClick = content => {
    const btn = document.createElement('button');

    btn.classList.add('btn', 'btn-outline-dark', 'my-2', 'd-block');
    btn.style.width = '12rem';
    btn.onclick = (e) => {
      e.preventDefault();
      copyToClipboard(content);
    };
    btn.textContent = content;

    return btn;
  }

  api.init = () => {
    navigator.permissions.query({ name: 'clipboard-write' })
        .then((result) => {
          if (result.state === 'granted' || result.state === 'prompt') {
            api.updateRandomRutList();
          }
        })
        .catch((error) => console.error({ error }));
  }

  api.updateRandomRutList = () => {
    const divRutList = document.querySelector('#rut-list');
    if (divRutList) {
      divRutList.innerHTML = '';

      Array.from({ length: state.rutListSize }, () => RutUtils.getRandomRut(state.rutFormat))
          .map(toCopyableOnClick)
          .forEach(item => divRutList.appendChild(item));
    }
  }

  const btnUpdateRutList = document.querySelector('#btn-update-rut-list');
  if (btnUpdateRutList) {
    btnUpdateRutList.onclick = api.updateRandomRutList;
  }

  return api;
};

document.addEventListener('readystatechange', e => {
  if (document.readyState === 'complete') {
    const PageManager = getPageManager();
    PageManager.init();
  }
});