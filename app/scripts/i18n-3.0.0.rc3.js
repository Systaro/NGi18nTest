// I18n.js
// =======
//
// This small library provides the Rails I18n API on the Javascript.
// You don't actually have to use Rails (or even Ruby) to use I18n.js.
// Just make sure you export all translations in an object like this:
//
//     I18n.translations.en = {
//       hello: "Hello World"
//     };
//
// See tests for specific formatting like numbers and dates.
//
;(function(I18n){
  "use strict";

  I18n.reset = function() {
    // Set default locale. This locale will be used when fallback is enabled and
    // the translation doesn't exist in a particular locale.
    this.defaultLocale = "en";

    // Set the current locale to `en`.
    this.locale = "en";

    // Set the translation key separator.
    this.defaultSeparator = ".";

    // Set the placeholder format. Accepts `{{placeholder}}` and `%{placeholder}`.
    this.placeholder = /(?:\{\{|%\{)(.*?)(?:\}\}?)/gm;

    // Set if engine should fallback to the default locale when a translation
    // is missing.
    this.fallbacks = false;

    // Set the default translation object.
    this.translations = {};
  };

  // Return a list of all locales that must be tried before returning the
  // missing translation message. By default, this will consider the inline option,
  // current locale and fallback locale.
  //
  //     I18n.locales.get("de-DE");
  //     // ["de-DE", "de", "en"]
  //
  // You can define custom rules for any locale. Just make sure you return a array
  // containing all locales.
  //
  //     // Default the Wookie locale to English.
  //     I18n.locales["wk"] = function(locale) {
  //       return ["en"];
  //     };
  //
  I18n.locales = {};

  // Retrieve locales based on inline locale, current locale or default to
  // I18n's detection.
  I18n.locales.get = function(locale) {
    var result = this[locale] || this[I18n.locale] || this["default"];

    if (typeof(result) === "function") {
      result = result(locale);
    }

    if (result instanceof Array === false) {
      result = [result];
    }

    return result;
  };

  // The default locale list.
  I18n.locales["default"] = function(locale) {
    var locales = []
      , list = []
      , countryCode
      , count
    ;

    // Handle the inline locale option that can be provided to
    // the `I18n.t` options.
    if (locale) {
      locales.push(locale);
    }

    // Add the current locale to the list.
    if (!locale && I18n.locale) {
      locales.push(I18n.locale);
    }

    // Add the default locale if fallback strategy is enabled.
    if (I18n.fallbacks && I18n.defaultLocale) {
      locales.push(I18n.defaultLocale);
    }

    // Compute each locale with its country code.
    // So this will return an array containing both
    // `de-DE` and `de` locales.
    locales.forEach(function(locale){
      countryCode = locale.split("-")[0];

      if (!~list.indexOf(locale)) {
        list.push(locale);
      }

      if (I18n.fallbacks && countryCode && countryCode !== locale && !~list.indexOf(countryCode)) {
        list.push(countryCode);
      }
    });

    // No locales set? English it is.
    if (!locales.length) {
      locales.push("en");
    }

    return list;
  };

  //
  //
  I18n.pluralization = {};

  // Return the pluralizer for a specific locale.
  // If no specify locale is found, then I18n's default will be used.
  I18n.pluralization.get = function(locale) {
    return this[locale] || this[I18n.locale] || this["default"];
  };

  // The default pluralizer rule.
  // It detects the `zero`, `one`, and `other` scopes.
  I18n.pluralization["default"] = function(count) {
    switch (count) {
      case 0: return ["zero", "other"];
      case 1: return ["one"];
      default: return ["other"];
    }
  };

  // Reset all default attributes. This is specially useful
  // while running tests.
  I18n.reset();

  // Return current locale. If no locale has been set, then
  // the current locale will be the default locale.
  I18n.currentLocale = function() {
    return this.locale || this.defaultLocale;
  };

  // Check if value is different than undefined and null;
  I18n.isSet = function(value) {
    return value !== undefined && value !== null;
  };

  // Find and process the translation using the provided scope and options.
  // This is used internally by some functions and should not be used as an
  // public API.
  I18n.lookup = function(scope, options) {
    options = this.prepareOptions(options);

    var locales = this.locales.get(options.locale)
      , requestedLocale = locales[0]
      , locale
      , scopes
      , translations
    ;

    while (locales.length) {
      locale = locales.shift();
      scopes = scope.split(this.defaultSeparator);
      translations = this.translations[locale];

      if (!translations) {
        continue;
      }

      while (scopes.length) {
        translations = translations[scopes.shift()];

        if (!translations) {
          break;
        }
      }

      if (translations) {
        return translations;
      }
    }

    if (this.isSet(options.defaultValue)) {
      return options.defaultValue;
    }
  };

  // Merge serveral hash options, checking if value is set before
  // overwriting any value. The precedence is from left to right.
  //
  //     I18n.prepareOptions({name: "John Doe"}, {name: "Mary Doe", role: "user"});
  //     #=> {name: "John Doe", role: "user"}
  //
  I18n.prepareOptions = function() {
    var args = Array.prototype.slice.call(arguments)
      , options = {}
    ;

    for (var i = 0, count = args.length; i < count; i++) {
      var o = args.shift();

      if (typeof(o) != "object") {
        continue;
      }

      for (var attr in o) {
        if (!o.hasOwnProperty(attr)) {
          continue;
        }

        if (this.isSet(options[attr])) {
          continue;
        }

        options[attr] = o[attr];
      }
    }

    return options;
  };

  // Translate the given scope with the provided options.
  I18n.translate = function(scope, options) {
    options = this.prepareOptions(options);
    var translation = this.lookup(scope, options);

    if (!translation) {
      return this.missingTranslation(scope);
    }

    if (typeof(translation) === "string") {
      translation = this.interpolate(translation, options);
    } else if (translation instanceof Object && this.isSet(options.count)) {
      translation = this.pluralize(options.count, translation, options);
    }

    return translation;
  };

  // This function interpolates the all variables in the given message.
  I18n.interpolate = function(message, options) {
    options = this.prepareOptions(options);
    var matches = message.match(this.placeholder)
      , placeholder
      , value
      , name
      , regex
    ;

    if (!matches) {
      return message;
    }

    while (matches.length) {
      placeholder = matches.shift();
      name = placeholder.replace(this.placeholder, "$1");
      value = options[name];

      if (!this.isSet(options[name])) {
        value = "[missing " + placeholder + " value]";
      }

      regex = new RegExp(placeholder.replace(/\{/gm, "\\{").replace(/\}/gm, "\\}"));
      message = message.replace(regex, value);
    }

    return message;
  };

  // Pluralize the given scope using the `count` value.
  // The pluralized translation may have other placeholders,
  // which will be retrieved from `options`.
  I18n.pluralize = function(count, scope, options) {
    options = this.prepareOptions(options);
    var translations, pluralizer, keys, key, message;

    if (scope instanceof Object) {
      translations = scope;
    } else {
      translations = this.lookup(scope, options);
    }

    if (!translations) {
      return this.missingTranslation(scope);
    }

    pluralizer = this.pluralization.get(options.locale);
    keys = pluralizer(Math.abs(count));

    while (keys.length) {
      key = keys.shift();

      if (this.isSet(translations[key])) {
        message = translations[key];
        break;
      }
    }

    options.count = String(count);
    return this.interpolate(message, options);
  };

  // Return a missing translation message for the given parameters.
  I18n.missingTranslation = function(scope) {
    var message = '[missing "' + this.currentLocale();

    for (var i = 0; i < arguments.length; i++) {
      message += "." + arguments[i];
    }

    message += '" translation]';

    return message;
  };

  // Format number using localization rules.
  // The options will be retrieved from the `number.format` scope.
  // If this isn't present, then the following options will be used:
  //
  // - `precision`: `3`
  // - `separator`: `"."`
  // - `delimiter`: `","`
  // - `strip_insignificant_zeros`: `false`
  //
  // You can also override these options by providing the `options` argument.
  //
  I18n.toNumber = function(number, options) {
    options = this.prepareOptions(
      options,
      this.lookup("number.format"),
      {precision: 3, separator: ".", delimiter: ",", strip_insignificant_zeros: false}
    );

    var negative = number < 0
      , string = Math.abs(number).toFixed(options.precision).toString()
      , parts = string.split(".")
      , precision
      , buffer = []
      , formattedNumber
    ;

    number = parts[0];
    precision = parts[1];

    while (number.length > 0) {
      buffer.unshift(number.substr(Math.max(0, number.length - 3), 3));
      number = number.substr(0, number.length -3);
    }

    formattedNumber = buffer.join(options.delimiter);

    if (options.strip_insignificant_zeros && precision) {
      precision = precision.replace(/0+$/, "");
    }

    if (options.precision > 0 && precision) {
      formattedNumber += options.separator + precision;
    }

    if (negative) {
      formattedNumber = "-" + formattedNumber;
    }

    return formattedNumber;
  };

  // Format currency with localization rules.
  // The options will be retrieved from the `number.currency.format` and
  // `number.format` scopes, in that order.
  //
  // Any missing option will be retrieved from the `I18n.toNumber` defaults and
  // the following options:
  //
  // - `unit`: `"$"`
  // - `precision`: `2`
  // - `format`: `"%u%n"`
  // - `delimiter`: `","`
  // - `separator`: `"."`
  //
  // You can also override these options by providing the `options` argument.
  //
  I18n.toCurrency = function(number, options) {
    options = this.prepareOptions(
      options,
      this.lookup("number.currency.format"),
      this.lookup("number.format"),
      {unit: "$", precision: 2, format: "%u%n", delimiter: ",", separator: "."}
    );

    number = this.toNumber(number, options);
    number = options.format
      .replace("%u", options.unit)
      .replace("%n", number)
    ;

    return number;
  };

  // Localize several values.
  // You can provide the following scopes: `currency`, `number`, or `percentage`.
  // If you provide a scope that matches the `/^(date|time)/` regular expression
  // then the `value` will be converted by using the `I18n.toTime` function.
  //
  // It will default to the value's `toString` function.
  //
  I18n.localize = function(scope, value) {
    switch (scope) {
      case "currency":
        return this.toCurrency(value);
      case "number":
        scope = this.lookup("number.format");
        return this.toNumber(value, scope);
      case "percentage":
        return this.toPercentage(value);
      default:
        if (scope.match(/^(date|time)/)) {
          return this.toTime(scope, value);
        } else {
          return value.toString();
        }
    }
  };

  // Parse a given `date` string into a JavaScript Date object.
  // This function is time zone aware.
  //
  // The following string formats are recognized:
  //
  //    yyyy-mm-dd
  //    yyyy-mm-dd[ T]hh:mm::ss
  //    yyyy-mm-dd[ T]hh:mm::ss
  //    yyyy-mm-dd[ T]hh:mm::ssZ
  //    yyyy-mm-dd[ T]hh:mm::ss+0000
  //
  I18n.parseDate = function(date) {
    var matches, convertedDate;

    // we have a date, so just return it.
    if (typeof(date) == "object") {
      return date;
    };

    matches = date.toString().match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?(Z|\+0000)?/);

    if (matches) {
      for (var i = 1; i <= 6; i++) {
        matches[i] = parseInt(matches[i], 10) || 0;
      }

      // month starts on 0
      matches[2] -= 1;

      if (matches[7]) {
        convertedDate = new Date(Date.UTC(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6]));
      } else {
        convertedDate = new Date(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6]);
      }
    } else if (typeof(date) == "number") {
      // UNIX timestamp
      convertedDate = new Date();
      convertedDate.setTime(date);
    } else if (date.match(/\d+ \d+:\d+:\d+ [+-]\d+ \d+/)) {
      // a valid javascript format with timezone info
      convertedDate = new Date();
      convertedDate.setTime(Date.parse(date))
    } else {
      // an arbitrary javascript string
      convertedDate = new Date();
      convertedDate.setTime(Date.parse(date));
    }

    return convertedDate;
  };

  // Formats time according to the directives in the given format string.
  // The directives are surrounded by {} character. Any text not listed as a
  // directive will be passed through to the output string.
  //
  // The accepted formats are:
  //
  //     {dddd} - The full name of the day of the week
  //     {ddd}  - The abbreviated name of the day of the week
  //     {dd}   - The day of the month, from 01 through 31
  //     {d}    - The day of the month, from 1 through 31
  //     {MMMM} - The full name of the month
  //     {MMM}  - The abbreviated name of the month
  //     {MM}   - The month, from 01 through 12
  //     {M}    - The month, from 1 through 12
  //     {yyyy} - The year as a four-digit number
  //     {yyy}  - The year, with a minimum of three digits
  //     {yy}   - The year, from 00 to 99
  //     {y}    - The year as a four-digit number
  //     {hh}   - The hour, using a 12-hour clock from 01 to 12
  //     {h}    - The hour, using a 12-hour clock from 1 to 12
  //     {HH}   - The hour, using a 24-hour clock from 00 to 23
  //     {H}    - The hour, using a 24-hour clock from 0 to 23
  //     {mm}   - The minute, from 00 through 59
  //     {m}    - The minute, from 0 through 59
  //     {ss}   - The second, from 00 through 59
  //     {s}    - The second, from 0 through 59
  //     {tt}   - The AM/PM designator
  //     {t}    - The first character of the AM/PM designator
  //     {z}    - The Timezone offset
  //     {w}    - Day of the week (Sunday is 0, 0..6)
  //
  I18n.strftime = function(date, format) {
    var options = this.lookup("date");

    var formatOptions = this.lookup('date.format.' + format);

    format = (formatOptions ? formatOptions : format)

    if (!options) {
      options = {
          day_names: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        , abbr_day_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        , month_names: [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        , abbr_month_names: [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      }
    }

    if (!options.meridian) {
      options.meridian = ["AM", "PM"];
    }

    var weekDay = date.getDay()
      , day = date.getDate()
      , year = date.getFullYear()
      , month = date.getMonth() + 1
      , hour = date.getHours()
      , hour12 = hour
      , meridian = hour > 11 ? 1 : 0
      , secs = date.getSeconds()
      , mins = date.getMinutes()
      , offset = date.getTimezoneOffset()
      , absOffsetHours = Math.floor(Math.abs(offset / 60))
      , absOffsetMinutes = Math.abs(offset) - (absOffsetHours * 60)
      , timezoneoffset = (offset > 0 ? "-" : "+") + (absOffsetHours.toString().length < 2 ? "0" + absOffsetHours : absOffsetHours) + (absOffsetMinutes.toString().length < 2 ? "0" + absOffsetMinutes : absOffsetMinutes)
    ;

    if (hour12 > 12) {
      hour12 = hour12 - 12;
    } else if (hour12 === 0) {
      hour12 = 12;
    }

    var padding = function(n) {
      var s = "0" + n.toString();
      return s.substr(s.length - 2);
    };

    format = format.replace(/{w}/gi, weekDay);

    format = format.replace(/{dddd}/gi, options.day_names[weekDay]);            // The full name of the day of the week.
    format = format.replace(/{ddd}/gi,  options.abbr_day_names[weekDay]);       // The abbreviated name of the day of the week.
    format = format.replace(/{dd}/gi,   padding(day));                          // The day of the month, from 01 through 31.
    format = format.replace(/{d}/gi,    day);                                   // The day of the month, from 1 through 31.

    format = format.replace(/{MMMM}/gi, options.month_names[month]);            // The full name of the month
    format = format.replace(/{MMM}/gi,  options.abbr_month_names[month]);       // The abbreviated name of the month.
    format = format.replace(/{MM}/gi,   padding(month));                        // The month, from 01 through 12.
    format = format.replace(/{M}/gi,    month);                                 // The month, from 1 through 12.


    format = format.replace(/{yyyy}/gi, year);                                  // The year as a four-digit number.
    format = format.replace(/{yyy}/gi,  padding(year));                         // The year, with a minimum of three digits.
    format = format.replace(/{yy}/gi,   padding(year).replace(/^0+/, ""));      // The year, from 00 to 99.
    format = format.replace(/{y}/gi,    year);                                  // The year as a four-digit number.

    format = format.replace(/{hh}/gi,   padding(hour12));                       // The hour, using a 12-hour clock from 01 to 12.
    format = format.replace(/{h}/gi,    hour12);                                // The hour, using a 12-hour clock from 1 to 12.

    format = format.replace(/{HH}/gi,   padding(hour))                          // The hour, using a 24-hour clock from 00 to 23.
    format = format.replace(/{H}/gi,    hour);                                  // The hour, using a 24-hour clock from 0 to 23.

    format = format.replace(/{mm}/gi,   padding(mins));                         // The minute, from 00 through 59.
    format = format.replace(/{m}/gi,    mins);                                  // The minute, from 0 through 59.

    format = format.replace(/{ss}/gi,   padding(secs));                         // The second, from 00 through 59.
    format = format.replace(/{s}/gi,    secs);                                  // The second, from 0 through 59.

    format = format.replace(/{tt}/gi,   options.meridian[meridian]);            // The AM/PM designator.
    format = format.replace(/{t}/gi,    options.meridian[meridian].charAt(0));         // The first character of the AM/PM designator.

    format = format.replace(/{z}/gi,   timezoneoffset);                         // The Timezone offset.

    return (format ? format : date);
  };

  //
  //
  I18n.toTime = function(scope, d) {
    var date = this.parseDate(d)
      , format = this.lookup(scope)
    ;

    if (date.toString().match(/invalid/i)) {
      return date.toString();
    }

    if (!format) {
      return date.toString();
    }

    return this.strftime(date, format);
  };

  //
  //
  I18n.toPercentage = function(number, options) {
    options = this.prepareOptions(
      options,
      this.lookup("number.percentage.format"),
      this.lookup("number.format"),
      {precision: 3, separator: ".", delimiter: ""}
    );

    number = this.toNumber(number, options);
    return number + "%";
  };

  //
  //
  I18n.toHumanSize = function(number, options) {
    var kb = 1024
      , size = number
      , iterations = 0
      , unit
      , precision
    ;

    while (size >= kb && iterations < 4) {
      size = size / kb;
      iterations += 1;
    }

    if (iterations === 0) {
      unit = this.t("number.human.storage_units.units.byte", {count: size});
      precision = 0;
    } else {
      unit = this.t("number.human.storage_units.units." + [null, "kb", "mb", "gb", "tb"][iterations]);
      precision = (size - Math.floor(size) === 0) ? 0 : 1;
    }

    options = this.prepareOptions(
      options,
      {precision: precision, format: "%n%u", delimiter: ""}
    );

    number = this.toNumber(size, options);
    number = options.format
      .replace("%u", unit)
      .replace("%n", number)
    ;

    return number;
  };

  // Set aliases, so we can save some typing.
  I18n.t = I18n.translate;
  I18n.l = I18n.localize;
  I18n.p = I18n.pluralize;
})(typeof(exports) === "undefined" ? this["I18n"] = {} : exports);
