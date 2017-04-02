'use strict'

const FadeCandy = require('./dist/FadeCandy')
const chalk = require('chalk')

let ACL_INTERVAL = null
let ACL2_INTERVAL = null
let INTERVAL_1 = null
let INTERVAL_2 = null

let fc = new FadeCandy()

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}

function getRandomColor() {
    return [getRandomInt(0,255), getRandomInt(0,255), getRandomInt(0,255)]
}

fc.on(FadeCandy.events.READY, function () {

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

fc.on(FadeCandy.events.COLOR_LUT_READY, function () {
    console.log('FaceCandy says color lut ready')

    let frame = 0
    let pixels = 8

    reset(pixels)

    //chargeUp(0, pixels, '', 1000/4)
    //allColorLights(0,pixels, 1000/4)
    fadeAllLights(0, pixels, getRandomColor(), 1000)
    //chaseDown(0, pixels, [255,0,0], 30)
})

function turnOff() {
    let pixels = 8
    let noColor = [0,0,0]
    let allOff = []

    for(let x=0; x<pixels; x++) {
        allOff.push(noColor)
    }

    killIntervals()

    fc.send([].concat.apply([], allOff))
}

function chargeUp (frame, pixels, color, duration) {
    let _color = color || getRandomColor()
    let _duration = duration || 1000
    let data = new Uint8Array(pixels * 3)

    console.log(`\n${_color}`)

    INTERVAL_1 = setInterval(function () {
        for (let pixel = 0; pixel < pixels; pixel ++) {
            if (frame % pixels == pixel) {
                let i = 3 * pixel
                data[i] = _color[0]
                data[i + 1] = _color[1]
                data[i + 2] = _color[2]
            }
        }
        fc.send(data)
        frame++

        if (frame % (pixels+1) === 0) {
            reset(pixels)
            chargeUp(0, pixels, color, duration)
        }

    }, _duration)
}

function reset (pixels) {
    killIntervals()
    fc.send(new Uint8Array(pixels * 3))
}

function chaseUp (frame, pixels, color, duration) {
    let _color = color || getRandomColor()
    let _duration = duration || 1000/8/2

    killIntervals();

    INTERVAL_1 = setInterval(function () {

        let data = new Uint8Array(pixels * 3)

        for (let pixel = 0; pixel < pixels; pixel ++) {
            if (frame % pixels == pixel) {
                let i = 3 * pixel 
                data[i] = _color[0]
                data[i + 1] = _color[1]
                data[i + 2] = _color[2]
            }
            console.log(`\n${data}`)
        }
        fc.send(data)
        frame++

        if (frame % pixels === 0) {
            chaseDown(0, pixels, [255, 0, 0], _duration)
        }
        
    }, _duration)
}

function chaseDown (frame, pixels, color, duration) {
    let _color = color || getRandomColor()
    let _duration = duration || 1000/8/2

    killIntervals();

    INTERVAL_2 = setInterval(function () {

        let data = new Uint8Array(pixels * 3)

        for (let pixel = 0; pixel < pixels; pixel ++) {
            if (frame % pixels == pixel) {
                let n = Math.abs(7-pixel)
                let i = 3 * n
                data[i] = _color[0]
                data[i + 1] = _color[1]
                data[i + 2] = _color[2]
            }
            console.log(`\n${data}`)
        }
        fc.send(data)
        frame++

        if (frame % pixels === 0) {
            chaseUp(0, pixels, [0, 0, 255], _duration)
        }
        
    }, _duration)
}

function allColorLights(frame, pixels, duration) {
    let _duration = duration || 1000/8
    ACL_INTERVAL = setInterval(function () {
        if (frame % pixels === 0) {
            let data = new Uint8Array(pixels * 3)
            let min = 1
            let max = 255

            for (let pixel = 0; pixel < pixels; pixel++) {
                let i = 3 * pixel
                data[i] = getRandomInt(min, max)
                data[i + 1] = getRandomInt(min, max)
                data[i + 2] = getRandomInt(min, max)
            }
            fc.send(data)
            console.log(`\n ${data.toString()}`)
        }
        frame++
    }, _duration)
}

function fadeAllLights(frame, pixels, color, duration) {
    let _color = color ? color : getRandomColor()
    let _duration = duration ? duration : 1000

    killIntervals()

    ACL2_INTERVAL = setInterval(function () {
        if (frame % pixels === 0) {
            let data = new Uint8Array(pixels * 3)

            for (let pixel = 0; pixel < pixels; pixel++) {
                let i = 3 * pixel
                data[i] = _color[0]
                data[i + 1] = _color[1]
                data[i + 2] = _color[2]
            }
            fc.send(data)
            fadeAllLights(0, pixels, getRandomColor(), duration)
        }
        frame++
    }, _duration)
}


function killIntervals() {
    let intervals = [
        ACL_INTERVAL,
        ACL2_INTERVAL,
        INTERVAL_1,
        INTERVAL_2
    ]

    intervals.forEach(function (interval) {
        clearInterval(interval)
    })
}