var dragElt = require('../');

['xy', 'x', 'y'].forEach(function(name) {
  var container = document.querySelector('.drag-' + name);
  var handle = container.querySelector('.handle');
  dragElt(handle, { constraint: container });
});


['xy', 'x', 'y'].forEach(function(name) {
  var handle = document.querySelector('.handle-' + name);
  dragElt(handle, { constraint: name === 'xy'? null : name });
});

/**
 * Example with two handles, without overlap
 */
(function() {
  var container = document.querySelector('.drag-double');
  var handle1 = container.querySelector('.handle-1');
  var handle2 = container.querySelector('.handle-2');

  var handle1X = 0;
  var handle2X = 560;
  var handleWidth = handle1.offsetWidth;
  handle2.style.left = handle2X + 'px';

  dragElt(handle1, {
    constraint: container,
    move: function(position) {
      handle1X = position.left;
    },
    constraintFn: function(position) {
      if (position.left + handleWidth > handle2X) {
        position.left = handle2X - handleWidth;
      }
      return position;
    }
  });

  dragElt(handle2, {
    constraint: container,
    move: function(position) {
      handle2X = position.left;
    },
    constraintFn: function(position) {
      if (position.left < handle1X + handleWidth) {
        position.left = handle1X + handleWidth;
      }
      return position;
    }
  });
}());
