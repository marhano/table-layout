/**
 * GridEvents.js
 * Internal pub/sub event bus.
 * Modules communicate through events — not direct calls.
 * This keeps modules decoupled and makes it easy to add
 * new modules without touching existing ones.
 *
 * Usage:
 *   GridEvents.on('table:created', function(table) { ... });
 *   GridEvents.emit('table:created', newTable);
 */
var GridEvents = (function () {
  var _listeners = {};

  function on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
  }

  function off(event, callback) {
    if (!_listeners[event]) return;
    if (!callback) {
      _listeners[event] = [];
    } else {
      _listeners[event] = _listeners[event].filter(function (cb) {
        return cb !== callback;
      });
    }
  }

  function emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(function (cb) {
      cb(data);
    });
  }

  function reset() {
    _listeners = {};
  }

  return { on: on, off: off, emit: emit, reset: reset };
})();
