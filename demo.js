'use strict'

const FadeCandy = require('./dist/FadeCandy')
const chalk = require('chalk')

let BA_INTERVAL = null
let ACL_INTERVAL = null
let BAR_INTERVAL = null
let INTERVAL_1 = null
let INTERVAL_2 = null
let INTERVAL_3 = null
let INTERVAL_4 = null
let MAIN_INTERVAL = null
let PINGPONG_INTERVAL = null

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
    let duration = 3000
    let limit = 4;

    chargeUp(0, 8)
    //allColorLights(0,8)
    //pingPong(0, pixels)
    //randomColorsThenChase()
})

function turnOff() {
    let pixels = 8
    let noColor = [0,0,0]
    let allOff = []

    for(let x=0; x<pixels; x++) {
        allOff.push(noColor)
    }

    killIntervals();

    fc.send([].concat.apply([], allOff))
}

function pingPong(frame, pixels) {
    let duration = 800

    PINGPONG_INTERVAL = setInterval(function () {
        killIntervals();

        chargeUp(0, pixels)

        setTimeout(function () {
            killIntervals();

            baseAnimationReversed(0, pixels)
        }, duration/2)
    }, duration)
}

function pairs(frame, pixels) {
    let noColor = [0,0,0]

    let c1 = [0, 244, 25]
    let c2 = [244, 25, 0]

    let r1 = getRandomColor(0, 255)
    let r2 = getRandomColor(0, 255)

    let colorPair = r1.concat(noColor)

    let colors = []

    for(let x = 0; x < pixels/2; x++) {
        colors.push(colorPair)
    }

    console.log('colors', colors)
    colors = [].concat.apply([], colors)

    fc.send(colors, function () {
        console.log(`done updating to ${colors}`)
    })
}

function randomColorsThenChase() {
    let frame = 0
    let pixels = 8

    let duration = 6000

    setInterval(function () {
        killIntervals()

        pingPong(frame, pixels)

        setTimeout(function () {
            killIntervals()

            allColorLights(frame, pixels)
        }, duration/4 + 100)
    }, duration)

    allColorLights(frame, pixels)

}

function chargeUp (frame, pixels) {
    let randomColor = () => {
        return [
            getRandomInt(1, 255),
            getRandomInt(1,255),
            getRandomInt(1, 255)
        ]
    }

    let color = randomColor()
    let data = new Uint8Array(pixels * 3)

    INTERVAL_1 = setInterval(function () {
        // delay filling of bar
        let randomInt = Math.random()

        if (randomInt < 0.92) {
            //data = data ? data.slice(0, data.length-3) : []
            fc.send(data)
            console.log(chalk.red(randomInt))
            return
        }

        console.log(chalk.green(randomInt))

        for (let pixel = 0; pixel < pixels; pixel ++) {
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

    }, 1000/21*3)
}

function reset () {
    killIntervals()

    setTimeout(function () {
        fc.send(new Uint8Array(8*3));
    }, 1000)

    setTimeout(function () {
        baseAnimationReversed(0, 8)
    }, 2000)

    setTimeout(function() {
        killIntervals()
        chargeUp(0, 8)
    }, 6000)
}

function baseAnimationReversed (frame, pixels) {
    let randomColor = [
        getRandomInt(1, 255),
        getRandomInt(1, 255),
        getRandomInt(1, 255)
    ]

    let color = randomColor

    INTERVAL_2 = setInterval(function () {

        let data = new Uint8Array(pixels * 3)

        for (let pixel = 0; pixel < pixels; pixel ++) {
            if (frame % pixels == pixel) {
                let n = Math.abs(7-pixel)
                //let i = 3 * pixel 
                let i = 3 * n
                data[i] = color[0]
                data[i + 1] = color[1]
                data[i + 2] = color[2]
            }
        }
        fc.send(data)
        frame++
        
    }, 1000/21)
}

function allColorLights(frame, pixels) {
    ACL_INTERVAL = setInterval(function () {
        if (frame % 4 === 0) {
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
            console.log(data)
        }

        frame++



    }, 1000/8*4)
}



function killIntervals() {
    let intervals = [
        BA_INTERVAL,
        ACL_INTERVAL,
        BAR_INTERVAL,
        INTERVAL_1,
        INTERVAL_2,
        INTERVAL_3,
        INTERVAL_4,
        PINGPONG_INTERVAL
    ]

    intervals.forEach(function (interval) {
        clearInterval(interval)
    })
}