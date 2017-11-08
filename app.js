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
let __intervals = []

// SET TOTAL PIXELS HERE
let TOTAL_PIXELS = 64

let CURRENT_PIXEL_COUNT = TOTAL_PIXELS
let CURRENT_COLOR = [63,81,181]
let FRAME = 0

server.listen(3000)

app.locals.appTitle = appTitle
app.use(cors())
app.set('view engine', 'pug')
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.render('index', { 
    startingColor: CURRENT_COLOR, 
    totalPixels: TOTAL_PIXELS
  })
})

io.on('connection', socket => {
  console.log(socket.id)

  socket.emit('newColor', CURRENT_COLOR)
  socket.emit('pixelCount', CURRENT_PIXEL_COUNT)

  socket.on('newColor', data => {
    if (fadeCandyReady) {
      killIntervals()
      allSameColor(0, CURRENT_PIXEL_COUNT, data.color)
    }

    CURRENT_COLOR = data.color
    socket.broadcast.emit('newColor', data.color)
  })

  socket.on('chargeUp', data => {
    if (fadeCandyReady) {
      killIntervals()
      chargeUp(0, CURRENT_PIXEL_COUNT, data.color)
    }
  })

  socket.on('turnOff', data => {
    if (fadeCandyReady) {
      killIntervals()
      clearStrip(CURRENT_PIXEL_COUNT);
      socket.broadcast.emit('turnOff')
    }
  })

  socket.on('pixelCount', data => {
    CURRENT_PIXEL_COUNT = data.pixelCount
    socket.broadcast.emit('pixelCount', CURRENT_PIXEL_COUNT)

    if (fadeCandyReady) {
      killIntervals()
      
      clearStrip(CURRENT_PIXEL_COUNT)
      allSameColor(0, CURRENT_PIXEL_COUNT, data.color)      
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
  //console.log(fc.Configuration.schema)
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

  let frame = FRAME

  chargeUp(frame, CURRENT_PIXEL_COUNT, CURRENT_COLOR)
})

function chargeUp(frame, pixels, _color) {
  let randomColor = () => {
    return [
      getRandomInt(1, 255),
      getRandomInt(1, 255),
      getRandomInt(1, 255)
    ]
  }

  let color = _color && _color.toString() != '0,0,0' ? _color : randomColor()
  let data = new Uint8Array(pixels * 3)

  CURRENT_COLOR = color
  io.sockets.emit('newColor', CURRENT_COLOR)

  let intervalId = setInterval(() => {
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

  __intervals.push(intervalId)
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

  CURRENT_COLOR =color
  io.sockets.emit('newColor', color)

  for (let pixel = 0; pixel < pixels; pixel++) {
    data.push(color[0])
    data.push(color[1])
    data.push(color[2])
  }

  let intervalId = setInterval(() => {
    fc.send(data)
    frame++

  }, 1000 / 60)

  __intervals.push(intervalId)
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
  let frame = _frame ? _frame : FRAME

  for (let pixel = 0; pixel < pixels; pixel++) {
    data.push(color[0])
    data.push(color[1])
    data.push(color[2])
  }

  let intervalId = setInterval(() => {
    if (frame > 20) {
      resetARC(0, pixels)
      return
    }

    fc.send(data)
    frame++

  }, 1000 / 60)

  __intervals.push(intervalId)
}

function resetARC(frame, pixels) {
  killIntervals()
  allRandomColor(frame, pixels)
}

function clearStrip(pixels) {
  fc.send(new Uint8Array(pixels * 3));
  CURRENT_COLOR = [0, 0, 0]
  io.sockets.emit('newColor', CURRENT_COLOR)
}

function reset() {
  killIntervals()

  let intervalId = setTimeout(() => {
    clearStrip(CURRENT_PIXEL_COUNT);
  }, 1000)

  let intervalId2 = setTimeout(() => {
    baseAnimationReversed(0, CURRENT_PIXEL_COUNT)
  }, 2000)

  let intervalId3 = setTimeout(() => {
    killIntervals()
    chargeUp(0, CURRENT_PIXEL_COUNT)
  }, 6000)

  __intervals.push(intervalId)
  __intervals.push(intervalId2)
  __intervals.push(intervalId3)
}

function baseAnimationReversed(frame, pixels) {
  let randomColor = [
    getRandomInt(1, 255),
    getRandomInt(1, 255),
    getRandomInt(1, 255)
  ]

  let color = randomColor
  CURRENT_COLOR = color
  io.sockets.emit('newColor', CURRENT_COLOR)

  let intervalId = setInterval(() => {

    let data = new Uint8Array(pixels * 3)

    for (let pixel = 0; pixel < pixels; pixel++) {
      if (frame % pixels == pixel) {
        let n = Math.abs(CURRENT_PIXEL_COUNT -1  - pixel)
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
      killIntervals()
      clearStrip(pixels)
    }

  }, 1000 / 21)

  __intervals.push(intervalId)
}

function killIntervals() {
  __intervals.reduce((out, intervalId) => {
    clearInterval(intervalId)
    return out
  }, [])
}

console.log('up and running on 3000')