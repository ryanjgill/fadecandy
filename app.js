'use strict'

const FadeCandy = require('./dist/FadeCandy')
const chalk = require('chalk')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const appTitle = 'FadeCandy NeoPixels'
const io = require('socket.io')(server)
const cors = require('cors')

let fadeCandyReady = false

server.listen(3000)

app.locals.appTitle = appTitle
app.use(cors())
app.set('view engine', 'pug')
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.render('index')
})

io.on('connection', socket => {
  console.log(socket.id)
  socket.on('newColor', data => {
    if (fadeCandyReady) {
      killIntervals()
      allSameColor(0, 8, data.color)
    }
  })

  socket.on('chargeUp', data => {
    if (fadeCandyReady) {
      killIntervals()
      chargeUp(0, 8, data.color)
    }
  })
})

let INTERVAL_1
let INTERVAL_2
let ASC
let ARC
let RESET_1
let RESET_2
let RESET_3

let fc = new FadeCandy()

function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

function getRandomColor() {
  return [getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255)]
}

fc.on(FadeCandy.events.READY, () => {
  console.log('FadeCandy.events.READY')
  // see the config schema
  console.log(fc.Configuration.schema)
  // create default color look up table
  fc.clut.create()
  // set fadecandy led to manual mode
  fc.config.set(fc.Configuration.schema.LED_MODE, 1)
  // blink that led
  let state = false
  setInterval(() => {
    state = !state
    fc.config.set(fc.Configuration.schema.LED_STATUS, +state)
  }, 500)
})

fc.on(FadeCandy.events.COLOR_LUT_READY, () => {
  console.log('FaceCandy says color lut ready')
  fadeCandyReady = true

  let frame = 0
  let pixels = 8

  chargeUp(frame, pixels)
})

function chargeUp(frame, pixels, _color) {
  let randomColor = () => {
    return [
      getRandomInt(1, 255),
      getRandomInt(1, 255),
      getRandomInt(1, 255)
    ]
  }

  let color = _color ? _color : randomColor()
  let data = new Uint8Array(pixels * 3)

  INTERVAL_1 = setInterval(() => {
    // delay filling of bar
    let randomInt = Math.random()

    if (randomInt < 0.24) {
      //data = data ? data.slice(0, data.length-3) : []
      fc.send(data)
      console.log(chalk.red(randomInt))
      return
    }

    console.log(chalk.green(randomInt))

    for (let pixel = 0; pixel < pixels; pixel++) {
      if (frame % pixels == pixel) {
        let i = 3 * pixel
        data[i] = color[0]
        data[i + 1] = color[1]
        data[i + 2] = color[2]
      }
    }
    fc.send(data)
    frame++

    if (frame % pixels === 0) {
      reset()
    }

  }, 1000 / 21 * 3)
}

function allSameColor(frame, pixels, _color) {
  let randomColor = () => {
    return [
      getRandomInt(1, 255),
      getRandomInt(1, 255),
      getRandomInt(1, 255)
    ]
  }

  let color = _color ? _color : randomColor()
  let data = []

  for (let pixel = 0; pixel < pixels; pixel++) {
    data.push(color[0])
    data.push(color[1])
    data.push(color[2])
  }

  ASC = setInterval(() => {
    fc.send(data)
    frame++

  }, 1000 / 60)
}

function allRandomColor(_frame, pixels, _color) {
  let randomColor = () => {
    return [
      getRandomInt(1, 255),
      getRandomInt(1, 255),
      getRandomInt(1, 255)
    ]
  }

  let color = _color ? _color : randomColor()
  let data = []
  let frame = _frame ? _frame : 0

  for (let pixel = 0; pixel < pixels; pixel++) {
    data.push(color[0])
    data.push(color[1])
    data.push(color[2])
  }

  ARC = setInterval(() => {
    if (frame > 20) {
      console.log('pick New Color!')
      resetARC(0, pixels)
      return
    }

    fc.send(data)
    frame++

  }, 1000 / 60)
}

function resetARC(frame, pixels) {
  killIntervals()
  allRandomColor(frame, pixels)
}

function clearStrip(pixels) {
  fc.send(new Uint8Array(pixels * 3));
}

function reset() {
  killIntervals()

  RESET_1 = setTimeout(() => {
    clearStrip(8);
  }, 1000)

  RESET_2 = setTimeout(() => {
    baseAnimationReversed(0, 8)
  }, 2000)

  RESET_3 = setTimeout(() => {
    killIntervals()
    chargeUp(0, 8)
  }, 6000)
}

function baseAnimationReversed(frame, pixels) {
  let randomColor = [
    getRandomInt(1, 255),
    getRandomInt(1, 255),
    getRandomInt(1, 255)
  ]

  let color = randomColor

  INTERVAL_2 = setInterval(() => {

    let data = new Uint8Array(pixels * 3)

    for (let pixel = 0; pixel < pixels; pixel++) {
      if (frame % pixels == pixel) {
        let n = Math.abs(7 - pixel)
        //let i = 3 * pixel
        let i = 3 * n
        data[i] = color[0]
        data[i + 1] = color[1]
        data[i + 2] = color[2]
      }
    }
    fc.send(data)
    frame++

    let trips = pixels * 4

    if (frame % trips === 0) {
      clearInterval(INTERVAL_2)
      clearStrip(pixels)
    }

  }, 1000 / 21)
}

function killIntervals() {
  let intervals = [
    INTERVAL_1,
    INTERVAL_2,
    ASC,
    ARC,
    RESET_1,
    RESET_2,
    RESET_3
  ]

  intervals.forEach(function (interval) {
    clearInterval(interval)
  })
}

console.log('up and running on 3000')