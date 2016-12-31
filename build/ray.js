(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RayInput = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var HEAD_ELBOW_OFFSET = new THREE.Vector3(0.155, -0.465, -0.15);
var ELBOW_WRIST_OFFSET = new THREE.Vector3(0, 0, -0.25);
var WRIST_CONTROLLER_OFFSET = new THREE.Vector3(0, 0, 0.05);
var ARM_EXTENSION_OFFSET = new THREE.Vector3(-0.08, 0.14, 0.08);

var ELBOW_BEND_RATIO = 0.4; // 40% elbow, 60% wrist.
var EXTENSION_RATIO_WEIGHT = 0.4;

var MIN_ANGULAR_SPEED = 0.61; // 35 degrees per second (in radians).

/**
 * Represents the arm model for the Daydream controller. Feed it a camera and
 * the controller. Update it on a RAF.
 *
 * Get the model's pose using getPose().
 */

var OrientationArmModel = function () {
  function OrientationArmModel() {
    _classCallCheck(this, OrientationArmModel);

    this.isLeftHanded = false;

    // Current and previous controller orientations.
    this.controllerQ = new THREE.Quaternion();
    this.lastControllerQ = new THREE.Quaternion();

    // Current and previous head orientations.
    this.headQ = new THREE.Quaternion();

    // Current head position.
    this.headPos = new THREE.Vector3();

    // Positions of other joints (mostly for debugging).
    this.elbowPos = new THREE.Vector3();
    this.wristPos = new THREE.Vector3();

    // Current and previous times the model was updated.
    this.time = null;
    this.lastTime = null;

    // Root rotation.
    this.rootQ = new THREE.Quaternion();

    // Current pose that this arm model calculates.
    this.pose = {
      orientation: new THREE.Quaternion(),
      position: new THREE.Vector3()
    };
  }

  /**
   * Methods to set controller and head pose (in world coordinates).
   */


  _createClass(OrientationArmModel, [{
    key: 'setControllerOrientation',
    value: function setControllerOrientation(quaternion) {
      this.lastControllerQ.copy(this.controllerQ);
      this.controllerQ.copy(quaternion);
    }
  }, {
    key: 'setHeadOrientation',
    value: function setHeadOrientation(quaternion) {
      this.headQ.copy(quaternion);
    }
  }, {
    key: 'setHeadPosition',
    value: function setHeadPosition(position) {
      this.headPos.copy(position);
    }
  }, {
    key: 'setLeftHanded',
    value: function setLeftHanded(isLeftHanded) {
      // TODO(smus): Implement me!
      this.isLeftHanded = isLeftHanded;
    }

    /**
     * Called on a RAF.
     */

  }, {
    key: 'update',
    value: function update() {
      this.time = performance.now();

      // If the controller's angular velocity is above a certain amount, we can
      // assume torso rotation and move the elbow joint relative to the
      // camera orientation.
      var headYawQ = this.getHeadYawOrientation_();
      var timeDelta = (this.time - this.lastTime) / 1000;
      var angleDelta = this.quatAngle_(this.lastControllerQ, this.controllerQ);
      var controllerAngularSpeed = angleDelta / timeDelta;
      if (controllerAngularSpeed > MIN_ANGULAR_SPEED) {
        // Attenuate the Root rotation slightly.
        this.rootQ.slerp(headYawQ, angleDelta / 10);
      } else {
        this.rootQ.copy(headYawQ);
      }

      // We want to move the elbow up and to the center as the user points the
      // controller upwards, so that they can easily see the controller and its
      // tool tips.
      var controllerEuler = new THREE.Euler().setFromQuaternion(this.controllerQ, 'YXZ');
      var controllerXDeg = THREE.Math.radToDeg(controllerEuler.x);
      var extensionRatio = this.clamp_((controllerXDeg - 11) / (50 - 11), 0, 1);

      // Controller orientation in camera space.
      var controllerCameraQ = this.rootQ.clone().inverse();
      controllerCameraQ.multiply(this.controllerQ);

      // Calculate elbow position.
      var elbowPos = this.elbowPos;
      elbowPos.copy(this.headPos).add(HEAD_ELBOW_OFFSET);
      var elbowOffset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      elbowOffset.multiplyScalar(extensionRatio);
      elbowPos.add(elbowOffset);

      // Calculate joint angles. Generally 40% of rotation applied to elbow, 60%
      // to wrist, but if controller is raised higher, more rotation comes from
      // the wrist.
      var totalAngle = this.quatAngle_(controllerCameraQ, new THREE.Quaternion());
      var totalAngleDeg = THREE.Math.radToDeg(totalAngle);
      var lerpSuppression = 1 - Math.pow(totalAngleDeg / 180, 4); // TODO(smus): ???

      var elbowRatio = ELBOW_BEND_RATIO;
      var wristRatio = 1 - ELBOW_BEND_RATIO;
      var lerpValue = lerpSuppression * (elbowRatio + wristRatio * extensionRatio * EXTENSION_RATIO_WEIGHT);

      var wristQ = new THREE.Quaternion().slerp(controllerCameraQ, lerpValue);
      var invWristQ = wristQ.inverse();
      var elbowQ = controllerCameraQ.clone().multiply(invWristQ);

      // Calculate our final controller position based on all our joint rotations
      // and lengths.
      /*
      position_ =
        root_rot_ * (
          controller_root_offset_ +
      2:      (arm_extension_ * amt_extension) +
      1:      elbow_rot * (kControllerForearm + (wrist_rot * kControllerPosition))
        );
      */
      var wristPos = this.wristPos;
      wristPos.copy(WRIST_CONTROLLER_OFFSET);
      wristPos.applyQuaternion(wristQ);
      wristPos.add(ELBOW_WRIST_OFFSET);
      wristPos.applyQuaternion(elbowQ);
      wristPos.add(this.elbowPos);

      var offset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      offset.multiplyScalar(extensionRatio);

      var position = new THREE.Vector3().copy(this.wristPos);
      position.add(offset);
      position.applyQuaternion(this.rootQ);

      var orientation = new THREE.Quaternion().copy(this.controllerQ);

      // Set the resulting pose orientation and position.
      this.pose.orientation.copy(orientation);
      this.pose.position.copy(position);

      this.lastTime = this.time;
    }

    /**
     * Returns the pose calculated by the model.
     */

  }, {
    key: 'getPose',
    value: function getPose() {
      return this.pose;
    }

    /**
     * Debug methods for rendering the arm model.
     */

  }, {
    key: 'getForearmLength',
    value: function getForearmLength() {
      return ELBOW_WRIST_OFFSET.length();
    }
  }, {
    key: 'getElbowPosition',
    value: function getElbowPosition() {
      var out = this.elbowPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getWristPosition',
    value: function getWristPosition() {
      var out = this.wristPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getHeadYawOrientation_',
    value: function getHeadYawOrientation_() {
      var headEuler = new THREE.Euler().setFromQuaternion(this.headQ, 'YXZ');
      headEuler.x = 0;
      headEuler.z = 0;
      var destinationQ = new THREE.Quaternion().setFromEuler(headEuler);
      return destinationQ;
    }
  }, {
    key: 'clamp_',
    value: function clamp_(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  }, {
    key: 'quatAngle_',
    value: function quatAngle_(q1, q2) {
      var vec1 = new THREE.Vector3(0, 0, -1);
      var vec2 = new THREE.Vector3(0, 0, -1);
      vec1.applyQuaternion(q1);
      vec2.applyQuaternion(q2);
      return vec1.angleTo(vec2);
    }
  }]);

  return OrientationArmModel;
}();

exports.default = OrientationArmModel;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var DRAG_DISTANCE_PX = 10;

/**
 * Enumerates all possible interaction modes. Sets up all event handlers (mouse,
 * touch, etc), interfaces with gamepad API.
 *
 * Emits events:
 *    action: Input is activated (mousedown, touchstart, daydream click, vive
 *    trigger).
 *    release: Input is deactivated (mouseup, touchend, daydream release, vive
 *    release).
 *    cancel: Input is canceled (eg. we scrolled instead of tapping on
 *    mobile/desktop).
 *    pointermove(2D position): The pointer is moved (mouse or touch).
 */

var RayController = function (_EventEmitter) {
  _inherits(RayController, _EventEmitter);

  function RayController(opt_el) {
    _classCallCheck(this, RayController);

    var _this = _possibleConstructorReturn(this, (RayController.__proto__ || Object.getPrototypeOf(RayController)).call(this));

    var el = opt_el || window;

    // Handle interactions.
    el.addEventListener('mousedown', _this.onMouseDown_.bind(_this));
    el.addEventListener('mousemove', _this.onMouseMove_.bind(_this));
    el.addEventListener('mouseup', _this.onMouseUp_.bind(_this));
    el.addEventListener('touchstart', _this.onTouchStart_.bind(_this));
    el.addEventListener('touchmove', _this.onTouchMove_.bind(_this));
    el.addEventListener('touchend', _this.onTouchEnd_.bind(_this));

    // The position of the pointer.
    _this.pointer = new THREE.Vector2();
    // The previous position of the pointer.
    _this.lastPointer = new THREE.Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    _this.pointerNdc = new THREE.Vector2();
    // How much we have dragged (if we are dragging).
    _this.dragDistance = 0;
    // Are we dragging or not.
    _this.isDragging = false;
    // Is pointer active or not.
    _this.isTouchActive = false;

    // Gamepad events.
    _this.gamepad = null;

    // VR Events.
    if (!navigator.getVRDisplays) {
      console.warn('WebVR API not available! Consider using the webvr-polyfill.');
    } else {
      navigator.getVRDisplays().then(function (displays) {
        _this.vrDisplay = displays[0];
      });
    }
    return _this;
  }

  _createClass(RayController, [{
    key: 'getInteractionMode',
    value: function getInteractionMode() {
      // TODO: Debugging only.
      //return InteractionModes.DAYDREAM;

      var gamepad = this.getVRGamepad_();

      if (gamepad) {
        var pose = gamepad.pose;
        // If there's a gamepad connected, determine if it's Daydream or a Vive.
        if (pose.hasPosition) {
          return _rayInteractionModes2.default.VR_6DOF;
        }

        if (pose.hasOrientation) {
          return _rayInteractionModes2.default.VR_3DOF;
        }
      } else {
        // If there's no gamepad, it might be Cardboard, magic window or desktop.
        if ((0, _util.isMobile)()) {
          // Either Cardboard or magic window, depending on whether we are
          // presenting.
          if (this.vrDisplay && this.vrDisplay.isPresenting) {
            return _rayInteractionModes2.default.VR_0DOF;
          } else {
            return _rayInteractionModes2.default.TOUCH;
          }
        } else {
          // We must be on desktop.
          return _rayInteractionModes2.default.MOUSE;
        }
      }
      // By default, use TOUCH.
      return _rayInteractionModes2.default.TOUCH;
    }
  }, {
    key: 'getGamepadPose',
    value: function getGamepadPose() {
      var gamepad = this.getVRGamepad_();
      return gamepad.pose;
    }

    /**
     * Get if there is an active touch event going on.
     * Only relevant on touch devices
     */

  }, {
    key: 'getIsTouchActive',
    value: function getIsTouchActive() {
      return this.isTouchActive;
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.size = size;
    }
  }, {
    key: 'update',
    value: function update() {
      var mode = this.getInteractionMode();
      if (mode == _rayInteractionModes2.default.VR_3DOF || mode == _rayInteractionModes2.default.VR_6DOF) {
        // If we're dealing with a gamepad, check every animation frame for a
        // pressed action.
        var isGamepadPressed = this.getGamepadButtonPressed_();
        if (isGamepadPressed && !this.wasGamepadPressed) {
          this.emit('raydown');
        }
        if (!isGamepadPressed && this.wasGamepadPressed) {
          this.emit('rayup');
        }
        this.wasGamepadPressed = isGamepadPressed;
      }
    }
  }, {
    key: 'getGamepadButtonPressed_',
    value: function getGamepadButtonPressed_() {
      var gamepad = this.getVRGamepad_();
      if (!gamepad) {
        // If there's no gamepad, the button was not pressed.
        return false;
      }
      // Check for clicks.
      for (var j = 0; j < gamepad.buttons.length; ++j) {
        if (gamepad.buttons[j].pressed) {
          return true;
        }
      }
      return false;
    }
  }, {
    key: 'onMouseDown_',
    value: function onMouseDown_(e) {
      this.startDragging_(e);
      this.emit('raydown');
    }
  }, {
    key: 'onMouseMove_',
    value: function onMouseMove_(e) {
      this.updatePointer_(e);
      this.updateDragDistance_();
      this.emit('pointermove', this.pointerNdc);
    }
  }, {
    key: 'onMouseUp_',
    value: function onMouseUp_(e) {
      this.endDragging_();
    }
  }, {
    key: 'onTouchStart_',
    value: function onTouchStart_(e) {
      this.isTouchActive = true;
      var t = e.touches[0];
      this.startDragging_(t);
      this.updateTouchPointer_(e);

      this.emit('pointermove', this.pointerNdc);
      this.emit('raydown');

      // Prevent synthetic mouse event from being created.
      e.preventDefault();
    }
  }, {
    key: 'onTouchMove_',
    value: function onTouchMove_(e) {
      this.updateTouchPointer_(e);
      this.updateDragDistance_();

      // Prevent synthetic mouse event from being created.
      e.preventDefault();
    }
  }, {
    key: 'onTouchEnd_',
    value: function onTouchEnd_(e) {
      this.endDragging_();

      // Prevent synthetic mouse event from being created.
      e.preventDefault();
      this.isTouchActive = false;
    }
  }, {
    key: 'updateTouchPointer_',
    value: function updateTouchPointer_(e) {
      // If there's no touches array, ignore.
      if (e.touches.length === 0) {
        console.warn('Received touch event with no touches.');
        return;
      }
      var t = e.touches[0];
      this.updatePointer_(t);
    }
  }, {
    key: 'updatePointer_',
    value: function updatePointer_(e) {
      // How much the pointer moved.
      this.pointer.set(e.clientX, e.clientY);
      this.pointerNdc.x = e.clientX / this.size.width * 2 - 1;
      this.pointerNdc.y = -(e.clientY / this.size.height) * 2 + 1;
    }
  }, {
    key: 'updateDragDistance_',
    value: function updateDragDistance_() {
      if (this.isDragging) {
        var distance = this.lastPointer.sub(this.pointer).length();
        this.dragDistance += distance;
        this.lastPointer.copy(this.pointer);

        //console.log('dragDistance', this.dragDistance);
        if (this.dragDistance > DRAG_DISTANCE_PX) {
          this.emit('raycancel');
          this.isDragging = false;
        }
      }
    }
  }, {
    key: 'startDragging_',
    value: function startDragging_(e) {
      this.isDragging = true;
      this.lastPointer.set(e.clientX, e.clientY);
    }
  }, {
    key: 'endDragging_',
    value: function endDragging_() {
      if (this.dragDistance < DRAG_DISTANCE_PX) {
        this.emit('rayup');
      }
      this.dragDistance = 0;
      this.isDragging = false;
    }

    /**
     * Gets the first VR-enabled gamepad.
     */

  }, {
    key: 'getVRGamepad_',
    value: function getVRGamepad_() {
      // If there's no gamepad API, there's no gamepad.
      if (!navigator.getGamepads) {
        return null;
      }

      var gamepads = navigator.getGamepads();
      for (var i = 0; i < gamepads.length; ++i) {
        var gamepad = gamepads[i];

        // The array may contain undefined gamepads, so check for that as well as
        // a non-null pose.
        if (gamepad && gamepad.pose) {
          return gamepad;
        }
      }
      return null;
    }
  }]);

  return RayController;
}(_eventemitter2.default);

exports.default = RayController;

},{"./ray-interaction-modes":5,"./util":7,"eventemitter3":1}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _orientationArmModel = require('./orientation-arm-model');

var _orientationArmModel2 = _interopRequireDefault(_orientationArmModel);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayRenderer = require('./ray-renderer');

var _rayRenderer2 = _interopRequireDefault(_rayRenderer);

var _rayController = require('./ray-controller');

var _rayController2 = _interopRequireDefault(_rayController);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * API wrapper for the input library.
 */
var RayInput = function (_EventEmitter) {
  _inherits(RayInput, _EventEmitter);

  function RayInput(camera, opt_el, vrDisplay) {
    _classCallCheck(this, RayInput);

    var _this = _possibleConstructorReturn(this, (RayInput.__proto__ || Object.getPrototypeOf(RayInput)).call(this));

    _this.camera = camera;
    _this.renderer = new _rayRenderer2.default(camera);
    _this.controller = new _rayController2.default(opt_el);
    _this.vrDisplay = vrDisplay;
    console.log(vrDisplay);

    // Arm model needed to transform controller orientation into proper pose.
    _this.armModel = new _orientationArmModel2.default();

    _this.controller.on('raydown', _this.onRayDown_.bind(_this));
    _this.controller.on('rayup', _this.onRayUp_.bind(_this));
    _this.controller.on('raycancel', _this.onRayCancel_.bind(_this));
    _this.controller.on('pointermove', _this.onPointerMove_.bind(_this));
    _this.renderer.on('rayover', function (mesh) {
      _this.emit('rayover', mesh);
    });
    _this.renderer.on('rayout', function (mesh) {
      _this.emit('rayout', mesh);
    });

    // By default, put the pointer offscreen.
    _this.pointerNdc = new THREE.Vector2(1, 1);

    // Event handlers.
    _this.handlers = {};
    return _this;
  }

  _createClass(RayInput, [{
    key: 'add',
    value: function add(object, handlers) {
      this.renderer.add(object, handlers);
      this.handlers[object.id] = handlers;
    }
  }, {
    key: 'remove',
    value: function remove(object) {
      this.renderer.remove(object);
      delete this.handlers[object.id];
    }
  }, {
    key: 'update',
    value: function update() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);

      var mode = this.controller.getInteractionMode();
      switch (mode) {
        case _rayInteractionModes2.default.MOUSE:
          // Desktop mouse mode, mouse coordinates are what matters.
          this.renderer.setPointer(this.pointerNdc);
          // Hide the ray and reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In mouse mode ray renderer is always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.TOUCH:
          // Mobile magic window mode. Touch coordinates matter, but we want to
          // hide the reticle.
          this.renderer.setPointer(this.pointerNdc);

          // Hide the ray and the reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In touch mode the ray renderer is only active on touch.
          this.renderer.setActive(this.controller.getIsTouchActive());
          break;

        case _rayInteractionModes2.default.VR_0DOF:
          // Cardboard mode, we're dealing with a gaze reticle.
          this.renderer.setPosition(this.camera.position);
          this.renderer.setOrientation(this.camera.quaternion);

          // Reticle only.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_3DOF:
          // Daydream, our origin is slightly off (depending on handedness).
          // But we should be using the orientation from the gamepad.
          // TODO(smus): Implement the real arm model.
          var pose = this.controller.getGamepadPose();

          // Debug only: use camera as input controller.
          //let controllerOrientation = this.camera.quaternion;
          var controllerOrientation = new THREE.Quaternion().fromArray(pose.orientation);

          // Transform the controller into the camera coordinate system.
          /*
          controllerOrientation.multiply(
              new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
          controllerOrientation.x *= -1;
          controllerOrientation.z *= -1;
          */

          // Feed camera and controller into the arm model.
          this.armModel.setHeadOrientation(this.camera.quaternion);
          this.armModel.setHeadPosition(this.camera.position);
          this.armModel.setControllerOrientation(controllerOrientation);
          this.armModel.update();

          // Get resulting pose and configure the renderer.
          var modelPose = this.armModel.getPose();
          this.renderer.setPosition(modelPose.position);
          //this.renderer.setPosition(new THREE.Vector3());
          this.renderer.setOrientation(modelPose.orientation);
          //this.renderer.setOrientation(controllerOrientation);

          // Show ray and reticle.
          this.renderer.setRayVisibility(true);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_6DOF:
          // Vive, origin depends on the position of the controller.
          // TODO(smus)...
          var pose = this.controller.getGamepadPose();

          // Check that the pose is valid.
          if (!pose.orientation || !pose.position) {
            console.warn('Invalid gamepad pose. Can\'t update ray.');
            break;
          }

          var orientation = new THREE.Quaternion().fromArray(pose.orientation);
          var position = new THREE.Vector3().fromArray(pose.position);

          if (this.vrDisplay && this.vrDisplay.stageParameters) {
            var composed = new THREE.Matrix4();
            var stageParameters = new THREE.Matrix4().fromArray(this.vrDisplay.stageParameters.sittingToStandingTransform);
            composed.makeRotationFromQuaternion(orientation);
            composed.setPosition(position);
            composed.premultiply(stageParameters);

            var standingOrientation = new THREE.Quaternion();
            var standingPosition = new THREE.Vector3();
            var standingScale = new THREE.Vector3();
            composed.decompose(standingPosition, standingOrientation, standingScale);

            this.renderer.setOrientation(standingOrientation);
            this.renderer.setPosition(standingPosition);
          } else {
            this.renderer.setOrientation(orientation);
            this.renderer.setPosition(position);
          }

          // Show ray and reticle.
          this.renderer.setRayVisibility(true);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        default:
          console.error('Unknown interaction mode.');
      }
      this.renderer.update();
      this.controller.update();
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.controller.setSize(size);
    }
  }, {
    key: 'getMesh',
    value: function getMesh() {
      return this.renderer.getReticleRayMesh();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.renderer.getOrigin();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.renderer.getDirection();
    }
  }, {
    key: 'getRightDirection',
    value: function getRightDirection() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);
      return new THREE.Vector3().crossVectors(lookAt, this.camera.up);
    }
  }, {
    key: 'onRayDown_',
    value: function onRayDown_(e) {
      //console.log('onRayDown_');

      // Force the renderer to raycast.
      this.renderer.update();
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raydown', mesh);

      this.renderer.setActive(true);
    }
  }, {
    key: 'onRayUp_',
    value: function onRayUp_(e) {
      //console.log('onRayUp_');
      var mesh = this.renderer.getSelectedMesh();
      this.emit('rayup', mesh);

      this.renderer.setActive(false);
    }
  }, {
    key: 'onRayCancel_',
    value: function onRayCancel_(e) {
      //console.log('onRayCancel_');
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raycancel', mesh);
    }
  }, {
    key: 'onPointerMove_',
    value: function onPointerMove_(ndc) {
      this.pointerNdc.copy(ndc);
    }
  }]);

  return RayInput;
}(_eventemitter2.default);

exports.default = RayInput;

},{"./orientation-arm-model":2,"./ray-controller":3,"./ray-interaction-modes":5,"./ray-renderer":6,"eventemitter3":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var InteractionModes = {
  MOUSE: 1,
  TOUCH: 2,
  VR_0DOF: 3,
  VR_3DOF: 4,
  VR_6DOF: 5
};

exports.default = InteractionModes;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require('./util');

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var RETICLE_DISTANCE = 3;
var INNER_RADIUS = 0.02;
var OUTER_RADIUS = 0.04;
var RAY_RADIUS = 0.02;
var GRADIENT_IMAGE = (0, _util.base64)('image/png', 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABdklEQVR4nO3WwXHEQAwDQcin/FOWw+BjuiPYB2q4G2nP933P9SO4824zgDADiDOAuHfb3/UjuKMAcQYQZwBx/gBxChCnAHEKEKcAcQoQpwBxChCnAHEGEGcAcf4AcQoQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHHvtt/1I7ijAHEGEGcAcf4AcQoQZwBxTkCcAsQZQJwTEKcAcQoQpwBxBhDnBMQpQJwCxClAnALEKUCcAsQpQJwCxClAnALEKUCcAsQpQJwBxDkBcQoQpwBxChCnAHEKEKcAcQoQpwBxChCnAHEKEGcAcU5AnALEKUCcAsQZQJwTEKcAcQYQ5wTEKUCcAcQZQJw/QJwCxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUDcu+25fgR3FCDOAOIMIM4fIE4B4hQgTgHiFCBOAeIUIE4B4hQgzgDiDCDOHyBOAeIMIM4A4v4B/5IF9eD6QxgAAAAASUVORK5CYII=');

/**
 * Handles ray input selection from frame of reference of an arbitrary object.
 *
 * The source of the ray is from various locations:
 *
 * Desktop: mouse.
 * Magic window: touch.
 * Cardboard: camera.
 * Daydream: 3DOF controller via gamepad (and show ray).
 * Vive: 6DOF controller via gamepad (and show ray).
 *
 * Emits selection events:
 *     rayover(mesh): This mesh was selected.
 *     rayout(mesh): This mesh was unselected.
 */

var RayRenderer = function (_EventEmitter) {
  _inherits(RayRenderer, _EventEmitter);

  function RayRenderer(camera, opt_params) {
    _classCallCheck(this, RayRenderer);

    var _this = _possibleConstructorReturn(this, (RayRenderer.__proto__ || Object.getPrototypeOf(RayRenderer)).call(this));

    _this.camera = camera;

    var params = opt_params || {};

    // Which objects are interactive (keyed on id).
    _this.meshes = {};

    // Which objects are currently selected (keyed on id).
    _this.selected = {};

    // The raycaster.
    _this.raycaster = new THREE.Raycaster();

    // Position and orientation, in addition.
    _this.position = new THREE.Vector3();
    _this.orientation = new THREE.Quaternion();

    _this.root = new THREE.Object3D();

    // Add the reticle mesh to the root of the object.
    _this.reticle = _this.createReticle_();
    _this.root.add(_this.reticle);

    // Add the ray to the root of the object.
    _this.ray = _this.createRay_();
    _this.root.add(_this.ray);

    // How far the reticle is currently from the reticle origin.
    _this.reticleDistance = RETICLE_DISTANCE;
    return _this;
  }

  /**
   * Register an object so that it can be interacted with.
   */


  _createClass(RayRenderer, [{
    key: 'add',
    value: function add(object) {
      this.meshes[object.id] = object;
    }

    /**
     * Prevent an object from being interacted with.
     */

  }, {
    key: 'remove',
    value: function remove(object) {
      var id = object.id;
      if (!this.meshes[id]) {
        // If there's no existing mesh, we can't remove it.
        delete this.meshes[id];
      }
      // If the object is currently selected, remove it.
      if (this.selected[id]) {
        delete this.selected[object.id];
      }
    }
  }, {
    key: 'update',
    value: function update() {
      // Do the raycasting and issue various events as needed.
      for (var id in this.meshes) {
        var mesh = this.meshes[id];
        var intersects = this.raycaster.intersectObject(mesh, true);
        if (intersects.length > 1) {
          console.warn('Unexpected: multiple meshes intersected.');
        }
        var isIntersected = intersects.length > 0;
        var isSelected = this.selected[id];

        // If it's newly selected, send rayover.
        if (isIntersected && !isSelected) {
          this.selected[id] = true;
          if (this.isActive) {
            this.emit('rayover', mesh);
          }
        }

        // If it's no longer intersected, send rayout.
        if (!isIntersected && isSelected) {
          delete this.selected[id];
          this.moveReticle_(null);
          if (this.isActive) {
            this.emit('rayout', mesh);
          }
        }

        if (isIntersected) {
          this.moveReticle_(intersects);
        }
      }
    }

    /**
     * Sets the origin of the ray.
     * @param {Vector} vector Position of the origin of the picking ray.
     */

  }, {
    key: 'setPosition',
    value: function setPosition(vector) {
      this.position.copy(vector);
      this.raycaster.ray.origin.copy(vector);
      this.updateRaycaster_();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.raycaster.ray.origin;
    }

    /**
     * Sets the direction of the ray.
     * @param {Vector} vector Unit vector corresponding to direction.
     */

  }, {
    key: 'setOrientation',
    value: function setOrientation(quaternion) {
      this.orientation.copy(quaternion);

      var pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
      this.raycaster.ray.direction.copy(pointAt);
      this.updateRaycaster_();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.raycaster.ray.direction;
    }

    /**
     * Sets the pointer on the screen for camera + pointer based picking. This
     * superscedes origin and direction.
     *
     * @param {Vector2} vector The position of the pointer (screen coords).
     */

  }, {
    key: 'setPointer',
    value: function setPointer(vector) {
      this.raycaster.setFromCamera(vector, this.camera);
      this.updateRaycaster_();
    }

    /**
     * Gets the mesh, which includes reticle and/or ray. This mesh is then added
     * to the scene.
     */

  }, {
    key: 'getReticleRayMesh',
    value: function getReticleRayMesh() {
      return this.root;
    }

    /**
     * Gets the currently selected object in the scene.
     */

  }, {
    key: 'getSelectedMesh',
    value: function getSelectedMesh() {
      var count = 0;
      var mesh = null;
      for (var id in this.selected) {
        count += 1;
        mesh = this.meshes[id];
      }
      if (count > 1) {
        console.warn('More than one mesh selected.');
      }
      return mesh;
    }

    /**
     * Hides and shows the reticle.
     */

  }, {
    key: 'setReticleVisibility',
    value: function setReticleVisibility(isVisible) {
      this.reticle.visible = isVisible;
    }

    /**
     * Enables or disables the raycasting ray which gradually fades out from
     * the origin.
     */

  }, {
    key: 'setRayVisibility',
    value: function setRayVisibility(isVisible) {
      this.ray.visible = isVisible;
    }

    /**
     * Enables and disables the raycaster. For touch, where finger up means we
     * shouldn't be raycasting.
     */

  }, {
    key: 'setActive',
    value: function setActive(isActive) {
      // If nothing changed, do nothing.
      if (this.isActive == isActive) {
        return;
      }
      // TODO(smus): Show the ray or reticle adjust in response.
      this.isActive = isActive;

      if (!isActive) {
        this.moveReticle_(null);
        for (var id in this.selected) {
          var mesh = this.meshes[id];
          delete this.selected[id];
          this.emit('rayout', mesh);
        }
      }
    }
  }, {
    key: 'updateRaycaster_',
    value: function updateRaycaster_() {
      var ray = this.raycaster.ray;

      // Position the reticle at a distance, as calculated from the origin and
      // direction.
      var position = this.reticle.position;
      position.copy(ray.direction);
      position.multiplyScalar(this.reticleDistance);
      position.add(ray.origin);

      // Set position and orientation of the ray so that it goes from origin to
      // reticle.
      var delta = new THREE.Vector3().copy(ray.direction);
      delta.multiplyScalar(this.reticleDistance);
      this.ray.scale.y = delta.length();
      var arrow = new THREE.ArrowHelper(ray.direction, ray.origin);
      this.ray.rotation.copy(arrow.rotation);
      this.ray.position.addVectors(ray.origin, delta.multiplyScalar(0.5));
    }

    /**
     * Creates the geometry of the reticle.
     */

  }, {
    key: 'createReticle_',
    value: function createReticle_() {
      // Create a spherical reticle.
      var innerGeometry = new THREE.SphereGeometry(INNER_RADIUS, 32, 32);
      var innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      var inner = new THREE.Mesh(innerGeometry, innerMaterial);

      var outerGeometry = new THREE.SphereGeometry(OUTER_RADIUS, 32, 32);
      var outerMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.3
      });
      var outer = new THREE.Mesh(outerGeometry, outerMaterial);

      var reticle = new THREE.Group();
      reticle.add(inner);
      reticle.add(outer);
      return reticle;
    }

    /**
     * Moves the reticle to a position so that it's just in front of the mesh that
     * it intersected with.
     */

  }, {
    key: 'moveReticle_',
    value: function moveReticle_(intersections) {
      // If no intersection, return the reticle to the default position.
      var distance = RETICLE_DISTANCE;
      if (intersections) {
        // Otherwise, determine the correct distance.
        var inter = intersections[0];
        distance = inter.distance;
      }

      this.reticleDistance = distance;
      this.updateRaycaster_();
      return;
    }
  }, {
    key: 'createRay_',
    value: function createRay_() {
      // Create a cylindrical ray.
      var geometry = new THREE.CylinderGeometry(RAY_RADIUS, RAY_RADIUS, 1, 32);
      var material = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(GRADIENT_IMAGE),
        //color: 0xffffff,
        transparent: true,
        opacity: 0.3
      });
      var mesh = new THREE.Mesh(geometry, material);

      return mesh;
    }
  }]);

  return RayRenderer;
}(_eventemitter2.default);

exports.default = RayRenderer;

},{"./util":7,"eventemitter3":1}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isMobile = isMobile;
exports.base64 = base64;
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function isMobile() {
  var check = false;
  (function (a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function base64(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
}

},{}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwic3JjXFxvcmllbnRhdGlvbi1hcm0tbW9kZWwuanMiLCJzcmNcXHJheS1jb250cm9sbGVyLmpzIiwic3JjXFxyYXktaW5wdXQuanMiLCJzcmNcXHJheS1pbnRlcmFjdGlvbi1tb2Rlcy5qcyIsInNyY1xccmF5LXJlbmRlcmVyLmpzIiwic3JjXFx1dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDalNBOzs7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O0FBTUEsVUFBSSxPQUFPLElBQUksTUFBTSxJQUFWLENBQWUsUUFBZixFQUF5QixRQUF6QixDQUFYOztBQUVBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7a0JBOVFrQixXOzs7Ozs7OztRQ3hCTCxRLEdBQUEsUTtRQU1BLE0sR0FBQSxNO0FBckJoQjs7Ozs7Ozs7Ozs7Ozs7O0FBZU8sU0FBUyxRQUFULEdBQW9CO0FBQ3pCLE1BQUksUUFBUSxLQUFaO0FBQ0EsR0FBQyxVQUFTLENBQVQsRUFBVztBQUFDLFFBQUcsMlRBQTJULElBQTNULENBQWdVLENBQWhVLEtBQW9VLDBrREFBMGtELElBQTFrRCxDQUEra0QsRUFBRSxNQUFGLENBQVMsQ0FBVCxFQUFXLENBQVgsQ0FBL2tELENBQXZVLEVBQXE2RCxRQUFRLElBQVI7QUFBYSxHQUEvN0QsRUFBaThELFVBQVUsU0FBVixJQUFxQixVQUFVLE1BQS9CLElBQXVDLE9BQU8sS0FBLytEO0FBQ0EsU0FBTyxLQUFQO0FBQ0Q7O0FBRU0sU0FBUyxNQUFULENBQWdCLFFBQWhCLEVBQTBCLE1BQTFCLEVBQWtDO0FBQ3ZDLFNBQU8sVUFBVSxRQUFWLEdBQXFCLFVBQXJCLEdBQWtDLE1BQXpDO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy9cbi8vIFdlIHN0b3JlIG91ciBFRSBvYmplY3RzIGluIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGB+YCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBvdmVycmlkZGVuIG9yXG4vLyB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vLyBXZSBhbHNvIGFzc3VtZSB0aGF0IGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBhdmFpbGFibGUgd2hlbiB0aGUgZXZlbnQgbmFtZVxuLy8gaXMgYW4gRVM2IFN5bWJvbC5cbi8vXG52YXIgcHJlZml4ID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgIT09ICdmdW5jdGlvbicgPyAnficgOiBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIE9ubHkgZW1pdCBvbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgRXZlbnRFbWl0dGVyIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkgeyAvKiBOb3RoaW5nIHRvIHNldCAqLyB9XG5cbi8qKlxuICogSG9sZCB0aGUgYXNzaWduZWQgRXZlbnRFbWl0dGVycyBieSBuYW1lLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzXG4gICAgLCBuYW1lcyA9IFtdXG4gICAgLCBuYW1lO1xuXG4gIGlmICghZXZlbnRzKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIGV2ZW50cykge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBXZSBvbmx5IG5lZWQgdG8ga25vdyBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgRXZlbnRMaXN0ZW5lciBmb3IgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgb2YgdGhlIGZ1bmN0aW9uLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGFuIEV2ZW50TGlzdGVuZXIgdGhhdCdzIG9ubHkgY2FsbGVkIG9uY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdlIHdhbnQgdG8gcmVtb3ZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIHRoYXQgd2UgbmVlZCB0byBmaW5kLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSBsaXN0ZW5lcnMgbWF0Y2hpbmcgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uY2UgbGlzdGVuZXJzLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgZXZlbnRzID0gW107XG5cbiAgaWYgKGZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnMuZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnMub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgLy9cbiAgaWYgKGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9yIG9ubHkgdGhlIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdhbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuXG4gIGlmIChldmVudCkgZGVsZXRlIHRoaXMuX2V2ZW50c1twcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XTtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCIvKlxyXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xyXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXHJcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxyXG4gKlxyXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICovXHJcblxyXG5jb25zdCBIRUFEX0VMQk9XX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMTU1LCAtMC40NjUsIC0wLjE1KTtcclxuY29uc3QgRUxCT1dfV1JJU1RfT0ZGU0VUID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTAuMjUpO1xyXG5jb25zdCBXUklTVF9DT05UUk9MTEVSX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDAuMDUpO1xyXG5jb25zdCBBUk1fRVhURU5TSU9OX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0wLjA4LCAwLjE0LCAwLjA4KTtcclxuXHJcbmNvbnN0IEVMQk9XX0JFTkRfUkFUSU8gPSAwLjQ7IC8vIDQwJSBlbGJvdywgNjAlIHdyaXN0LlxyXG5jb25zdCBFWFRFTlNJT05fUkFUSU9fV0VJR0hUID0gMC40O1xyXG5cclxuY29uc3QgTUlOX0FOR1VMQVJfU1BFRUQgPSAwLjYxOyAvLyAzNSBkZWdyZWVzIHBlciBzZWNvbmQgKGluIHJhZGlhbnMpLlxyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgdGhlIGFybSBtb2RlbCBmb3IgdGhlIERheWRyZWFtIGNvbnRyb2xsZXIuIEZlZWQgaXQgYSBjYW1lcmEgYW5kXHJcbiAqIHRoZSBjb250cm9sbGVyLiBVcGRhdGUgaXQgb24gYSBSQUYuXHJcbiAqXHJcbiAqIEdldCB0aGUgbW9kZWwncyBwb3NlIHVzaW5nIGdldFBvc2UoKS5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9yaWVudGF0aW9uQXJtTW9kZWwge1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBjb250cm9sbGVyIG9yaWVudGF0aW9ucy5cclxuICAgIHRoaXMuY29udHJvbGxlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xyXG4gICAgdGhpcy5sYXN0Q29udHJvbGxlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xyXG5cclxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIGhlYWQgb3JpZW50YXRpb25zLlxyXG4gICAgdGhpcy5oZWFkUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XHJcblxyXG4gICAgLy8gQ3VycmVudCBoZWFkIHBvc2l0aW9uLlxyXG4gICAgdGhpcy5oZWFkUG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcclxuXHJcbiAgICAvLyBQb3NpdGlvbnMgb2Ygb3RoZXIgam9pbnRzIChtb3N0bHkgZm9yIGRlYnVnZ2luZykuXHJcbiAgICB0aGlzLmVsYm93UG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcclxuICAgIHRoaXMud3Jpc3RQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xyXG5cclxuICAgIC8vIEN1cnJlbnQgYW5kIHByZXZpb3VzIHRpbWVzIHRoZSBtb2RlbCB3YXMgdXBkYXRlZC5cclxuICAgIHRoaXMudGltZSA9IG51bGw7XHJcbiAgICB0aGlzLmxhc3RUaW1lID0gbnVsbDtcclxuXHJcbiAgICAvLyBSb290IHJvdGF0aW9uLlxyXG4gICAgdGhpcy5yb290USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XHJcblxyXG4gICAgLy8gQ3VycmVudCBwb3NlIHRoYXQgdGhpcyBhcm0gbW9kZWwgY2FsY3VsYXRlcy5cclxuICAgIHRoaXMucG9zZSA9IHtcclxuICAgICAgb3JpZW50YXRpb246IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCksXHJcbiAgICAgIHBvc2l0aW9uOiBuZXcgVEhSRUUuVmVjdG9yMygpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWV0aG9kcyB0byBzZXQgY29udHJvbGxlciBhbmQgaGVhZCBwb3NlIChpbiB3b3JsZCBjb29yZGluYXRlcykuXHJcbiAgICovXHJcbiAgc2V0Q29udHJvbGxlck9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcclxuICAgIHRoaXMubGFzdENvbnRyb2xsZXJRLmNvcHkodGhpcy5jb250cm9sbGVyUSk7XHJcbiAgICB0aGlzLmNvbnRyb2xsZXJRLmNvcHkocXVhdGVybmlvbik7XHJcbiAgfVxyXG5cclxuICBzZXRIZWFkT3JpZW50YXRpb24ocXVhdGVybmlvbikge1xyXG4gICAgdGhpcy5oZWFkUS5jb3B5KHF1YXRlcm5pb24pO1xyXG4gIH1cclxuXHJcbiAgc2V0SGVhZFBvc2l0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICB0aGlzLmhlYWRQb3MuY29weShwb3NpdGlvbik7XHJcbiAgfVxyXG5cclxuICBzZXRMZWZ0SGFuZGVkKGlzTGVmdEhhbmRlZCkge1xyXG4gICAgLy8gVE9ETyhzbXVzKTogSW1wbGVtZW50IG1lIVxyXG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBpc0xlZnRIYW5kZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgb24gYSBSQUYuXHJcbiAgICovXHJcbiAgdXBkYXRlKCkge1xyXG4gICAgdGhpcy50aW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4gICAgLy8gSWYgdGhlIGNvbnRyb2xsZXIncyBhbmd1bGFyIHZlbG9jaXR5IGlzIGFib3ZlIGEgY2VydGFpbiBhbW91bnQsIHdlIGNhblxyXG4gICAgLy8gYXNzdW1lIHRvcnNvIHJvdGF0aW9uIGFuZCBtb3ZlIHRoZSBlbGJvdyBqb2ludCByZWxhdGl2ZSB0byB0aGVcclxuICAgIC8vIGNhbWVyYSBvcmllbnRhdGlvbi5cclxuICAgIGxldCBoZWFkWWF3USA9IHRoaXMuZ2V0SGVhZFlhd09yaWVudGF0aW9uXygpO1xyXG4gICAgbGV0IHRpbWVEZWx0YSA9ICh0aGlzLnRpbWUgLSB0aGlzLmxhc3RUaW1lKSAvIDEwMDA7XHJcbiAgICBsZXQgYW5nbGVEZWx0YSA9IHRoaXMucXVhdEFuZ2xlXyh0aGlzLmxhc3RDb250cm9sbGVyUSwgdGhpcy5jb250cm9sbGVyUSk7XHJcbiAgICBsZXQgY29udHJvbGxlckFuZ3VsYXJTcGVlZCA9IGFuZ2xlRGVsdGEgLyB0aW1lRGVsdGE7XHJcbiAgICBpZiAoY29udHJvbGxlckFuZ3VsYXJTcGVlZCA+IE1JTl9BTkdVTEFSX1NQRUVEKSB7XHJcbiAgICAgIC8vIEF0dGVudWF0ZSB0aGUgUm9vdCByb3RhdGlvbiBzbGlnaHRseS5cclxuICAgICAgdGhpcy5yb290US5zbGVycChoZWFkWWF3USwgYW5nbGVEZWx0YSAvIDEwKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5yb290US5jb3B5KGhlYWRZYXdRKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXZSB3YW50IHRvIG1vdmUgdGhlIGVsYm93IHVwIGFuZCB0byB0aGUgY2VudGVyIGFzIHRoZSB1c2VyIHBvaW50cyB0aGVcclxuICAgIC8vIGNvbnRyb2xsZXIgdXB3YXJkcywgc28gdGhhdCB0aGV5IGNhbiBlYXNpbHkgc2VlIHRoZSBjb250cm9sbGVyIGFuZCBpdHNcclxuICAgIC8vIHRvb2wgdGlwcy5cclxuICAgIGxldCBjb250cm9sbGVyRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmNvbnRyb2xsZXJRLCAnWVhaJyk7XHJcbiAgICBsZXQgY29udHJvbGxlclhEZWcgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKGNvbnRyb2xsZXJFdWxlci54KTtcclxuICAgIGxldCBleHRlbnNpb25SYXRpbyA9IHRoaXMuY2xhbXBfKChjb250cm9sbGVyWERlZyAtIDExKSAvICg1MCAtIDExKSwgMCwgMSk7XHJcblxyXG4gICAgLy8gQ29udHJvbGxlciBvcmllbnRhdGlvbiBpbiBjYW1lcmEgc3BhY2UuXHJcbiAgICBsZXQgY29udHJvbGxlckNhbWVyYVEgPSB0aGlzLnJvb3RRLmNsb25lKCkuaW52ZXJzZSgpO1xyXG4gICAgY29udHJvbGxlckNhbWVyYVEubXVsdGlwbHkodGhpcy5jb250cm9sbGVyUSk7XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIGVsYm93IHBvc2l0aW9uLlxyXG4gICAgbGV0IGVsYm93UG9zID0gdGhpcy5lbGJvd1BvcztcclxuICAgIGVsYm93UG9zLmNvcHkodGhpcy5oZWFkUG9zKS5hZGQoSEVBRF9FTEJPV19PRkZTRVQpO1xyXG4gICAgbGV0IGVsYm93T2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KEFSTV9FWFRFTlNJT05fT0ZGU0VUKTtcclxuICAgIGVsYm93T2Zmc2V0Lm11bHRpcGx5U2NhbGFyKGV4dGVuc2lvblJhdGlvKTtcclxuICAgIGVsYm93UG9zLmFkZChlbGJvd09mZnNldCk7XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIGpvaW50IGFuZ2xlcy4gR2VuZXJhbGx5IDQwJSBvZiByb3RhdGlvbiBhcHBsaWVkIHRvIGVsYm93LCA2MCVcclxuICAgIC8vIHRvIHdyaXN0LCBidXQgaWYgY29udHJvbGxlciBpcyByYWlzZWQgaGlnaGVyLCBtb3JlIHJvdGF0aW9uIGNvbWVzIGZyb21cclxuICAgIC8vIHRoZSB3cmlzdC5cclxuICAgIGxldCB0b3RhbEFuZ2xlID0gdGhpcy5xdWF0QW5nbGVfKGNvbnRyb2xsZXJDYW1lcmFRLCBuZXcgVEhSRUUuUXVhdGVybmlvbigpKTtcclxuICAgIGxldCB0b3RhbEFuZ2xlRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyh0b3RhbEFuZ2xlKTtcclxuICAgIGxldCBsZXJwU3VwcHJlc3Npb24gPSAxIC0gTWF0aC5wb3codG90YWxBbmdsZURlZyAvIDE4MCwgNCk7IC8vIFRPRE8oc211cyk6ID8/P1xyXG5cclxuICAgIGxldCBlbGJvd1JhdGlvID0gRUxCT1dfQkVORF9SQVRJTztcclxuICAgIGxldCB3cmlzdFJhdGlvID0gMSAtIEVMQk9XX0JFTkRfUkFUSU87XHJcbiAgICBsZXQgbGVycFZhbHVlID0gbGVycFN1cHByZXNzaW9uICpcclxuICAgICAgICAoZWxib3dSYXRpbyArIHdyaXN0UmF0aW8gKiBleHRlbnNpb25SYXRpbyAqIEVYVEVOU0lPTl9SQVRJT19XRUlHSFQpO1xyXG5cclxuICAgIGxldCB3cmlzdFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNsZXJwKGNvbnRyb2xsZXJDYW1lcmFRLCBsZXJwVmFsdWUpO1xyXG4gICAgbGV0IGludldyaXN0USA9IHdyaXN0US5pbnZlcnNlKCk7XHJcbiAgICBsZXQgZWxib3dRID0gY29udHJvbGxlckNhbWVyYVEuY2xvbmUoKS5tdWx0aXBseShpbnZXcmlzdFEpO1xyXG5cclxuICAgIC8vIENhbGN1bGF0ZSBvdXIgZmluYWwgY29udHJvbGxlciBwb3NpdGlvbiBiYXNlZCBvbiBhbGwgb3VyIGpvaW50IHJvdGF0aW9uc1xyXG4gICAgLy8gYW5kIGxlbmd0aHMuXHJcbiAgICAvKlxyXG4gICAgcG9zaXRpb25fID1cclxuICAgICAgcm9vdF9yb3RfICogKFxyXG4gICAgICAgIGNvbnRyb2xsZXJfcm9vdF9vZmZzZXRfICtcclxuMjogICAgICAoYXJtX2V4dGVuc2lvbl8gKiBhbXRfZXh0ZW5zaW9uKSArXHJcbjE6ICAgICAgZWxib3dfcm90ICogKGtDb250cm9sbGVyRm9yZWFybSArICh3cmlzdF9yb3QgKiBrQ29udHJvbGxlclBvc2l0aW9uKSlcclxuICAgICAgKTtcclxuICAgICovXHJcbiAgICBsZXQgd3Jpc3RQb3MgPSB0aGlzLndyaXN0UG9zO1xyXG4gICAgd3Jpc3RQb3MuY29weShXUklTVF9DT05UUk9MTEVSX09GRlNFVCk7XHJcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24od3Jpc3RRKTtcclxuICAgIHdyaXN0UG9zLmFkZChFTEJPV19XUklTVF9PRkZTRVQpO1xyXG4gICAgd3Jpc3RQb3MuYXBwbHlRdWF0ZXJuaW9uKGVsYm93USk7XHJcbiAgICB3cmlzdFBvcy5hZGQodGhpcy5lbGJvd1Bvcyk7XHJcblxyXG4gICAgbGV0IG9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XHJcbiAgICBvZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xyXG5cclxuICAgIGxldCBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weSh0aGlzLndyaXN0UG9zKTtcclxuICAgIHBvc2l0aW9uLmFkZChvZmZzZXQpO1xyXG4gICAgcG9zaXRpb24uYXBwbHlRdWF0ZXJuaW9uKHRoaXMucm9vdFEpO1xyXG5cclxuICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcclxuXHJcbiAgICAvLyBTZXQgdGhlIHJlc3VsdGluZyBwb3NlIG9yaWVudGF0aW9uIGFuZCBwb3NpdGlvbi5cclxuICAgIHRoaXMucG9zZS5vcmllbnRhdGlvbi5jb3B5KG9yaWVudGF0aW9uKTtcclxuICAgIHRoaXMucG9zZS5wb3NpdGlvbi5jb3B5KHBvc2l0aW9uKTtcclxuXHJcbiAgICB0aGlzLmxhc3RUaW1lID0gdGhpcy50aW1lO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcG9zZSBjYWxjdWxhdGVkIGJ5IHRoZSBtb2RlbC5cclxuICAgKi9cclxuICBnZXRQb3NlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucG9zZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlYnVnIG1ldGhvZHMgZm9yIHJlbmRlcmluZyB0aGUgYXJtIG1vZGVsLlxyXG4gICAqL1xyXG4gIGdldEZvcmVhcm1MZW5ndGgoKSB7XHJcbiAgICByZXR1cm4gRUxCT1dfV1JJU1RfT0ZGU0VULmxlbmd0aCgpO1xyXG4gIH1cclxuXHJcbiAgZ2V0RWxib3dQb3NpdGlvbigpIHtcclxuICAgIGxldCBvdXQgPSB0aGlzLmVsYm93UG9zLmNsb25lKCk7XHJcbiAgICByZXR1cm4gb3V0LmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcclxuICB9XHJcblxyXG4gIGdldFdyaXN0UG9zaXRpb24oKSB7XHJcbiAgICBsZXQgb3V0ID0gdGhpcy53cmlzdFBvcy5jbG9uZSgpO1xyXG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XHJcbiAgfVxyXG5cclxuICBnZXRIZWFkWWF3T3JpZW50YXRpb25fKCkge1xyXG4gICAgbGV0IGhlYWRFdWxlciA9IG5ldyBUSFJFRS5FdWxlcigpLnNldEZyb21RdWF0ZXJuaW9uKHRoaXMuaGVhZFEsICdZWFonKTtcclxuICAgIGhlYWRFdWxlci54ID0gMDtcclxuICAgIGhlYWRFdWxlci56ID0gMDtcclxuICAgIGxldCBkZXN0aW5hdGlvblEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihoZWFkRXVsZXIpO1xyXG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uUTtcclxuICB9XHJcblxyXG4gIGNsYW1wXyh2YWx1ZSwgbWluLCBtYXgpIHtcclxuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWx1ZSwgbWluKSwgbWF4KTtcclxuICB9XHJcblxyXG4gIHF1YXRBbmdsZV8ocTEsIHEyKSB7XHJcbiAgICBsZXQgdmVjMSA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcclxuICAgIGxldCB2ZWMyID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpO1xyXG4gICAgdmVjMS5hcHBseVF1YXRlcm5pb24ocTEpO1xyXG4gICAgdmVjMi5hcHBseVF1YXRlcm5pb24ocTIpO1xyXG4gICAgcmV0dXJuIHZlYzEuYW5nbGVUbyh2ZWMyKTtcclxuICB9XHJcbn1cclxuIiwiLypcclxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5cclxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xyXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcclxuaW1wb3J0IHtpc01vYmlsZX0gZnJvbSAnLi91dGlsJ1xyXG5cclxuY29uc3QgRFJBR19ESVNUQU5DRV9QWCA9IDEwO1xyXG5cclxuLyoqXHJcbiAqIEVudW1lcmF0ZXMgYWxsIHBvc3NpYmxlIGludGVyYWN0aW9uIG1vZGVzLiBTZXRzIHVwIGFsbCBldmVudCBoYW5kbGVycyAobW91c2UsXHJcbiAqIHRvdWNoLCBldGMpLCBpbnRlcmZhY2VzIHdpdGggZ2FtZXBhZCBBUEkuXHJcbiAqXHJcbiAqIEVtaXRzIGV2ZW50czpcclxuICogICAgYWN0aW9uOiBJbnB1dCBpcyBhY3RpdmF0ZWQgKG1vdXNlZG93biwgdG91Y2hzdGFydCwgZGF5ZHJlYW0gY2xpY2ssIHZpdmVcclxuICogICAgdHJpZ2dlcikuXHJcbiAqICAgIHJlbGVhc2U6IElucHV0IGlzIGRlYWN0aXZhdGVkIChtb3VzZXVwLCB0b3VjaGVuZCwgZGF5ZHJlYW0gcmVsZWFzZSwgdml2ZVxyXG4gKiAgICByZWxlYXNlKS5cclxuICogICAgY2FuY2VsOiBJbnB1dCBpcyBjYW5jZWxlZCAoZWcuIHdlIHNjcm9sbGVkIGluc3RlYWQgb2YgdGFwcGluZyBvblxyXG4gKiAgICBtb2JpbGUvZGVza3RvcCkuXHJcbiAqICAgIHBvaW50ZXJtb3ZlKDJEIHBvc2l0aW9uKTogVGhlIHBvaW50ZXIgaXMgbW92ZWQgKG1vdXNlIG9yIHRvdWNoKS5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUNvbnRyb2xsZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG4gIGNvbnN0cnVjdG9yKG9wdF9lbCkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIGxldCBlbCA9IG9wdF9lbCB8fCB3aW5kb3c7XHJcblxyXG4gICAgLy8gSGFuZGxlIGludGVyYWN0aW9ucy5cclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZURvd25fLmJpbmQodGhpcykpO1xyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZV8uYmluZCh0aGlzKSk7XHJcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXBfLmJpbmQodGhpcykpO1xyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0Xy5iaW5kKHRoaXMpKTtcclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmVfLmJpbmQodGhpcykpO1xyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmRfLmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgcG9pbnRlci5cclxuICAgIHRoaXMucG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XHJcbiAgICAvLyBUaGUgcHJldmlvdXMgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXHJcbiAgICB0aGlzLmxhc3RQb2ludGVyID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcclxuICAgIC8vIFBvc2l0aW9uIG9mIHBvaW50ZXIgaW4gTm9ybWFsaXplZCBEZXZpY2UgQ29vcmRpbmF0ZXMgKE5EQykuXHJcbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xyXG4gICAgLy8gSG93IG11Y2ggd2UgaGF2ZSBkcmFnZ2VkIChpZiB3ZSBhcmUgZHJhZ2dpbmcpLlxyXG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xyXG4gICAgLy8gQXJlIHdlIGRyYWdnaW5nIG9yIG5vdC5cclxuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgLy8gSXMgcG9pbnRlciBhY3RpdmUgb3Igbm90LlxyXG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgLy8gR2FtZXBhZCBldmVudHMuXHJcbiAgICB0aGlzLmdhbWVwYWQgPSBudWxsO1xyXG5cclxuICAgIC8vIFZSIEV2ZW50cy5cclxuICAgIGlmICghbmF2aWdhdG9yLmdldFZSRGlzcGxheXMpIHtcclxuICAgICAgY29uc29sZS53YXJuKCdXZWJWUiBBUEkgbm90IGF2YWlsYWJsZSEgQ29uc2lkZXIgdXNpbmcgdGhlIHdlYnZyLXBvbHlmaWxsLicpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKChkaXNwbGF5cykgPT4ge1xyXG4gICAgICAgIHRoaXMudnJEaXNwbGF5ID0gZGlzcGxheXNbMF07XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0SW50ZXJhY3Rpb25Nb2RlKCkge1xyXG4gICAgLy8gVE9ETzogRGVidWdnaW5nIG9ubHkuXHJcbiAgICAvL3JldHVybiBJbnRlcmFjdGlvbk1vZGVzLkRBWURSRUFNO1xyXG5cclxuICAgIHZhciBnYW1lcGFkID0gdGhpcy5nZXRWUkdhbWVwYWRfKCk7XHJcblxyXG4gICAgaWYgKGdhbWVwYWQpIHtcclxuICAgICAgbGV0IHBvc2UgPSBnYW1lcGFkLnBvc2U7XHJcbiAgICAgIC8vIElmIHRoZXJlJ3MgYSBnYW1lcGFkIGNvbm5lY3RlZCwgZGV0ZXJtaW5lIGlmIGl0J3MgRGF5ZHJlYW0gb3IgYSBWaXZlLlxyXG4gICAgICBpZiAocG9zZS5oYXNQb3NpdGlvbikge1xyXG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0Y7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChwb3NlLmhhc09yaWVudGF0aW9uKSB7XHJcbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRjtcclxuICAgICAgfVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgaXQgbWlnaHQgYmUgQ2FyZGJvYXJkLCBtYWdpYyB3aW5kb3cgb3IgZGVza3RvcC5cclxuICAgICAgaWYgKGlzTW9iaWxlKCkpIHtcclxuICAgICAgICAvLyBFaXRoZXIgQ2FyZGJvYXJkIG9yIG1hZ2ljIHdpbmRvdywgZGVwZW5kaW5nIG9uIHdoZXRoZXIgd2UgYXJlXHJcbiAgICAgICAgLy8gcHJlc2VudGluZy5cclxuICAgICAgICBpZiAodGhpcy52ckRpc3BsYXkgJiYgdGhpcy52ckRpc3BsYXkuaXNQcmVzZW50aW5nKSB7XHJcbiAgICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gV2UgbXVzdCBiZSBvbiBkZXNrdG9wLlxyXG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLk1PVVNFO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBCeSBkZWZhdWx0LCB1c2UgVE9VQ0guXHJcbiAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcclxuICB9XHJcblxyXG4gIGdldEdhbWVwYWRQb3NlKCkge1xyXG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcclxuICAgIHJldHVybiBnYW1lcGFkLnBvc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgaWYgdGhlcmUgaXMgYW4gYWN0aXZlIHRvdWNoIGV2ZW50IGdvaW5nIG9uLlxyXG4gICAqIE9ubHkgcmVsZXZhbnQgb24gdG91Y2ggZGV2aWNlc1xyXG4gICAqL1xyXG4gIGdldElzVG91Y2hBY3RpdmUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5pc1RvdWNoQWN0aXZlO1xyXG4gIH1cclxuXHJcbiAgc2V0U2l6ZShzaXplKSB7XHJcbiAgICB0aGlzLnNpemUgPSBzaXplO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlKCkge1xyXG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xyXG4gICAgaWYgKG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GIHx8IG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GKSB7XHJcbiAgICAgIC8vIElmIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGdhbWVwYWQsIGNoZWNrIGV2ZXJ5IGFuaW1hdGlvbiBmcmFtZSBmb3IgYVxyXG4gICAgICAvLyBwcmVzc2VkIGFjdGlvbi5cclxuICAgICAgbGV0IGlzR2FtZXBhZFByZXNzZWQgPSB0aGlzLmdldEdhbWVwYWRCdXR0b25QcmVzc2VkXygpO1xyXG4gICAgICBpZiAoaXNHYW1lcGFkUHJlc3NlZCAmJiAhdGhpcy53YXNHYW1lcGFkUHJlc3NlZCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghaXNHYW1lcGFkUHJlc3NlZCAmJiB0aGlzLndhc0dhbWVwYWRQcmVzc2VkKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyYXl1cCcpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMud2FzR2FtZXBhZFByZXNzZWQgPSBpc0dhbWVwYWRQcmVzc2VkO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0R2FtZXBhZEJ1dHRvblByZXNzZWRfKCkge1xyXG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcclxuICAgIGlmICghZ2FtZXBhZCkge1xyXG4gICAgICAvLyBJZiB0aGVyZSdzIG5vIGdhbWVwYWQsIHRoZSBidXR0b24gd2FzIG5vdCBwcmVzc2VkLlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBDaGVjayBmb3IgY2xpY2tzLlxyXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBnYW1lcGFkLmJ1dHRvbnMubGVuZ3RoOyArK2opIHtcclxuICAgICAgaWYgKGdhbWVwYWQuYnV0dG9uc1tqXS5wcmVzc2VkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIG9uTW91c2VEb3duXyhlKSB7XHJcbiAgICB0aGlzLnN0YXJ0RHJhZ2dpbmdfKGUpO1xyXG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XHJcbiAgfVxyXG5cclxuICBvbk1vdXNlTW92ZV8oZSkge1xyXG4gICAgdGhpcy51cGRhdGVQb2ludGVyXyhlKTtcclxuICAgIHRoaXMudXBkYXRlRHJhZ0Rpc3RhbmNlXygpO1xyXG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XHJcbiAgfVxyXG5cclxuICBvbk1vdXNlVXBfKGUpIHtcclxuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XHJcbiAgfVxyXG5cclxuICBvblRvdWNoU3RhcnRfKGUpIHtcclxuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IHRydWU7XHJcbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcclxuICAgIHRoaXMuc3RhcnREcmFnZ2luZ18odCk7XHJcbiAgICB0aGlzLnVwZGF0ZVRvdWNoUG9pbnRlcl8oZSk7XHJcblxyXG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XHJcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nKTtcclxuXHJcbiAgICAvLyBQcmV2ZW50IHN5bnRoZXRpYyBtb3VzZSBldmVudCBmcm9tIGJlaW5nIGNyZWF0ZWQuXHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfVxyXG5cclxuICBvblRvdWNoTW92ZV8oZSkge1xyXG4gICAgdGhpcy51cGRhdGVUb3VjaFBvaW50ZXJfKGUpO1xyXG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XHJcblxyXG4gICAgLy8gUHJldmVudCBzeW50aGV0aWMgbW91c2UgZXZlbnQgZnJvbSBiZWluZyBjcmVhdGVkLlxyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH1cclxuXHJcbiAgb25Ub3VjaEVuZF8oZSkge1xyXG4gICAgdGhpcy5lbmREcmFnZ2luZ18oKTtcclxuXHJcbiAgICAvLyBQcmV2ZW50IHN5bnRoZXRpYyBtb3VzZSBldmVudCBmcm9tIGJlaW5nIGNyZWF0ZWQuXHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVRvdWNoUG9pbnRlcl8oZSkge1xyXG4gICAgLy8gSWYgdGhlcmUncyBubyB0b3VjaGVzIGFycmF5LCBpZ25vcmUuXHJcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBjb25zb2xlLndhcm4oJ1JlY2VpdmVkIHRvdWNoIGV2ZW50IHdpdGggbm8gdG91Y2hlcy4nKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIHQgPSBlLnRvdWNoZXNbMF07XHJcbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKHQpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlUG9pbnRlcl8oZSkge1xyXG4gICAgLy8gSG93IG11Y2ggdGhlIHBvaW50ZXIgbW92ZWQuXHJcbiAgICB0aGlzLnBvaW50ZXIuc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuICAgIHRoaXMucG9pbnRlck5kYy54ID0gKGUuY2xpZW50WCAvIHRoaXMuc2l6ZS53aWR0aCkgKiAyIC0gMTtcclxuICAgIHRoaXMucG9pbnRlck5kYy55ID0gLSAoZS5jbGllbnRZIC8gdGhpcy5zaXplLmhlaWdodCkgKiAyICsgMTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZURyYWdEaXN0YW5jZV8oKSB7XHJcbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKSB7XHJcbiAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMubGFzdFBvaW50ZXIuc3ViKHRoaXMucG9pbnRlcikubGVuZ3RoKCk7XHJcbiAgICAgIHRoaXMuZHJhZ0Rpc3RhbmNlICs9IGRpc3RhbmNlO1xyXG4gICAgICB0aGlzLmxhc3RQb2ludGVyLmNvcHkodGhpcy5wb2ludGVyKTtcclxuXHJcblxyXG4gICAgICAvL2NvbnNvbGUubG9nKCdkcmFnRGlzdGFuY2UnLCB0aGlzLmRyYWdEaXN0YW5jZSk7XHJcbiAgICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA+IERSQUdfRElTVEFOQ0VfUFgpIHtcclxuICAgICAgICB0aGlzLmVtaXQoJ3JheWNhbmNlbCcpO1xyXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzdGFydERyYWdnaW5nXyhlKSB7XHJcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xyXG4gICAgdGhpcy5sYXN0UG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG4gIH1cclxuXHJcbiAgZW5kRHJhZ2dpbmdfKCkge1xyXG4gICAgaWYgKHRoaXMuZHJhZ0Rpc3RhbmNlIDwgRFJBR19ESVNUQU5DRV9QWCkge1xyXG4gICAgICB0aGlzLmVtaXQoJ3JheXVwJyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRyYWdEaXN0YW5jZSA9IDA7XHJcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGZpcnN0IFZSLWVuYWJsZWQgZ2FtZXBhZC5cclxuICAgKi9cclxuICBnZXRWUkdhbWVwYWRfKCkge1xyXG4gICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkIEFQSSwgdGhlcmUncyBubyBnYW1lcGFkLlxyXG4gICAgaWYgKCFuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGdhbWVwYWRzID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKCk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVwYWRzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIHZhciBnYW1lcGFkID0gZ2FtZXBhZHNbaV07XHJcblxyXG4gICAgICAvLyBUaGUgYXJyYXkgbWF5IGNvbnRhaW4gdW5kZWZpbmVkIGdhbWVwYWRzLCBzbyBjaGVjayBmb3IgdGhhdCBhcyB3ZWxsIGFzXHJcbiAgICAgIC8vIGEgbm9uLW51bGwgcG9zZS5cclxuICAgICAgaWYgKGdhbWVwYWQgJiYgZ2FtZXBhZC5wb3NlKSB7XHJcbiAgICAgICAgcmV0dXJuIGdhbWVwYWQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG4iLCIvKlxyXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xyXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXHJcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxyXG4gKlxyXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICovXHJcblxyXG5pbXBvcnQgT3JpZW50YXRpb25Bcm1Nb2RlbCBmcm9tICcuL29yaWVudGF0aW9uLWFybS1tb2RlbCdcclxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJ1xyXG5pbXBvcnQgUmF5UmVuZGVyZXIgZnJvbSAnLi9yYXktcmVuZGVyZXInXHJcbmltcG9ydCBSYXlDb250cm9sbGVyIGZyb20gJy4vcmF5LWNvbnRyb2xsZXInXHJcbmltcG9ydCBJbnRlcmFjdGlvbk1vZGVzIGZyb20gJy4vcmF5LWludGVyYWN0aW9uLW1vZGVzJ1xyXG5cclxuLyoqXHJcbiAqIEFQSSB3cmFwcGVyIGZvciB0aGUgaW5wdXQgbGlicmFyeS5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUlucHV0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuICBjb25zdHJ1Y3RvcihjYW1lcmEsIG9wdF9lbCwgdnJEaXNwbGF5KSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuY2FtZXJhID0gY2FtZXJhO1xyXG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBSYXlSZW5kZXJlcihjYW1lcmEpO1xyXG4gICAgdGhpcy5jb250cm9sbGVyID0gbmV3IFJheUNvbnRyb2xsZXIob3B0X2VsKTtcclxuICAgIHRoaXMudnJEaXNwbGF5ID0gdnJEaXNwbGF5O1xyXG4gICAgY29uc29sZS5sb2codnJEaXNwbGF5KTtcclxuXHJcbiAgICAvLyBBcm0gbW9kZWwgbmVlZGVkIHRvIHRyYW5zZm9ybSBjb250cm9sbGVyIG9yaWVudGF0aW9uIGludG8gcHJvcGVyIHBvc2UuXHJcbiAgICB0aGlzLmFybU1vZGVsID0gbmV3IE9yaWVudGF0aW9uQXJtTW9kZWwoKTtcclxuXHJcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWRvd24nLCB0aGlzLm9uUmF5RG93bl8uYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheXVwJywgdGhpcy5vblJheVVwXy5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuY29udHJvbGxlci5vbigncmF5Y2FuY2VsJywgdGhpcy5vblJheUNhbmNlbF8uYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3BvaW50ZXJtb3ZlJywgdGhpcy5vblBvaW50ZXJNb3ZlXy5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMucmVuZGVyZXIub24oJ3JheW92ZXInLCAobWVzaCkgPT4geyB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKSB9KTtcclxuICAgIHRoaXMucmVuZGVyZXIub24oJ3JheW91dCcsIChtZXNoKSA9PiB7IHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCkgfSk7XHJcblxyXG4gICAgLy8gQnkgZGVmYXVsdCwgcHV0IHRoZSBwb2ludGVyIG9mZnNjcmVlbi5cclxuICAgIHRoaXMucG9pbnRlck5kYyA9IG5ldyBUSFJFRS5WZWN0b3IyKDEsIDEpO1xyXG5cclxuICAgIC8vIEV2ZW50IGhhbmRsZXJzLlxyXG4gICAgdGhpcy5oYW5kbGVycyA9IHt9O1xyXG4gIH1cclxuXHJcbiAgYWRkKG9iamVjdCwgaGFuZGxlcnMpIHtcclxuICAgIHRoaXMucmVuZGVyZXIuYWRkKG9iamVjdCwgaGFuZGxlcnMpO1xyXG4gICAgdGhpcy5oYW5kbGVyc1tvYmplY3QuaWRdID0gaGFuZGxlcnM7XHJcbiAgfVxyXG5cclxuICByZW1vdmUob2JqZWN0KSB7XHJcbiAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZShvYmplY3QpO1xyXG4gICAgZGVsZXRlIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlKCkge1xyXG4gICAgbGV0IGxvb2tBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcclxuICAgIGxvb2tBdC5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XHJcblxyXG4gICAgbGV0IG1vZGUgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XHJcbiAgICBzd2l0Y2ggKG1vZGUpIHtcclxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLk1PVVNFOlxyXG4gICAgICAgIC8vIERlc2t0b3AgbW91c2UgbW9kZSwgbW91c2UgY29vcmRpbmF0ZXMgYXJlIHdoYXQgbWF0dGVycy5cclxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvaW50ZXIodGhpcy5wb2ludGVyTmRjKTtcclxuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHJldGljbGUuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcclxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJldGljbGVWaXNpYmlsaXR5KGZhbHNlKTtcclxuXHJcbiAgICAgICAgLy8gSW4gbW91c2UgbW9kZSByYXkgcmVuZGVyZXIgaXMgYWx3YXlzIGFjdGl2ZS5cclxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDpcclxuICAgICAgICAvLyBNb2JpbGUgbWFnaWMgd2luZG93IG1vZGUuIFRvdWNoIGNvb3JkaW5hdGVzIG1hdHRlciwgYnV0IHdlIHdhbnQgdG9cclxuICAgICAgICAvLyBoaWRlIHRoZSByZXRpY2xlLlxyXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9pbnRlcih0aGlzLnBvaW50ZXJOZGMpO1xyXG5cclxuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHRoZSByZXRpY2xlLlxyXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eShmYWxzZSk7XHJcblxyXG4gICAgICAgIC8vIEluIHRvdWNoIG1vZGUgdGhlIHJheSByZW5kZXJlciBpcyBvbmx5IGFjdGl2ZSBvbiB0b3VjaC5cclxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0aGlzLmNvbnRyb2xsZXIuZ2V0SXNUb3VjaEFjdGl2ZSgpKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GOlxyXG4gICAgICAgIC8vIENhcmRib2FyZCBtb2RlLCB3ZSdyZSBkZWFsaW5nIHdpdGggYSBnYXplIHJldGljbGUuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb3NpdGlvbih0aGlzLmNhbWVyYS5wb3NpdGlvbik7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcclxuXHJcbiAgICAgICAgLy8gUmV0aWNsZSBvbmx5LlxyXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eSh0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIEludGVyYWN0aW9uTW9kZXMuVlJfM0RPRjpcclxuICAgICAgICAvLyBEYXlkcmVhbSwgb3VyIG9yaWdpbiBpcyBzbGlnaHRseSBvZmYgKGRlcGVuZGluZyBvbiBoYW5kZWRuZXNzKS5cclxuICAgICAgICAvLyBCdXQgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoZSBvcmllbnRhdGlvbiBmcm9tIHRoZSBnYW1lcGFkLlxyXG4gICAgICAgIC8vIFRPRE8oc211cyk6IEltcGxlbWVudCB0aGUgcmVhbCBhcm0gbW9kZWwuXHJcbiAgICAgICAgdmFyIHBvc2UgPSB0aGlzLmNvbnRyb2xsZXIuZ2V0R2FtZXBhZFBvc2UoKTtcclxuXHJcbiAgICAgICAgLy8gRGVidWcgb25seTogdXNlIGNhbWVyYSBhcyBpbnB1dCBjb250cm9sbGVyLlxyXG4gICAgICAgIC8vbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IHRoaXMuY2FtZXJhLnF1YXRlcm5pb247XHJcbiAgICAgICAgbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xyXG5cclxuICAgICAgICAvLyBUcmFuc2Zvcm0gdGhlIGNvbnRyb2xsZXIgaW50byB0aGUgY2FtZXJhIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLm11bHRpcGx5KFxyXG4gICAgICAgICAgICBuZXcgVEhSRUUuUXVhdGVybmlvbigpLnNldEZyb21BeGlzQW5nbGUobmV3IFRIUkVFLlZlY3RvcjMoMCwgMSwgMCksIE1hdGguUEkpKTtcclxuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueCAqPSAtMTtcclxuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueiAqPSAtMTtcclxuICAgICAgICAqL1xyXG5cclxuICAgICAgICAvLyBGZWVkIGNhbWVyYSBhbmQgY29udHJvbGxlciBpbnRvIHRoZSBhcm0gbW9kZWwuXHJcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkT3JpZW50YXRpb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XHJcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkUG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xyXG4gICAgICAgIHRoaXMuYXJtTW9kZWwuc2V0Q29udHJvbGxlck9yaWVudGF0aW9uKGNvbnRyb2xsZXJPcmllbnRhdGlvbik7XHJcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC51cGRhdGUoKTtcclxuXHJcbiAgICAgICAgLy8gR2V0IHJlc3VsdGluZyBwb3NlIGFuZCBjb25maWd1cmUgdGhlIHJlbmRlcmVyLlxyXG4gICAgICAgIGxldCBtb2RlbFBvc2UgPSB0aGlzLmFybU1vZGVsLmdldFBvc2UoKTtcclxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG1vZGVsUG9zZS5wb3NpdGlvbik7XHJcbiAgICAgICAgLy90aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG5ldyBUSFJFRS5WZWN0b3IzKCkpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24obW9kZWxQb3NlLm9yaWVudGF0aW9uKTtcclxuICAgICAgICAvL3RoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24oY29udHJvbGxlck9yaWVudGF0aW9uKTtcclxuXHJcbiAgICAgICAgLy8gU2hvdyByYXkgYW5kIHJldGljbGUuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XHJcblxyXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxyXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0Y6XHJcbiAgICAgICAgLy8gVml2ZSwgb3JpZ2luIGRlcGVuZHMgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSBjb250cm9sbGVyLlxyXG4gICAgICAgIC8vIFRPRE8oc211cykuLi5cclxuICAgICAgICB2YXIgcG9zZSA9IHRoaXMuY29udHJvbGxlci5nZXRHYW1lcGFkUG9zZSgpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayB0aGF0IHRoZSBwb3NlIGlzIHZhbGlkLlxyXG4gICAgICAgIGlmICghcG9zZS5vcmllbnRhdGlvbiB8fCAhcG9zZS5wb3NpdGlvbikge1xyXG4gICAgICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIGdhbWVwYWQgcG9zZS4gQ2FuXFwndCB1cGRhdGUgcmF5LicpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmZyb21BcnJheShwb3NlLm9yaWVudGF0aW9uKTtcclxuICAgICAgICBsZXQgcG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShwb3NlLnBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudnJEaXNwbGF5ICYmIHRoaXMudnJEaXNwbGF5LnN0YWdlUGFyYW1ldGVycykge1xyXG4gICAgICAgICAgbGV0IGNvbXBvc2VkID0gbmV3IFRIUkVFLk1hdHJpeDQoKTtcclxuICAgICAgICAgIGxldCBzdGFnZVBhcmFtZXRlcnMgPSBuZXcgVEhSRUUuTWF0cml4NCgpLmZyb21BcnJheShcclxuICAgICAgICAgICAgdGhpcy52ckRpc3BsYXkuc3RhZ2VQYXJhbWV0ZXJzLnNpdHRpbmdUb1N0YW5kaW5nVHJhbnNmb3JtKTtcclxuICAgICAgICAgIGNvbXBvc2VkLm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKG9yaWVudGF0aW9uKTtcclxuICAgICAgICAgIGNvbXBvc2VkLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcclxuICAgICAgICAgIGNvbXBvc2VkLnByZW11bHRpcGx5KHN0YWdlUGFyYW1ldGVycyk7XHJcblxyXG4gICAgICAgICAgbGV0IHN0YW5kaW5nT3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xyXG4gICAgICAgICAgbGV0IHN0YW5kaW5nUG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xyXG4gICAgICAgICAgbGV0IHN0YW5kaW5nU2NhbGUgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xyXG4gICAgICAgICAgY29tcG9zZWQuZGVjb21wb3NlKHN0YW5kaW5nUG9zaXRpb24sIHN0YW5kaW5nT3JpZW50YXRpb24sIHN0YW5kaW5nU2NhbGUpO1xyXG5cclxuICAgICAgICAgIHRoaXMucmVuZGVyZXIuc2V0T3JpZW50YXRpb24oc3RhbmRpbmdPcmllbnRhdGlvbik7XHJcbiAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHN0YW5kaW5nUG9zaXRpb24pOyAgICAgICAgICBcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihvcmllbnRhdGlvbik7XHJcbiAgICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHBvc2l0aW9uKTsgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLy8gU2hvdyByYXkgYW5kIHJldGljbGUuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KHRydWUpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XHJcblxyXG4gICAgICAgIC8vIFJheSByZW5kZXJlciBhbHdheXMgYWN0aXZlLlxyXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdVbmtub3duIGludGVyYWN0aW9uIG1vZGUuJyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZSgpO1xyXG4gICAgdGhpcy5jb250cm9sbGVyLnVwZGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgc2V0U2l6ZShzaXplKSB7XHJcbiAgICB0aGlzLmNvbnRyb2xsZXIuc2V0U2l6ZShzaXplKTtcclxuICB9XHJcblxyXG4gIGdldE1lc2goKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRSZXRpY2xlUmF5TWVzaCgpO1xyXG4gIH1cclxuXHJcbiAgZ2V0T3JpZ2luKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZXIuZ2V0T3JpZ2luKCk7XHJcbiAgfVxyXG5cclxuICBnZXREaXJlY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXREaXJlY3Rpb24oKTtcclxuICB9XHJcblxyXG4gIGdldFJpZ2h0RGlyZWN0aW9uKCkge1xyXG4gICAgbGV0IGxvb2tBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcclxuICAgIGxvb2tBdC5hcHBseVF1YXRlcm5pb24odGhpcy5jYW1lcmEucXVhdGVybmlvbik7XHJcbiAgICByZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoKS5jcm9zc1ZlY3RvcnMobG9va0F0LCB0aGlzLmNhbWVyYS51cCk7XHJcbiAgfVxyXG5cclxuICBvblJheURvd25fKGUpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ29uUmF5RG93bl8nKTtcclxuXHJcbiAgICAvLyBGb3JjZSB0aGUgcmVuZGVyZXIgdG8gcmF5Y2FzdC5cclxuICAgIHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XHJcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XHJcbiAgICB0aGlzLmVtaXQoJ3JheWRvd24nLCBtZXNoKTtcclxuXHJcbiAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0cnVlKTtcclxuICB9XHJcblxyXG4gIG9uUmF5VXBfKGUpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ29uUmF5VXBfJyk7XHJcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XHJcbiAgICB0aGlzLmVtaXQoJ3JheXVwJywgbWVzaCk7XHJcblxyXG4gICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUoZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgb25SYXlDYW5jZWxfKGUpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ29uUmF5Q2FuY2VsXycpO1xyXG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xyXG4gICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnLCBtZXNoKTtcclxuICB9XHJcblxyXG4gIG9uUG9pbnRlck1vdmVfKG5kYykge1xyXG4gICAgdGhpcy5wb2ludGVyTmRjLmNvcHkobmRjKTtcclxuICB9XHJcbn1cclxuIiwiLypcclxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5cclxudmFyIEludGVyYWN0aW9uTW9kZXMgPSB7XHJcbiAgTU9VU0U6IDEsXHJcbiAgVE9VQ0g6IDIsXHJcbiAgVlJfMERPRjogMyxcclxuICBWUl8zRE9GOiA0LFxyXG4gIFZSXzZET0Y6IDVcclxufTtcclxuXHJcbmV4cG9ydCB7IEludGVyYWN0aW9uTW9kZXMgYXMgZGVmYXVsdCB9O1xyXG4iLCIvKlxyXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xyXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXHJcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxyXG4gKlxyXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICovXHJcblxyXG5pbXBvcnQge2Jhc2U2NH0gZnJvbSAnLi91dGlsJ1xyXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXHJcblxyXG5jb25zdCBSRVRJQ0xFX0RJU1RBTkNFID0gMztcclxuY29uc3QgSU5ORVJfUkFESVVTID0gMC4wMjtcclxuY29uc3QgT1VURVJfUkFESVVTID0gMC4wNDtcclxuY29uc3QgUkFZX1JBRElVUyA9IDAuMDI7XHJcbmNvbnN0IEdSQURJRU5UX0lNQUdFID0gYmFzZTY0KCdpbWFnZS9wbmcnLCAnaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUlBQUFBQ0FDQVlBQUFERFBtSExBQUFCZGtsRVFWUjRuTzNXd1hIRVFBd0RRY2luL0ZPV3crQmp1aVBZQjJxNEcyblA5MzNQOVNPNDgyNHpnREFEaURPQXVIZmIzL1VqdUtNQWNRWVFad0J4L2dCeENoQ25BSEVLRUtjQWNRb1Fwd0J4Q2hDbkFIRUdFR2NBY2Y0QWNRb1Fad0J4QmhCbkFIRUdFR2NBY1FZUVp3QnhCaEJuQUhFR0VHY0FjUVlRWndCeEJoQm5BSEh2dHQvMUk3aWpBSEVHRUdjQWNmNEFjUW9RWndCeFRrQ2NBc1FaUUp3VEVLY0FjUW9RcHdCeEJoRG5CTVFwUUp3Q3hDbEFuQUxFS1VDY0FzUXBRSndDeENsQW5BTEVLVUNjQXNRcFFKd0J4RGtCY1FvUXB3QnhDaENuQUhFS0VLY0FjUW9RcHdCeENoQ25BSEVLRUdjQWNVNUFuQUxFS1VDY0FzUVpRSndURUtjQWNRWVE1d1RFS1VDY0FjUVpRSncvUUp3Q3hCbEFuQUhFR1VDY0FjUVpRSndCeEJsQW5BSEVHVUNjQWNRWlFKd0J4QmxBbkFIRUdVRGN1KzI1ZmdSM0ZDRE9BT0lNSU00ZklFNEI0aFFnVGdIaUZDQk9BZUlVSUU0QjRoUWd6Z0RpRENET0h5Qk9BZUlNSU00QTR2NEIvNUlGOWVENlF4Z0FBQUFBU1VWT1JLNUNZSUk9Jyk7XHJcblxyXG4vKipcclxuICogSGFuZGxlcyByYXkgaW5wdXQgc2VsZWN0aW9uIGZyb20gZnJhbWUgb2YgcmVmZXJlbmNlIG9mIGFuIGFyYml0cmFyeSBvYmplY3QuXHJcbiAqXHJcbiAqIFRoZSBzb3VyY2Ugb2YgdGhlIHJheSBpcyBmcm9tIHZhcmlvdXMgbG9jYXRpb25zOlxyXG4gKlxyXG4gKiBEZXNrdG9wOiBtb3VzZS5cclxuICogTWFnaWMgd2luZG93OiB0b3VjaC5cclxuICogQ2FyZGJvYXJkOiBjYW1lcmEuXHJcbiAqIERheWRyZWFtOiAzRE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXHJcbiAqIFZpdmU6IDZET0YgY29udHJvbGxlciB2aWEgZ2FtZXBhZCAoYW5kIHNob3cgcmF5KS5cclxuICpcclxuICogRW1pdHMgc2VsZWN0aW9uIGV2ZW50czpcclxuICogICAgIHJheW92ZXIobWVzaCk6IFRoaXMgbWVzaCB3YXMgc2VsZWN0ZWQuXHJcbiAqICAgICByYXlvdXQobWVzaCk6IFRoaXMgbWVzaCB3YXMgdW5zZWxlY3RlZC5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheVJlbmRlcmVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuICBjb25zdHJ1Y3RvcihjYW1lcmEsIG9wdF9wYXJhbXMpIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XHJcblxyXG4gICAgdmFyIHBhcmFtcyA9IG9wdF9wYXJhbXMgfHwge307XHJcblxyXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgaW50ZXJhY3RpdmUgKGtleWVkIG9uIGlkKS5cclxuICAgIHRoaXMubWVzaGVzID0ge307XHJcblxyXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgY3VycmVudGx5IHNlbGVjdGVkIChrZXllZCBvbiBpZCkuXHJcbiAgICB0aGlzLnNlbGVjdGVkID0ge307XHJcblxyXG4gICAgLy8gVGhlIHJheWNhc3Rlci5cclxuICAgIHRoaXMucmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xyXG5cclxuICAgIC8vIFBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiwgaW4gYWRkaXRpb24uXHJcbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcclxuICAgIHRoaXMub3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xyXG5cclxuICAgIHRoaXMucm9vdCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xyXG5cclxuICAgIC8vIEFkZCB0aGUgcmV0aWNsZSBtZXNoIHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXHJcbiAgICB0aGlzLnJldGljbGUgPSB0aGlzLmNyZWF0ZVJldGljbGVfKCk7XHJcbiAgICB0aGlzLnJvb3QuYWRkKHRoaXMucmV0aWNsZSk7XHJcblxyXG4gICAgLy8gQWRkIHRoZSByYXkgdG8gdGhlIHJvb3Qgb2YgdGhlIG9iamVjdC5cclxuICAgIHRoaXMucmF5ID0gdGhpcy5jcmVhdGVSYXlfKCk7XHJcbiAgICB0aGlzLnJvb3QuYWRkKHRoaXMucmF5KTtcclxuXHJcbiAgICAvLyBIb3cgZmFyIHRoZSByZXRpY2xlIGlzIGN1cnJlbnRseSBmcm9tIHRoZSByZXRpY2xlIG9yaWdpbi5cclxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVyIGFuIG9iamVjdCBzbyB0aGF0IGl0IGNhbiBiZSBpbnRlcmFjdGVkIHdpdGguXHJcbiAgICovXHJcbiAgYWRkKG9iamVjdCkge1xyXG4gICAgdGhpcy5tZXNoZXNbb2JqZWN0LmlkXSA9IG9iamVjdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFByZXZlbnQgYW4gb2JqZWN0IGZyb20gYmVpbmcgaW50ZXJhY3RlZCB3aXRoLlxyXG4gICAqL1xyXG4gIHJlbW92ZShvYmplY3QpIHtcclxuICAgIHZhciBpZCA9IG9iamVjdC5pZDtcclxuICAgIGlmICghdGhpcy5tZXNoZXNbaWRdKSB7XHJcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZXhpc3RpbmcgbWVzaCwgd2UgY2FuJ3QgcmVtb3ZlIGl0LlxyXG4gICAgICBkZWxldGUgdGhpcy5tZXNoZXNbaWRdO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBjdXJyZW50bHkgc2VsZWN0ZWQsIHJlbW92ZSBpdC5cclxuICAgIGlmICh0aGlzLnNlbGVjdGVkW2lkXSkge1xyXG4gICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFtvYmplY3QuaWRdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlKCkge1xyXG4gICAgLy8gRG8gdGhlIHJheWNhc3RpbmcgYW5kIGlzc3VlIHZhcmlvdXMgZXZlbnRzIGFzIG5lZWRlZC5cclxuICAgIGZvciAobGV0IGlkIGluIHRoaXMubWVzaGVzKSB7XHJcbiAgICAgIGxldCBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xyXG4gICAgICBsZXQgaW50ZXJzZWN0cyA9IHRoaXMucmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdChtZXNoLCB0cnVlKTtcclxuICAgICAgaWYgKGludGVyc2VjdHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybignVW5leHBlY3RlZDogbXVsdGlwbGUgbWVzaGVzIGludGVyc2VjdGVkLicpO1xyXG4gICAgICB9XHJcbiAgICAgIGxldCBpc0ludGVyc2VjdGVkID0gKGludGVyc2VjdHMubGVuZ3RoID4gMCk7XHJcbiAgICAgIGxldCBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFtpZF07XHJcblxyXG4gICAgICAvLyBJZiBpdCdzIG5ld2x5IHNlbGVjdGVkLCBzZW5kIHJheW92ZXIuXHJcbiAgICAgIGlmIChpc0ludGVyc2VjdGVkICYmICFpc1NlbGVjdGVkKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZFtpZF0gPSB0cnVlO1xyXG4gICAgICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XHJcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIGl0J3Mgbm8gbG9uZ2VyIGludGVyc2VjdGVkLCBzZW5kIHJheW91dC5cclxuICAgICAgaWYgKCFpc0ludGVyc2VjdGVkICYmIGlzU2VsZWN0ZWQpIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFtpZF07XHJcbiAgICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8obnVsbCk7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcclxuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaXNJbnRlcnNlY3RlZCkge1xyXG4gICAgICAgIHRoaXMubW92ZVJldGljbGVfKGludGVyc2VjdHMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBvcmlnaW4gb2YgdGhlIHJheS5cclxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yIFBvc2l0aW9uIG9mIHRoZSBvcmlnaW4gb2YgdGhlIHBpY2tpbmcgcmF5LlxyXG4gICAqL1xyXG4gIHNldFBvc2l0aW9uKHZlY3Rvcikge1xyXG4gICAgdGhpcy5wb3NpdGlvbi5jb3B5KHZlY3Rvcik7XHJcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkodmVjdG9yKTtcclxuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xyXG4gIH1cclxuXHJcbiAgZ2V0T3JpZ2luKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHJheS5cclxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yIFVuaXQgdmVjdG9yIGNvcnJlc3BvbmRpbmcgdG8gZGlyZWN0aW9uLlxyXG4gICAqL1xyXG4gIHNldE9yaWVudGF0aW9uKHF1YXRlcm5pb24pIHtcclxuICAgIHRoaXMub3JpZW50YXRpb24uY29weShxdWF0ZXJuaW9uKTtcclxuXHJcbiAgICB2YXIgcG9pbnRBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XHJcbiAgICB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uLmNvcHkocG9pbnRBdClcclxuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGlyZWN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwb2ludGVyIG9uIHRoZSBzY3JlZW4gZm9yIGNhbWVyYSArIHBvaW50ZXIgYmFzZWQgcGlja2luZy4gVGhpc1xyXG4gICAqIHN1cGVyc2NlZGVzIG9yaWdpbiBhbmQgZGlyZWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtWZWN0b3IyfSB2ZWN0b3IgVGhlIHBvc2l0aW9uIG9mIHRoZSBwb2ludGVyIChzY3JlZW4gY29vcmRzKS5cclxuICAgKi9cclxuICBzZXRQb2ludGVyKHZlY3Rvcikge1xyXG4gICAgdGhpcy5yYXljYXN0ZXIuc2V0RnJvbUNhbWVyYSh2ZWN0b3IsIHRoaXMuY2FtZXJhKTtcclxuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbWVzaCwgd2hpY2ggaW5jbHVkZXMgcmV0aWNsZSBhbmQvb3IgcmF5LiBUaGlzIG1lc2ggaXMgdGhlbiBhZGRlZFxyXG4gICAqIHRvIHRoZSBzY2VuZS5cclxuICAgKi9cclxuICBnZXRSZXRpY2xlUmF5TWVzaCgpIHtcclxuICAgIHJldHVybiB0aGlzLnJvb3Q7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgb2JqZWN0IGluIHRoZSBzY2VuZS5cclxuICAgKi9cclxuICBnZXRTZWxlY3RlZE1lc2goKSB7XHJcbiAgICBsZXQgY291bnQgPSAwO1xyXG4gICAgbGV0IG1lc2ggPSBudWxsO1xyXG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5zZWxlY3RlZCkge1xyXG4gICAgICBjb3VudCArPSAxO1xyXG4gICAgICBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xyXG4gICAgfVxyXG4gICAgaWYgKGNvdW50ID4gMSkge1xyXG4gICAgICBjb25zb2xlLndhcm4oJ01vcmUgdGhhbiBvbmUgbWVzaCBzZWxlY3RlZC4nKTtcclxuICAgIH1cclxuICAgIHJldHVybiBtZXNoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGlkZXMgYW5kIHNob3dzIHRoZSByZXRpY2xlLlxyXG4gICAqL1xyXG4gIHNldFJldGljbGVWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xyXG4gICAgdGhpcy5yZXRpY2xlLnZpc2libGUgPSBpc1Zpc2libGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbmFibGVzIG9yIGRpc2FibGVzIHRoZSByYXljYXN0aW5nIHJheSB3aGljaCBncmFkdWFsbHkgZmFkZXMgb3V0IGZyb21cclxuICAgKiB0aGUgb3JpZ2luLlxyXG4gICAqL1xyXG4gIHNldFJheVZpc2liaWxpdHkoaXNWaXNpYmxlKSB7XHJcbiAgICB0aGlzLnJheS52aXNpYmxlID0gaXNWaXNpYmxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW5hYmxlcyBhbmQgZGlzYWJsZXMgdGhlIHJheWNhc3Rlci4gRm9yIHRvdWNoLCB3aGVyZSBmaW5nZXIgdXAgbWVhbnMgd2VcclxuICAgKiBzaG91bGRuJ3QgYmUgcmF5Y2FzdGluZy5cclxuICAgKi9cclxuICBzZXRBY3RpdmUoaXNBY3RpdmUpIHtcclxuICAgIC8vIElmIG5vdGhpbmcgY2hhbmdlZCwgZG8gbm90aGluZy5cclxuICAgIGlmICh0aGlzLmlzQWN0aXZlID09IGlzQWN0aXZlKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIC8vIFRPRE8oc211cyk6IFNob3cgdGhlIHJheSBvciByZXRpY2xlIGFkanVzdCBpbiByZXNwb25zZS5cclxuICAgIHRoaXMuaXNBY3RpdmUgPSBpc0FjdGl2ZTtcclxuXHJcbiAgICBpZiAoIWlzQWN0aXZlKSB7XHJcbiAgICAgIHRoaXMubW92ZVJldGljbGVfKG51bGwpO1xyXG4gICAgICBmb3IgKGxldCBpZCBpbiB0aGlzLnNlbGVjdGVkKSB7XHJcbiAgICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuc2VsZWN0ZWRbaWRdO1xyXG4gICAgICAgIHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHVwZGF0ZVJheWNhc3Rlcl8oKSB7XHJcbiAgICB2YXIgcmF5ID0gdGhpcy5yYXljYXN0ZXIucmF5O1xyXG5cclxuICAgIC8vIFBvc2l0aW9uIHRoZSByZXRpY2xlIGF0IGEgZGlzdGFuY2UsIGFzIGNhbGN1bGF0ZWQgZnJvbSB0aGUgb3JpZ2luIGFuZFxyXG4gICAgLy8gZGlyZWN0aW9uLlxyXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5yZXRpY2xlLnBvc2l0aW9uO1xyXG4gICAgcG9zaXRpb24uY29weShyYXkuZGlyZWN0aW9uKTtcclxuICAgIHBvc2l0aW9uLm11bHRpcGx5U2NhbGFyKHRoaXMucmV0aWNsZURpc3RhbmNlKTtcclxuICAgIHBvc2l0aW9uLmFkZChyYXkub3JpZ2luKTtcclxuXHJcbiAgICAvLyBTZXQgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uIG9mIHRoZSByYXkgc28gdGhhdCBpdCBnb2VzIGZyb20gb3JpZ2luIHRvXHJcbiAgICAvLyByZXRpY2xlLlxyXG4gICAgdmFyIGRlbHRhID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHJheS5kaXJlY3Rpb24pO1xyXG4gICAgZGVsdGEubXVsdGlwbHlTY2FsYXIodGhpcy5yZXRpY2xlRGlzdGFuY2UpO1xyXG4gICAgdGhpcy5yYXkuc2NhbGUueSA9IGRlbHRhLmxlbmd0aCgpO1xyXG4gICAgdmFyIGFycm93ID0gbmV3IFRIUkVFLkFycm93SGVscGVyKHJheS5kaXJlY3Rpb24sIHJheS5vcmlnaW4pO1xyXG4gICAgdGhpcy5yYXkucm90YXRpb24uY29weShhcnJvdy5yb3RhdGlvbik7XHJcbiAgICB0aGlzLnJheS5wb3NpdGlvbi5hZGRWZWN0b3JzKHJheS5vcmlnaW4sIGRlbHRhLm11bHRpcGx5U2NhbGFyKDAuNSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyB0aGUgZ2VvbWV0cnkgb2YgdGhlIHJldGljbGUuXHJcbiAgICovXHJcbiAgY3JlYXRlUmV0aWNsZV8oKSB7XHJcbiAgICAvLyBDcmVhdGUgYSBzcGhlcmljYWwgcmV0aWNsZS5cclxuICAgIGxldCBpbm5lckdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KElOTkVSX1JBRElVUywgMzIsIDMyKTtcclxuICAgIGxldCBpbm5lck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcclxuICAgICAgY29sb3I6IDB4ZmZmZmZmLFxyXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcclxuICAgICAgb3BhY2l0eTogMC45XHJcbiAgICB9KTtcclxuICAgIGxldCBpbm5lciA9IG5ldyBUSFJFRS5NZXNoKGlubmVyR2VvbWV0cnksIGlubmVyTWF0ZXJpYWwpO1xyXG5cclxuICAgIGxldCBvdXRlckdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KE9VVEVSX1JBRElVUywgMzIsIDMyKTtcclxuICAgIGxldCBvdXRlck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcclxuICAgICAgY29sb3I6IDB4MzMzMzMzLFxyXG4gICAgICB0cmFuc3BhcmVudDogdHJ1ZSxcclxuICAgICAgb3BhY2l0eTogMC4zXHJcbiAgICB9KTtcclxuICAgIGxldCBvdXRlciA9IG5ldyBUSFJFRS5NZXNoKG91dGVyR2VvbWV0cnksIG91dGVyTWF0ZXJpYWwpO1xyXG5cclxuICAgIGxldCByZXRpY2xlID0gbmV3IFRIUkVFLkdyb3VwKCk7XHJcbiAgICByZXRpY2xlLmFkZChpbm5lcik7XHJcbiAgICByZXRpY2xlLmFkZChvdXRlcik7XHJcbiAgICByZXR1cm4gcmV0aWNsZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmVzIHRoZSByZXRpY2xlIHRvIGEgcG9zaXRpb24gc28gdGhhdCBpdCdzIGp1c3QgaW4gZnJvbnQgb2YgdGhlIG1lc2ggdGhhdFxyXG4gICAqIGl0IGludGVyc2VjdGVkIHdpdGguXHJcbiAgICovXHJcbiAgbW92ZVJldGljbGVfKGludGVyc2VjdGlvbnMpIHtcclxuICAgIC8vIElmIG5vIGludGVyc2VjdGlvbiwgcmV0dXJuIHRoZSByZXRpY2xlIHRvIHRoZSBkZWZhdWx0IHBvc2l0aW9uLlxyXG4gICAgbGV0IGRpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcclxuICAgIGlmIChpbnRlcnNlY3Rpb25zKSB7XHJcbiAgICAgIC8vIE90aGVyd2lzZSwgZGV0ZXJtaW5lIHRoZSBjb3JyZWN0IGRpc3RhbmNlLlxyXG4gICAgICBsZXQgaW50ZXIgPSBpbnRlcnNlY3Rpb25zWzBdO1xyXG4gICAgICBkaXN0YW5jZSA9IGludGVyLmRpc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gZGlzdGFuY2U7XHJcbiAgICB0aGlzLnVwZGF0ZVJheWNhc3Rlcl8oKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNyZWF0ZVJheV8oKSB7XHJcbiAgICAvLyBDcmVhdGUgYSBjeWxpbmRyaWNhbCByYXkuXHJcbiAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQ3lsaW5kZXJHZW9tZXRyeShSQVlfUkFESVVTLCBSQVlfUkFESVVTLCAxLCAzMik7XHJcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xyXG4gICAgICBtYXA6IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoR1JBRElFTlRfSU1BR0UpLFxyXG4gICAgICAvL2NvbG9yOiAweGZmZmZmZixcclxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXHJcbiAgICAgIG9wYWNpdHk6IDAuM1xyXG4gICAgfSk7XHJcbiAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XHJcblxyXG4gICAgcmV0dXJuIG1lc2g7XHJcbiAgfVxyXG59XHJcbiIsIi8qXHJcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc01vYmlsZSgpIHtcclxuICB2YXIgY2hlY2sgPSBmYWxzZTtcclxuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcclxuICByZXR1cm4gY2hlY2s7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjQobWltZVR5cGUsIGJhc2U2NCkge1xyXG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xyXG59XHJcbiJdfQ==
