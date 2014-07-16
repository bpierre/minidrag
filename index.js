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

function getTotalScroll(elt) {
  var scroll = { left: 0, top: 0 };
  while (elt = elt.parentElement) {
    scroll.left += elt.scrollLeft;
    scroll.top += elt.scrollTop;
  }
  return scroll;
}

function eventToPosition(event) {
  if (event.touches && event.touches.length) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

var raf = global.requestAnimationFrame || function(cb) {
  setTimeout(cb, 40);
};

function initLocalPosition(elt, limits) {

  return function getLocalPosition(coords, dimensions) {

    var left = elt.offsetLeft;
    var top = elt.offsetTop;

    var offsetParent = elt.offsetParent;
    var parentLeft = offsetParent.offsetLeft;
    var parentTop = offsetParent.offsetTop;

    var pos = {
      left: coords.x - parentLeft - dimensions.width/2,
      top: coords.y - parentTop - dimensions.height/2
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
  });
  onmove(position, elt);
}

function start(mousevent, elt, limits, getLocalPosition, settings) {

  var dimensions = { width: elt.offsetWidth, height: elt.offsetHeight };
  var scroll = getTotalScroll(elt);

  var getPosition = function(event) {
    var coords = eventToPosition(event);
    var pos = getLocalPosition(coords, dimensions);

    // add total scroll
    pos.left += scroll.left;
    pos.top += scroll.top;

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
  if (!mousevent.touches) moveEvent(mousevent);

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

  var limits = getLimits(settings.constraint);
  var getLocalPosition = initLocalPosition(elt, limits);

  var downEvent = function(e) {
    e.preventDefault();
    start(e, elt, limits, getLocalPosition, settings);
  };

  elt.addEventListener('mousedown', downEvent);
  elt.addEventListener('touchstart', downEvent);
};
