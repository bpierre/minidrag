function def(obj, options) {
  if (!obj) obj = {};
  Object.keys(options).forEach(function(name) {
    if (typeof obj[name] === 'undefined') {
      obj[name] = options[name];
    }
  });
  return obj;
}

function createIsFunction(name) {
  return function(obj) {
    return ({}).toString.call(obj) === '[object '+ name +']';
  }
}
var isString = createIsFunction('String');
var isNumber = createIsFunction('Number');

function isElement(obj) {
  return obj && obj.nodeType === 1;
}

function getEltScroll(elt) {
  var scroll = { top: elt.scrollTop, left: elt.scrollLeft };
  if (elt === document.body && !scroll.top && !scroll.left) {
    scroll.top = document.documentElement.scrollTop;
    scroll.left = elt.scrollLeft || document.documentElement.scrollLeft;
  }
  return scroll;
}

function eventToPosition(event) {
  if (event.touches && event.touches.length) event = event.touches[0];
  return { x: event.clientX, y: event.clientY };
}

var raf = global.requestAnimationFrame || function(cb) {
  setTimeout(cb, 40);
};

function getOffsetParent(elt) {
  var offsetParent = elt.offsetParent || document.body;
  return offsetParent;
}

function initLocalPosition(elt, limits, mousepos) {

  var initialRect = elt.getBoundingClientRect();
  var shift = {
    y: mousepos.y - initialRect.top - initialRect.height,
    x: mousepos.x - initialRect.left - initialRect.width
  };

  return function getLocalPosition(coords, dimensions) {

    var left = elt.offsetLeft;
    var top = elt.offsetTop;

    var parent = getOffsetParent(elt);
    var parentRect = { left: 0, top: 0 };
    if (parent !== document.body) parentRect = parent.getBoundingClientRect();
    var pos = {
      left: coords.x - parentRect.left - dimensions.width - shift.x,
      top: coords.y - parentRect.top - dimensions.height - shift.y
    };

    // constraint: 'x' or 'y'
    if (limits.x === true) pos.left = left;
    if (limits.y === true) pos.top = top;

    // constraint: Element
    if (isNumber(limits.x)) {
      if (pos.left < 0) pos.left = 0;
      if (pos.left > limits.x - dimensions.width) {
        pos.left = limits.x - dimensions.width;
      }
    }

    if (isNumber(limits.y)) {
      if (pos.top < 0) pos.top = 0;
      if (pos.top > limits.y - dimensions.height) {
        pos.top = limits.y - dimensions.height;
      }
    }

    var scroll = getEltScroll(parent);
    pos.top += scroll.top;
    pos.left += scroll.left;

    return pos;
  }
}

function getLimits(constraint) {
  if (isElement(constraint)) {
    return { x: constraint.offsetWidth, y: constraint.offsetHeight };
  }
  if (constraint === 'x') return { y: true, x: false };
  if (constraint === 'y') return { y: false, x: true };
  return { y: false, x: false };
}

function move(elt, limits, position, onmove) {
  raf(function() {
    if (limits.x !== true) elt.style.left = position.left + 'px';
    if (limits.y !== true) elt.style.top = position.top + 'px';
    onmove(position, elt);
  });
}

function start(mouseEvent, elt, limits, getLocalPosition, settings) {
  var dimensions = { width: elt.offsetWidth, height: elt.offsetHeight };

  var getPosition = function(event) {
    var coords = eventToPosition(event);
    var pos = getLocalPosition(coords, dimensions);
    return settings.constraintFn(pos) || pos;
  };

  var moveEvent = function(event) {
    event.preventDefault();
    move(elt, limits, getPosition(event), settings.move);
  };

  var stop = function(event) {
    global.removeEventListener('mousemove', moveEvent);
    global.removeEventListener('touchmove', moveEvent);
    global.removeEventListener('mouseup', stop);
    global.removeEventListener('touchend', stop);
    settings.drop(getPosition(event), elt);
  };

  // On touch devices, wait for an actual move event before moving
  // the dragged element.
  if (!mouseEvent.touches) moveEvent(mouseEvent);

  global.addEventListener('mousemove', moveEvent);
  global.addEventListener('touchmove', moveEvent);
  global.addEventListener('mouseup', stop);
  global.addEventListener('touchend', stop);
}

module.exports = function drag(elt, settings) {

  if (typeof window === 'undefined') {
    throw new Error('drag() must be run in a browser environment!');
  }

  settings = def(settings, {
    constraint: null,
    constraintFn: function(pos) { return pos },
    move: function() {},
    drop: function() {}
  });

  var downEvent = function(e) {
    e.preventDefault();
    var limits = getLimits(settings.constraint);
    var getLocalPosition = initLocalPosition(elt, limits, eventToPosition(e));
    start(e, elt, limits, getLocalPosition, settings);
  };

  elt.addEventListener('mousedown', downEvent);
  elt.addEventListener('touchstart', downEvent);
};
