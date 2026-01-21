const { createCanvas, loadImage } = require('canvas');

const DEFAULTS = {
  width: 1024,
  height: 1536, // 2:3
  imageBoxSizeRatio: 0.78, // okno ~1:1
  imageBoxTopRatio: 0.12,
  titleFont: 'bold 54px Arial',
  artistFont: 'normal 40px Arial',
  titleColor: '#ffffff',
  artistColor: '#ffffff',
  textMaxWidthRatio: 0.82
};

function drawImageCover(ctx, image, x, y, width, height) {
  const iw = image.width;
  const ih = image.height;
  const scale = Math.max(width / iw, height / ih);
  const sw = Math.round(width / scale);
  const sh = Math.round(height / scale);
  const sx = Math.round((iw - sw) / 2);
  const sy = Math.round((ih - sh) / 2);
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function truncateText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = '...';
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + ellipsis;
}

async function composeSpotifyFrame(baseImageBuffer, options = {}) {
  const width = options.width || DEFAULTS.width;
  const height = options.height || DEFAULTS.height;
  const overlayUrl = options.overlayUrl;
  const title = (options.title || '').trim();
  const artist = (options.artist || '').trim();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Tlo pozostaje przezroczyste - nie wypelniamy canvasu.

  const imageBoxSize = Math.round(width * DEFAULTS.imageBoxSizeRatio);
  const imageBoxX = Math.round((width - imageBoxSize) / 2);
  const imageBoxY = Math.round(height * DEFAULTS.imageBoxTopRatio);

  const baseImage = await loadImage(baseImageBuffer);
  drawImageCover(ctx, baseImage, imageBoxX, imageBoxY, imageBoxSize, imageBoxSize);

  if (overlayUrl) {
    const overlayImage = await loadImage(overlayUrl);
    ctx.drawImage(overlayImage, 0, 0, width, height);
  }

  const textMaxWidth = Math.round(width * DEFAULTS.textMaxWidthRatio);
  const titleY = imageBoxY + imageBoxSize + Math.round(height * 0.08);
  const artistY = titleY + Math.round(height * 0.05);

  if (title) {
    ctx.font = DEFAULTS.titleFont;
    ctx.fillStyle = DEFAULTS.titleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(truncateText(ctx, title, textMaxWidth), width / 2, titleY);
  }

  if (artist) {
    ctx.font = DEFAULTS.artistFont;
    ctx.fillStyle = DEFAULTS.artistColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(truncateText(ctx, artist, textMaxWidth), width / 2, artistY);
  }

  return canvas.toBuffer('image/png');
}

module.exports = {
  composeSpotifyFrame
};
