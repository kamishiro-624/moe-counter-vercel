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

  const scale = theme === 'kamishiro' ? 2 : 1
  const spacing = theme === 'kamishiro' ? 0.35 : 1

  // This is not the greatest way for generating an SVG but it'll do for now
  const countArray = count.toString().padStart(length, '0').split('')

  let x = 0, y = 0, width = 0
  const parts = countArray.reduce((acc, next, index) => {
    const { width: imageWidth, height, data } = themeList[theme][next]

    const image = `${acc}
      <image x="${x}" y="0" width="${imageWidth}" height="${height}" xlink:href="${data}" />`

    width = Math.max(width, x + imageWidth)
    x += imageWidth * spacing

    if(height > y) y = height

    return image
  }, '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width * scale}" height="${y * scale}" viewBox="0 0 ${width} ${y}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="image-rendering: pixelated;">
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
