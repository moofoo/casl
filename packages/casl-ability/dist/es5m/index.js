import { createFactory, $eq, $ne, $lt, $lte, $gt, $gte, $in, $nin, $all, $size, $regex, $options, $elemMatch, $exists, eq, ne, lt, lte, gt, gte, within, nin, all, size, regex, elemMatch, exists, and } from '@ucast/mongo2js';

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

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function wrapArray(value) {
  return Array.isArray(value) ? value : [value];
}
var TYPE_FIELD = '__caslSubjectType__';
function setSubjectType(type, object) {
  if (object) {
    if (!object.hasOwnProperty(TYPE_FIELD)) {
      Object.defineProperty(object, TYPE_FIELD, {
        value: type
      });
    } else if (type !== object[TYPE_FIELD]) {
      throw new Error("Trying to cast object to subject type " + type + " but previously it was casted to " + object[TYPE_FIELD]);
    }
  }

  return object;
}
var isSubjectType = function isSubjectType(value) {
  var type = typeof value;
  return type === 'string' || type === 'function';
};

var getSubjectClassName = function getSubjectClassName(value) {
  return value.modelName || value.name;
};

var getSubjectTypeName = function getSubjectTypeName(value) {
  return typeof value === 'string' ? value : getSubjectClassName(value);
};
function detectSubjectType(subject) {
  if (subject.hasOwnProperty(TYPE_FIELD)) {
    return subject[TYPE_FIELD];
  }

  return getSubjectClassName(subject.constructor);
}

function expandActions(aliasMap, rawActions, merge) {
  var actions = wrapArray(rawActions);
  var i = 0;

  while (i < actions.length) {
    var _action = actions[i++];

    if (aliasMap.hasOwnProperty(_action)) {
      actions = merge(actions, aliasMap[_action]);
    }
  }

  return actions;
}

function findDuplicate(actions, actionToFind) {
  if (typeof actionToFind === 'string' && actions.indexOf(actionToFind) !== -1) {
    return actionToFind;
  }

  for (var i = 0; i < actionToFind.length; i++) {
    if (actions.indexOf(actionToFind[i]) !== -1) return actionToFind[i];
  }

  return null;
}

var defaultAliasMerge = function defaultAliasMerge(actions, action) {
  return actions.concat(action);
};

function validateForCycles(aliasMap, reservedAction) {
  if (reservedAction in aliasMap) {
    throw new Error("Cannot use \"" + reservedAction + "\" as an alias because it's reserved action.");
  }

  var keys = Object.keys(aliasMap);

  var mergeAliasesAndDetectCycles = function mergeAliasesAndDetectCycles(actions, action) {
    var duplicate = findDuplicate(actions, action);
    if (duplicate) throw new Error("Detected cycle " + duplicate + " -> " + actions.join(', '));
    var isUsingReservedAction = typeof action === 'string' && action === reservedAction || actions.indexOf(reservedAction) !== -1 || Array.isArray(action) && action.indexOf(reservedAction) !== -1;
    if (isUsingReservedAction) throw new Error("Cannot make an alias to \"" + reservedAction + "\" because this is reserved action");
    return actions.concat(action);
  };

  for (var i = 0; i < keys.length; i++) {
    expandActions(aliasMap, keys[i], mergeAliasesAndDetectCycles);
  }
}

function createAliasResolver(aliasMap, options) {
  if (!options || options.skipValidate !== false) {
    validateForCycles(aliasMap, options && options.anyAction || 'manage');
  }

  return function (action) {
    return expandActions(aliasMap, action, defaultAliasMerge);
  };
}

function copyArrayTo(dest, target, start) {
  for (var i = start; i < target.length; i++) {
    dest.push(target[i]);
  }
}

function mergePrioritized(array, anotherArray) {
  if (!array || !array.length) {
    return anotherArray || [];
  }

  if (!anotherArray || !anotherArray.length) {
    return array || [];
  }

  var i = 0;
  var j = 0;
  var merged = [];

  while (i < array.length && j < anotherArray.length) {
    if (array[i].priority < anotherArray[j].priority) {
      merged.push(array[i]);
      i++;
    } else {
      merged.push(anotherArray[j]);
      j++;
    }
  }

  copyArrayTo(merged, array, i);
  copyArrayTo(merged, anotherArray, j);
  return merged;
}
function getOrDefault(map, key, defaultValue) {
  var value = map.get(key);

  if (!value) {
    value = defaultValue();
    map.set(key, value);
  }

  return value;
}
var identity = function identity(x) {
  return x;
};

function validate(rule, options) {
  if (Array.isArray(rule.fields) && !rule.fields.length) {
    throw new Error('`rawRule.fields` cannot be an empty array. https://bit.ly/390miLa');
  }

  if (rule.fields && !options.fieldMatcher) {
    throw new Error('You need to pass "fieldMatcher" option in order to restrict access by fields');
  }

  if (rule.conditions && !options.conditionsMatcher) {
    throw new Error('You need to pass "conditionsMatcher" option in order to restrict access by conditions');
  }
}

var Rule = /*#__PURE__*/function () {
  function Rule(rule, options, priority) {
    if (priority === void 0) {
      priority = 0;
    }

    validate(rule, options);
    this.action = options.resolveAction(rule.action);
    this.subject = rule.subject;
    this.inverted = !!rule.inverted;
    this.conditions = rule.conditions;
    this.reason = rule.reason;
    this.fields = rule.fields ? wrapArray(rule.fields) : undefined;
    this.priority = priority;
    this._options = options;
  }

  var _proto = Rule.prototype;

  _proto._conditionsMatcher = function _conditionsMatcher() {
    if (this.conditions && !this._matchConditions) {
      this._matchConditions = this._options.conditionsMatcher(this.conditions);
    }

    return this._matchConditions;
  };

  _proto.matchesConditions = function matchesConditions(object) {
    if (!this.conditions) {
      return true;
    }

    if (!object || isSubjectType(object)) {
      return !this.inverted;
    }

    var matches = this._conditionsMatcher();

    return matches(object);
  };

  _proto.matchesField = function matchesField(field) {
    if (!this.fields) {
      return true;
    }

    if (!field) {
      return !this.inverted;
    }

    if (this.fields && !this._matchField) {
      this._matchField = this._options.fieldMatcher(this.fields);
    }

    return this._matchField(field);
  };

  _createClass(Rule, [{
    key: "ast",
    get: function get() {
      var matches = this._conditionsMatcher();

      return matches ? matches.ast : undefined;
    }
  }]);

  return Rule;
}();

function linkedItem(value, prev) {
  var item = {
    value: value,
    prev: prev,
    next: null
  };

  if (prev) {
    prev.next = item;
  }

  return item;
}
function unlinkItem(item) {
  if (item.next) {
    item.next.prev = item.prev;
  }

  if (item.prev) {
    item.prev.next = item.next;
  }

  item.next = item.prev = null; // eslint-disable-line
}
var cloneLinkedItem = function cloneLinkedItem(item) {
  return {
    value: item.value,
    prev: item.prev,
    next: item.next
  };
};

var defaultActionEntry = function defaultActionEntry() {
  return {
    rules: [],
    merged: false
  };
};

var defaultSubjectEntry = function defaultSubjectEntry() {
  return new Map();
};

var analyze = function analyze(index, rule) {
  if (!index._hasPerFieldRules && rule.fields) {
    index._hasPerFieldRules = true;
  }
};

var RuleIndex = /*#__PURE__*/function () {
  function RuleIndex(rules, options) {
    if (rules === void 0) {
      rules = [];
    }

    if (options === void 0) {
      options = {};
    }

    this._hasPerFieldRules = false;
    this._events = new Map();
    this._ruleOptions = {
      conditionsMatcher: options.conditionsMatcher,
      fieldMatcher: options.fieldMatcher,
      resolveAction: options.resolveAction || identity
    };
    this._anyAction = options.anyAction || 'manage';
    this._anySubjectType = options.anySubjectType || 'all';
    this._detectSubjectType = options.detectSubjectType || detectSubjectType;
    this._rules = rules;
    this._indexedRules = this._buildIndexFor(rules);
  }

  var _proto = RuleIndex.prototype;

  _proto.detectSubjectType = function detectSubjectType(object) {
    if (isSubjectType(object)) return object;
    if (!object) return this._anySubjectType;
    return this._detectSubjectType(object);
  };

  _proto.update = function update(rules) {
    var event = {
      rules: rules,
      ability: this,
      target: this
    };

    this._emit('update', event);

    this._rules = rules;
    this._indexedRules = this._buildIndexFor(rules);

    this._emit('updated', event);

    return this;
  };

  _proto._buildIndexFor = function _buildIndexFor(rawRules) {
    var indexedRules = new Map();

    for (var i = rawRules.length - 1; i >= 0; i--) {
      var priority = rawRules.length - i - 1;
      var rule = new Rule(rawRules[i], this._ruleOptions, priority);
      var actions = wrapArray(rule.action);
      var subjects = wrapArray(rule.subject || this._anySubjectType);
      analyze(this, rule);

      for (var k = 0; k < subjects.length; k++) {
        var subjectRules = getOrDefault(indexedRules, subjects[k], defaultSubjectEntry);

        for (var j = 0; j < actions.length; j++) {
          getOrDefault(subjectRules, actions[j], defaultActionEntry).rules.push(rule);
        }
      }
    }

    return indexedRules;
  };

  _proto.possibleRulesFor = function possibleRulesFor(action, subjectType) {
    if (subjectType === void 0) {
      subjectType = this._anySubjectType;
    }

    if (!isSubjectType(subjectType)) {
      throw new Error('"possibleRulesFor" accepts only subject types (i.e., string or class) as the 2nd parameter');
    }

    var subjectRules = getOrDefault(this._indexedRules, subjectType, defaultSubjectEntry);
    var actionRules = getOrDefault(subjectRules, action, defaultActionEntry);

    if (actionRules.merged) {
      return actionRules.rules;
    }

    var anyActionRules = action !== this._anyAction && subjectRules.has(this._anyAction) ? subjectRules.get(this._anyAction).rules : undefined;
    var rules = mergePrioritized(actionRules.rules, anyActionRules);

    if (subjectType !== this._anySubjectType) {
      rules = mergePrioritized(rules, this.possibleRulesFor(action, this._anySubjectType));
    }

    actionRules.rules = rules;
    actionRules.merged = true;
    return rules;
  };

  _proto.rulesFor = function rulesFor(action, subjectType, field) {
    var rules = this.possibleRulesFor(action, subjectType);

    if (field && typeof field !== 'string') {
      throw new Error('The 3rd, `field` parameter is expected to be a string. See https://stalniy.github.io/casl/en/api/casl-ability#can-of-pure-ability for details');
    }

    if (!this._hasPerFieldRules) {
      return rules;
    }

    return rules.filter(function (rule) {
      return rule.matchesField(field);
    });
  };

  _proto.on = function on(event, handler) {
    var _this = this;

    var tail = this._events.get(event) || null;
    var item = linkedItem(handler, tail);

    this._events.set(event, item);

    return function () {
      var currentTail = _this._events.get(event);

      if (!item.next && !item.prev && currentTail === item) {
        _this._events.delete(event);
      } else if (item === currentTail) {
        _this._events.set(event, item.prev);
      }

      unlinkItem(item);
    };
  };

  _proto._emit = function _emit(name, payload) {
    var current = this._events.get(name) || null;

    while (current !== null) {
      var prev = current.prev ? cloneLinkedItem(current.prev) : null;
      current.value(payload);
      current = prev;
    }
  };

  _createClass(RuleIndex, [{
    key: "rules",
    get: function get() {
      return this._rules;
    }
  }]);

  return RuleIndex;
}();

var PureAbility = /*#__PURE__*/function (_RuleIndex) {
  _inheritsLoose(PureAbility, _RuleIndex);

  function PureAbility() {
    return _RuleIndex.apply(this, arguments) || this;
  }

  var _proto = PureAbility.prototype;

  _proto.can = function can() {
    var rule = this.relevantRuleFor.apply(this, arguments);
    return !!rule && !rule.inverted;
  };

  _proto.relevantRuleFor = function relevantRuleFor(action, subject, field) {
    var subjectType = this.detectSubjectType(subject);
    var rules = this.rulesFor(action, subjectType, field);

    for (var i = 0, length = rules.length; i < length; i++) {
      if (rules[i].matchesConditions(subject)) {
        return rules[i];
      }
    }

    return null;
  };

  _proto.cannot = function cannot() {
    return !this.can.apply(this, arguments);
  };

  return PureAbility;
}(RuleIndex);

var defaultInstructions = {
  $eq: $eq,
  $ne: $ne,
  $lt: $lt,
  $lte: $lte,
  $gt: $gt,
  $gte: $gte,
  $in: $in,
  $nin: $nin,
  $all: $all,
  $size: $size,
  $regex: $regex,
  $options: $options,
  $elemMatch: $elemMatch,
  $exists: $exists
};
var defaultInterpreters = {
  eq: eq,
  ne: ne,
  lt: lt,
  lte: lte,
  gt: gt,
  gte: gte,
  in: within,
  nin: nin,
  all: all,
  size: size,
  regex: regex,
  elemMatch: elemMatch,
  exists: exists,
  and: and
};
var buildMongoQueryMatcher = function buildMongoQueryMatcher(instructions, interpreters, options) {
  return createFactory(_extends({}, defaultInstructions, instructions), _extends({}, defaultInterpreters, interpreters), options);
};
var mongoQueryMatcher = createFactory(defaultInstructions, defaultInterpreters);

var REGEXP_SPECIAL_CHARS = /[-/\\^$+?.()|[\]{}]/g;
var REGEXP_ANY = /\.?\*+\.?/g;
var REGEXP_STARS = /\*+/;
var REGEXP_DOT = /\./g;

function detectRegexpPattern(match, index, string) {
  var quantifier = string[0] === '*' || match[0] === '.' && match[match.length - 1] === '.' ? '+' : '*';
  var matcher = match.indexOf('**') === -1 ? '[^.]' : '.';
  var pattern = match.replace(REGEXP_DOT, '\\$&').replace(REGEXP_STARS, matcher + quantifier);
  return index + match.length === string.length ? "(?:" + pattern + ")?" : pattern;
}

function escapeRegexp(match, index, string) {
  if (match === '.' && (string[index - 1] === '*' || string[index + 1] === '*')) {
    return match;
  }

  return "\\" + match;
}

function createPattern(fields) {
  var patterns = fields.map(function (field) {
    return field.replace(REGEXP_SPECIAL_CHARS, escapeRegexp).replace(REGEXP_ANY, detectRegexpPattern);
  });
  var pattern = patterns.length > 1 ? "(?:" + patterns.join('|') + ")" : patterns[0];
  return new RegExp("^" + pattern + "$");
}

var fieldPatternMatcher = function fieldPatternMatcher(fields) {
  var pattern;
  return function (field) {
    if (typeof pattern === 'undefined') {
      pattern = fields.every(function (f) {
        return f.indexOf('*') === -1;
      }) ? null : createPattern(fields);
    }

    return pattern === null ? fields.indexOf(field) !== -1 : pattern.test(field);
  };
};

var Ability = /*#__PURE__*/function (_PureAbility) {
  _inheritsLoose(Ability, _PureAbility);

  function Ability(rules, options) {
    if (rules === void 0) {
      rules = [];
    }

    if (options === void 0) {
      options = {};
    }

    return _PureAbility.call(this, rules, _extends({
      conditionsMatcher: mongoQueryMatcher,
      fieldMatcher: fieldPatternMatcher
    }, options)) || this;
  }

  return Ability;
}(PureAbility);

var RuleBuilder = /*#__PURE__*/function () {
  function RuleBuilder(rule) {
    this._rule = rule;
  }

  var _proto = RuleBuilder.prototype;

  _proto.because = function because(reason) {
    this._rule.reason = reason;
    return this;
  };

  return RuleBuilder;
}();

var AbilityBuilder = /*#__PURE__*/function () {
  function AbilityBuilder(AbilityType) {
    this.rules = [];
    this._AbilityType = AbilityType;
    this.can = this.can.bind(this);
    this.cannot = this.cannot.bind(this);
    this.build = this.build.bind(this);
  }

  var _proto2 = AbilityBuilder.prototype;

  _proto2.can = function can(action, subject, conditionsOrFields, conditions) {
    var rule = {
      action: action
    };

    if (subject) {
      rule.subject = subject;

      if (Array.isArray(conditionsOrFields) || typeof conditionsOrFields === 'string') {
        rule.fields = conditionsOrFields;
      } else if (typeof conditionsOrFields !== 'undefined') {
        rule.conditions = conditionsOrFields;
      }

      if (typeof conditions !== 'undefined') {
        rule.conditions = conditions;
      }
    }

    this.rules.push(rule);
    return new RuleBuilder(rule);
  };

  _proto2.cannot = function cannot(action, subject, conditionsOrFields, conditions) {
    var builder = this.can(action, subject, conditionsOrFields, conditions);
    builder._rule.inverted = true;
    return builder;
  };

  _proto2.build = function build(options) {
    return new this._AbilityType(this.rules, options);
  };

  return AbilityBuilder;
}();
function defineAbility(define, options) {
  var builder = new AbilityBuilder(Ability);
  var result = define(builder.can, builder.cannot);

  if (result && typeof result.then === 'function') {
    return result.then(function () {
      return builder.build(options);
    });
  }

  return builder.build(options);
}

var getDefaultErrorMessage = function getDefaultErrorMessage(error) {
  return "Cannot execute \"" + error.action + "\" on \"" + error.subjectType + "\"";
};

var NativeError = function NError(message) {
  this.message = message;
};

NativeError.prototype = Object.create(Error.prototype);
var ForbiddenError = /*#__PURE__*/function (_NativeError) {
  _inheritsLoose(ForbiddenError, _NativeError);

  ForbiddenError.setDefaultMessage = function setDefaultMessage(messageOrFn) {
    this._defaultErrorMessage = typeof messageOrFn === 'string' ? function () {
      return messageOrFn;
    } : messageOrFn;
  };

  ForbiddenError.from = function from(ability) {
    return new this(ability);
  };

  function ForbiddenError(ability) {
    var _this;

    _this = _NativeError.call(this, '') || this;
    _this.ability = ability;

    if (typeof Error.captureStackTrace === 'function') {
      _this.name = 'ForbiddenError';
      Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    }

    return _this;
  }

  var _proto = ForbiddenError.prototype;

  _proto.setMessage = function setMessage(message) {
    this.message = message;
    return this;
  };

  _proto.throwUnlessCan = function throwUnlessCan() {
    var _this$ability;

    var rule = (_this$ability = this.ability).relevantRuleFor.apply(_this$ability, arguments);

    if (rule && !rule.inverted) {
      return;
    }

    this.action = arguments.length <= 0 ? undefined : arguments[0];
    this.subject = arguments.length <= 1 ? undefined : arguments[1];
    this.subjectType = getSubjectTypeName(this.ability.detectSubjectType(arguments.length <= 1 ? undefined : arguments[1]));
    this.field = arguments.length <= 2 ? undefined : arguments[2];
    var reason = rule ? rule.reason : ''; // eslint-disable-next-line no-underscore-dangle

    this.message = this.message || reason || this.constructor._defaultErrorMessage(this);
    throw this; // eslint-disable-line
  };

  return ForbiddenError;
}(NativeError);
ForbiddenError._defaultErrorMessage = getDefaultErrorMessage;

var hkt = /*#__PURE__*/Object.freeze({
  __proto__: null
});

export { Ability, AbilityBuilder, ForbiddenError, PureAbility, buildMongoQueryMatcher, createAliasResolver, defineAbility, detectSubjectType, fieldPatternMatcher, getDefaultErrorMessage, hkt, mongoQueryMatcher, setSubjectType as subject, wrapArray };
//# sourceMappingURL=index.js.map
