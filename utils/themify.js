'use strict'

const fs = require('fs')
const path = require('path')
const mimeType = require('mime-types')
const sizeOf = require('image-size')

const themePath = path.resolve(__dirname, '../assets/theme')

const themeList = {}

let PLACES = parseInt(process.env.VIEW_LEN)
PLACES >= 5 && PLACES <= 18 ? NaN : PLACES = 7

fs.readdirSync(themePath).forEach(theme => {
  if(!(theme in themeList)) themeList[theme] = {}
  const imgList = fs.readdirSync(path.resolve(themePath, theme))
  imgList.forEach(img => {
    const imgPath = path.resolve(themePath, theme, img)
    const name = path.parse(img).name
    const { width, height } = sizeOf(imgPath)

    themeList[theme][name] = {
      width,
      height,
      data: convertToDatauri(imgPath)
    }
  })
})

function convertToDatauri(path){
  const mime = mimeType.lookup(path)
  const base64 = fs.readFileSync(path).toString('base64')

  return `data:${mime};base64,${base64}`
}

function getCountImage({ count, theme='moebooru', length=PLACES }) {
  if(!(theme in themeList)) theme = 'moebooru'

  const isKamishiroTheme = ['kamishiro', 'kamishiro-2'].includes(theme)
  const scale = isKamishiroTheme ? 2 : 1
  const spacing = isKamishiroTheme ? 0.35 : 1

  // This is not the greatest way for generating an SVG but it'll do for now
  const countArray = count.toString().padStart(length, '0').split('')
  const digitAdjustments = {
    kamishiro: {
      '5': { scale: 1.12 },
      '6': { scale: 1.12 },
      '8': { scale: 1.05, offsetY: 12 },
      '9': { scale: 1.12, offsetY: 12 }
    },
    'kamishiro-2': {
      '1': { offsetY: 12 },
      '2': { scale: 1.4 },
      '3': { offsetY: 12 },
      '4': { scale: 1.2 },
      '5': { scale: 1.12, offsetY: 6 },
      '6': { scale: 1 },
      '8': { scale: 1.18, offsetY: 12 },
      '9': { scale: 1.3 }
    }
  }[theme] || {}

  const digitImages = countArray.map(digit => {
    const image = themeList[theme][digit]
    const adjustment = digitAdjustments[digit] || {}
    const digitScale = adjustment.scale || 1

    return {
      ...image,
      width: image.width * digitScale,
      height: image.height * digitScale,
      advance: image.width * spacing,
      offsetY: adjustment.offsetY || 0
    }
  })

  const y = Math.max(...digitImages.map(image => image.height))
  const minY = Math.min(0, ...digitImages.map(image => y - image.height - image.offsetY))
  const viewHeight = y - minY
  let x = 0, width = 0
  const parts = digitImages.reduce((acc, image) => {
    const imageMarkup = `${acc}
      <image x="${x}" y="${y - image.height - image.offsetY}" width="${image.width}" height="${image.height}" xlink:href="${image.data}" />`

    width = Math.max(width, x + image.width)
    x += image.advance

    return imageMarkup
  }, '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width * scale}" height="${viewHeight * scale}" viewBox="0 ${minY} ${width} ${viewHeight}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="image-rendering: pixelated;">
    <title>Moe Count</title>
    <g>
      ${parts}
    </g>
</svg>
`
}

module.exports = {
  getCountImage
}
