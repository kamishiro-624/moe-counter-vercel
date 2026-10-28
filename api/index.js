'use strict'

const fs = require('fs')
const express = require('express')

const db = require('../db/mongodb')
const themify = require('../utils/themify')

let PLACES = parseInt(process.env.VIEW_LEN)
PLACES >= 5 && PLACES <= 18 ? NaN : PLACES = 7

const app = express()

// get the image
app.get('/get/@:name', async (req, res) => {
  const { name } = req.params
  const { theme = 'moebooru' } = req.query
  let length = PLACES

  // This helps with GitHub's image cache 
  res.set({
    'content-type': 'image/svg+xml',
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  const data = await getCountByName(name)

  if (name === 'demo') {
    res.set({
      'cache-control': 'max-age=31536000'
    })
    length = 10
  }

  // Send the generated SVG as the result
  const renderSvg = themify.getCountImage({ count: data.num, theme, length })
  res.send(renderSvg)

  console.log(data, `theme: ${theme}`, `ref: ${req.get('Referrer') || null}`, `ua: ${req.get('User-Agent') || null}`)
})

// JSON record
app.get('/record/@:name', async (req, res) => {
  const { name } = req.params

  const data = await getCountByName(name)

  res.json(data)
})

app.get('/heart-beat', (req, res) => {
  res.set({
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  res.send('alive')
  console.log('heart-beat')
});

app.get('*', function (req, res){
  res.send('<p>404</p>');
});

const port = process.env.PORT || 3001;
const listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

async function getCountByName(name) {
  const defaultCount = { name, num: 0 }

  if (name === 'demo') return { name, num: '0123456789' }

  try {
    const counter = await db.getNum(name) || defaultCount
    const newNum = counter.num + 1

    await db.setNum(name, newNum)

    return { name, num: newNum }

  } catch (error) {
    console.log("get count by name is error: ", error)
    return defaultCount
  }
}