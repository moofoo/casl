(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@casl/ability'), require('aurelia-framework')) :
  typeof define === 'function' && define.amd ? define(['exports', '@casl/ability', 'aurelia-framework'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.casl = global.casl || {}, global.casl.au = {}), global.casl, global.au));
})(this, (function (exports, ability, aureliaFramework) { 'use strict';

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  var ABILITY_CHANGED_SIGNAL = 'caslAbilityChanged';
  var HAS_AU_SUBSCRIPTION = new WeakMap();

  var AbilityValueConverter = /*#__PURE__*/function () {
    function AbilityValueConverter(ability) {
      this.signals = [ABILITY_CHANGED_SIGNAL];
      this._ability = ability;
    }

    var _proto = AbilityValueConverter.prototype;

    _proto.can = function can() {
      var _this$_ability;

      if (!HAS_AU_SUBSCRIPTION.has(this._ability)) {
        this._ability.on('updated', function () {
          return aureliaFramework.signalBindings(ABILITY_CHANGED_SIGNAL);
        });

        HAS_AU_SUBSCRIPTION.set(this._ability, true);
      }

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return (_this$_ability = this._ability).can.apply(_this$_ability, args);
    };

    return AbilityValueConverter;
  }();

  AbilityValueConverter.inject = [ability.PureAbility];
  var CanValueConverter = /*#__PURE__*/function (_AbilityValueConverte) {
    _inheritsLoose(CanValueConverter, _AbilityValueConverte);

    function CanValueConverter() {
      return _AbilityValueConverte.apply(this, arguments) || this;
    }

    var _proto2 = CanValueConverter.prototype;

    _proto2.toView = function toView(subject, action, field) {
      // eslint-disable-next-line
      console.warn('`can` value converter is deprecated. Use `able` converter instead');
      return this.can(action, subject, field);
    };

    return CanValueConverter;
  }(AbilityValueConverter);
  CanValueConverter.$resource = {
    name: 'can',
    type: 'valueConverter'
  };
  var AbleValueConverter = /*#__PURE__*/function (_AbilityValueConverte2) {
    _inheritsLoose(AbleValueConverter, _AbilityValueConverte2);

    function AbleValueConverter() {
      return _AbilityValueConverte2.apply(this, arguments) || this;
    }

    var _proto3 = AbleValueConverter.prototype;

    _proto3.toView = function toView() {
      return this.can.apply(this, arguments);
    };

    return AbleValueConverter;
  }(AbilityValueConverter);
  AbleValueConverter.$resource = {
    name: 'able',
    type: 'valueConverter'
  };

  function configure(config, defaultAbility) {
    if (defaultAbility && defaultAbility instanceof ability.PureAbility) {
      config.container.registerInstance(ability.PureAbility, defaultAbility);
    }

    config.globalResources([CanValueConverter, AbleValueConverter]);
  }

  exports.AbleValueConverter = AbleValueConverter;
  exports.CanValueConverter = CanValueConverter;
  exports.configure = configure;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
