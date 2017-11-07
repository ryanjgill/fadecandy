var socket = io.connect();

window.__selectedColor = [];

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

socket.on('newColor', function (color) {
  console.log(rgbToHex(color[0], color[1], color[2]))
  $('.colorPicker').val(rgbToHex(color[0], color[1], color[2]))
});

function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? 'rgb(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ')'
    : null;
}

socket.emit('test', {name: 'testing 123'});

$(function () {
  
  

  function emitColor(color) {
    socket.emit('newColor', {
      color: color
    })
  }


// set strip to black
  function clearStrip() {
    setAllPixels('rgb(0,0,0)');
  }

  function setAllPixels(color) {
    $('.pixel').css('background-color', color);
  }

  $('.colorPicker').on('change', function (e) {
    var $target = $(e.currentTarget)
      , color = e.target.value
      , rgbColor = hexToRgb(color)
      , colorArray = rgbColor.replace(/[^\d]/g, ' ').trim().split(' ').map(function (n) {
        return n++;
      })
      ;

    __selectedColor = colorArray;

    setAllPixels(hexToRgb(color));

    emitColor(colorArray, {color: __selectedColor});
  });

  $('#chargeUp').on('click', function () {
    socket.emit('chargeUp', {color: __selectedColor})
  });

  $('#turnOff').on('click', function () {
    socket.emit('turnOff')
  });

});
