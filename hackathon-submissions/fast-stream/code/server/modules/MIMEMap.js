/**
 * @module MIMEMap
 *
 * @property {Map<string, string>} imageMap
 * @property {Map<string, string>} videoMap
 * @property {Map<string, string>} audioMap
 */

// Setup extension to MIME type mapping for all 3 main media types: Image, Video, Audio
const imageList = [
  ["apng", "image/apng"],
  ["avif", "image/avif"],
  ["gif", "image/gif"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["jfif", "image/jpeg"],
  ["pjpeg", "image/jpeg"],
  ["pjp", "image/jpeg"],
  ["png", "image/png"],
  ["svg", "image/svg"],
  ["webp", "image/webp"],
  ["bmp", "image/bmp"],
  ["ico", "image/x-icon"],
  ["cur", "image/x-icon"],
  ["tif", "image/tiff"],
  ["tiff", "image/tiff"],
];

const videoList = [
  ["3gp", "video/3gpp"],
  ["3g2", "video/3gpp2"],
  ["mpg", "video/mpeg"],
  ["mpeg", "video/mpeg"],
  ["m1v", "video/mpeg"],
  ["mpv", "video/mpeg"],
  ["mp4", "video/mp4"],
  ["ogg", "video/ogg"],
  ["ogv", "video/ogg"],
  ["mov", "video/quicktime"],
  ["webm", "video/webm"],
];

const audioList = [
  ["aac", "audio/aac"],
  ["flac", "audio/flac"],
  ["mp1", "audio/mpeg"],
  ["mp2", "audio/mpeg"],
  ["mp3", "audio/mpeg"],
  ["m1a", "audio/mpeg"],
  ["m2a", "audio/mpeg"],
  ["mpa", "audio/mpeg"],
  ["wav", "audio/wave"],
];

const imageMap = new Map();
const videoMap = new Map();
const audioMap = new Map();

for (let elem of imageList) {
  imageMap.set(elem[0], elem[1]);
}

for (let elem of videoList) {
  videoMap.set(elem[0], elem[1]);
}

for (let elem of audioList) {
  audioMap.set(elem[0], elem[1]);
}

const mappings = {
  imageMap: imageMap,
  videoMap: videoMap,
  audioMap: audioMap,
};

module.exports = mappings;