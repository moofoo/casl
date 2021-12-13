import React, { Fragment, createElement, Children, PureComponent } from 'react';

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

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

var noop = function noop() {};

var renderChildren = Fragment ? function (children) {
  if (!children) {
    return null;
  }

  return children.length > 1 ? createElement.apply(void 0, [Fragment, null].concat(children)) : Children.only(children);
} : Children.only;
var Can = /*#__PURE__*/function (_PureComponent) {
  _inheritsLoose(Can, _PureComponent);

  function Can() {
    var _this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _PureComponent.call.apply(_PureComponent, [this].concat(args)) || this;
    _this._isAllowed = false;
    _this._ability = null;
    _this._unsubscribeFromAbility = noop;
    return _this;
  }

  var _proto = Can.prototype;

  _proto.componentWillUnmount = function componentWillUnmount() {
    this._unsubscribeFromAbility();
  };

  _proto._connectToAbility = function _connectToAbility(ability) {
    var _this2 = this;

    if (ability === this._ability) {
      return;
    }

    this._unsubscribeFromAbility();

    this._ability = null;

    if (ability) {
      this._ability = ability;
      this._unsubscribeFromAbility = ability.on('updated', function () {
        return _this2.forceUpdate();
      });
    }
  };

  _proto._canRender = function _canRender() {
    var props = this.props;
    var subject = props.of || props.a || props.an || props.this || props.on;
    var can = props.not ? 'cannot' : 'can';
    return props.ability[can](props.I || props.do, subject, props.field);
  };

  _proto.render = function render() {
    this._connectToAbility(this.props.ability);

    this._isAllowed = this._canRender();
    return this.props.passThrough || this._isAllowed ? this._renderChildren() : null;
  };

  _proto._renderChildren = function _renderChildren() {
    var _this$props = this.props,
        children = _this$props.children,
        ability = _this$props.ability;
    var elements = typeof children === 'function' ? children(this._isAllowed, ability) : children;
    return renderChildren(elements);
  };

  _createClass(Can, [{
    key: "allowed",
    get: function get() {
      return this._isAllowed;
    }
  }]);

  return Can;
}(PureComponent);

function createCanBoundTo(ability) {
  var _class, _temp;

  return _temp = _class = /*#__PURE__*/function (_Can) {
    _inheritsLoose(_class, _Can);

    function _class() {
      return _Can.apply(this, arguments) || this;
    }

    return _class;
  }(Can), _class.defaultProps = {
    ability: ability
  }, _temp;
}
function createContextualCan(Getter) {
  return function (props) {
    return createElement(Getter, null, function (ability) {
      return createElement(Can, _extends({
        ability: ability
      }, props));
    });
  };
}

function useAbility(context) {
  if (process.env.NODE_ENV !== 'production' && typeof React.useContext !== 'function') {
    /* istanbul ignore next */
    throw new Error('You must use React >= 16.8 in order to use useAbility()');
  }

  var ability = React.useContext(context);

  var _React$useState = React.useState(),
      rules = _React$useState[0],
      setRules = _React$useState[1];

  React.useEffect(function () {
    return ability.on('updated', function (event) {
      if (event.rules !== rules) {
        setRules(event.rules);
      }
    });
  }, []);
  return ability;
}

export { Can, createCanBoundTo, createContextualCan, useAbility };
//# sourceMappingURL=index.js.map
