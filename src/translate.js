const http = require("http");

const allLanguages = [
  "auto",
  "af",
  "sq",
  "am",
  "ar",
  "hy",
  "az",
  "eu",
  "be",
  "bn",
  "bs",
  "bg",
  "ca",
  "ceb",
  "ny",
  "zh-cn",
  "zh-tw",
  "co",
  "hr",
  "cs",
  "da",
  "nl",
  "en",
  "eo",
  "et",
  "tl",
  "fi",
  "fr",
  "fy",
  "gl",
  "ka",
  "de",
  "el",
  "gu",
  "ht",
  "ha",
  "haw",
  "iw",
  "hi",
  "hmn",
  "hu",
  "is",
  "ig",
  "id",
  "ga",
  "it",
  "ja",
  "jw",
  "kn",
  "kk",
  "km",
  "ko",
  "ku",
  "ky",
  "lo",
  "la",
  "lv",
  "lt",
  "lb",
  "mk",
  "mg",
  "ms",
  "ml",
  "mt",
  "mi",
  "mr",
  "mn",
  "my",
  "ne",
  "no",
  "ps",
  "fa",
  "pl",
  "pt",
  "ma",
  "ro",
  "ru",
  "sm",
  "gd",
  "sr",
  "st",
  "sn",
  "sd",
  "si",
  "sk",
  "sl",
  "so",
  "es",
  "su",
  "sw",
  "sv",
  "tg",
  "ta",
  "te",
  "th",
  "tr",
  "uk",
  "ur",
  "uz",
  "vi",
  "cy",
  "xh",
  "yi",
  "yo",
  "zu",
];

let io;

function getTranslateUrl(msg, lang) {
  return (
    "/translate_a/single?client=gtx&sl=auto&tl=" +
    lang +
    "&dt=t&q=" +
    encodeURI(msg)
  );
}

function translate(msg, lang, cb) {
  var options = {
    host: "translate.googleapis.com",
    path: getTranslateUrl(msg, lang),
  };

  var req = http.get(options, function (res) {
    var bodyChunks = [];
    if (res.statusCode === 200) {
      res
        .on("data", function (chunk) {
          bodyChunks.push(chunk);
        })
        .on("end", function () {
          var body = Buffer.concat(bodyChunks);
          var temp = JSON.parse(body.toString());
          cb(temp[0][0][0]);
        });
    } else {
      console.log(res.statusCode);
    }
  });

  req.on("error", function (e) {
    console.log("ERROR: " + e.message);
  });
}

function getRandomLang() {
  return allLanguages[Math.floor(Math.random() * allLanguages.length)];
}

function translateToRandom(msg, cb) {
  translate(msg, getRandomLang(), function (result) {
    console.log(msg, "-->", result);
    io.broadcast("translate", { msg, result });
    cb(result);
  });
}

function recursiveTranslate(msg, totalIterations, cb) {
  if (totalIterations < 1) {
    translate(msg, "de", function (result) {
      console.log("Final: ", result);
      cb(result);
    });
  } else {
    translateToRandom(msg, function (result) {
      recursiveTranslate(result, totalIterations - 1, cb);
    });
  }
}

module.exports = (_io, msg, iterations, cb) => {
  io = _io;
  recursiveTranslate(msg, iterations, cb);
};
