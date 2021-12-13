import React, { Fragment, createElement, Children, PureComponent } from 'react';

const noop = () => {};

const renderChildren = Fragment ? children => {
  if (!children) {
    return null;
  }

  return children.length > 1 ? createElement(Fragment, null, ...children) : Children.only(children);
} : Children.only;
class Can extends PureComponent {
  constructor(...args) {
    super(...args);
    this._isAllowed = false;
    this._ability = null;
    this._unsubscribeFromAbility = noop;
  }

  componentWillUnmount() {
    this._unsubscribeFromAbility();
  }

  _connectToAbility(ability) {
    if (ability === this._ability) {
      return;
    }

    this._unsubscribeFromAbility();

    this._ability = null;

    if (ability) {
      this._ability = ability;
      this._unsubscribeFromAbility = ability.on('updated', () => this.forceUpdate());
    }
  }

  get allowed() {
    return this._isAllowed;
  }

  _canRender() {
    const props = this.props;
    const subject = props.of || props.a || props.an || props.this || props.on;
    const can = props.not ? 'cannot' : 'can';
    return props.ability[can](props.I || props.do, subject, props.field);
  }

  render() {
    this._connectToAbility(this.props.ability);

    this._isAllowed = this._canRender();
    return this.props.passThrough || this._isAllowed ? this._renderChildren() : null;
  }

  _renderChildren() {
    const {
      children,
      ability
    } = this.props;
    const elements = typeof children === 'function' ? children(this._isAllowed, ability) : children;
    return renderChildren(elements);
  }

}

function createCanBoundTo(ability) {
  var _class, _temp;

  return _temp = _class = class extends Can {}, _class.defaultProps = {
    ability
  }, _temp;
}
function createContextualCan(Getter) {
  return props => createElement(Getter, null, ability => createElement(Can, Object.assign({
    ability
  }, props)));
}

function useAbility(context) {
  if (process.env.NODE_ENV !== 'production' && typeof React.useContext !== 'function') {
    /* istanbul ignore next */
    throw new Error('You must use React >= 16.8 in order to use useAbility()');
  }

  const ability = React.useContext(context);
  const [rules, setRules] = React.useState();
  React.useEffect(() => ability.on('updated', event => {
    if (event.rules !== rules) {
      setRules(event.rules);
    }
  }), []);
  return ability;
}

export { Can, createCanBoundTo, createContextualCan, useAbility };
//# sourceMappingURL=index.mjs.map
