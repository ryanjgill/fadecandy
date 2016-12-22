var socket = io.connect();

window.__selectedColor = [];

socket.on('newColor', function (data) {
  console.log(data, data)
});

socket.emit('test', {name: 'testing 123'});

$(function () {
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
    //pulseAllPixels();
    emitColor(colorArray, {color: __selectedColor});

  });

  function pulseAllPixels() {
    $('.pixel').addClass('pulse chase-right');
  }

  $('#pulse').on('click', function () {
    $('.pixel').toggleClass('pulse').removeClass('chase-right chase-left');
  });

  $('#chargeUp').on('click', function () {
    $('.pixel').addClass('chargeUp').removeClass('pulse chase-right chase-left');
    socket.emit('chargeUp', {color: __selectedColor})
  });


  $('#chase-left').on('click', function () {
    $('.pixel').addClass('pulse chase-left').removeClass('chase-right');
  });

  $('#chase-right').on('click', function () {
    $('.pixel').addClass('pulse chase-right').removeClass('chase-left');
  });

//clearStrip();


});
