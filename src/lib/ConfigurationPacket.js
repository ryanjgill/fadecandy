'use strict'

const FadeCandyPacket = require('./FadeCandyPacket')

module.exports = class ConfigurationPacket extends FadeCandyPacket {
    constructor (data) {
        super()

        this.type = FadeCandyPacket.types.CONFIGURATION
        this.max_entries = 1

        if (data) return this.create(data)
    }

    create (data) {
        let pA = this.createPacketArray(data)

        pA = this.setControlBytes(pA)

        return this.createBuffer(pA)
    }
}