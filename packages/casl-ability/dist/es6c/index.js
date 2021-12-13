'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var mongo2js = require('@ucast/mongo2js');

function wrapArray(value) {
  return Array.isArray(value) ? value : [value];
}
const TYPE_FIELD = '__caslSubjectType__';
function setSubjectType(type, object) {
  if (object) {
    if (!object.hasOwnProperty(TYPE_FIELD)) {
      Object.defineProperty(object, TYPE_FIELD, {
        value: type
      });
    } else if (type !== object[TYPE_FIELD]) {
      throw new Error(`Trying to cast object to subject type ${type} but previously it was casted to ${object[TYPE_FIELD]}`);
    }
  }

  return object;
}
const isSubjectType = value => {
  const type = typeof value;
  return type === 'string' || type === 'function';
};

const getSubjectClassName = value => value.modelName || value.name;

const getSubjectTypeName = value => {
  return typeof value === 'string' ? value : getSubjectClassName(value);
};
function detectSubjectType(subject) {
  if (subject.hasOwnProperty(TYPE_FIELD)) {
    return subject[TYPE_FIELD];
  }

  return getSubjectClassName(subject.constructor);
}

function expandActions(aliasMap, rawActions, merge) {
  let actions = wrapArray(rawActions);
  let i = 0;

  while (i < actions.length) {
    const action = actions[i++];

    if (aliasMap.hasOwnProperty(action)) {
      actions = merge(actions, aliasMap[action]);
    }
  }

  return actions;
}

function findDuplicate(actions, actionToFind) {
  if (typeof actionToFind === 'string' && actions.indexOf(actionToFind) !== -1) {
    return actionToFind;
  }

  for (let i = 0; i < actionToFind.length; i++) {
    if (actions.indexOf(actionToFind[i]) !== -1) return actionToFind[i];
  }

  return null;
}

const defaultAliasMerge = (actions, action) => actions.concat(action);

function validateForCycles(aliasMap, reservedAction) {
  if (reservedAction in aliasMap) {
    throw new Error(`Cannot use "${reservedAction}" as an alias because it's reserved action.`);
  }

  const keys = Object.keys(aliasMap);

  const mergeAliasesAndDetectCycles = (actions, action) => {
    const duplicate = findDuplicate(actions, action);
    if (duplicate) throw new Error(`Detected cycle ${duplicate} -> ${actions.join(', ')}`);
    const isUsingReservedAction = typeof action === 'string' && action === reservedAction || actions.indexOf(reservedAction) !== -1 || Array.isArray(action) && action.indexOf(reservedAction) !== -1;
    if (isUsingReservedAction) throw new Error(`Cannot make an alias to "${reservedAction}" because this is reserved action`);
    return actions.concat(action);
  };

  for (let i = 0; i < keys.length; i++) {
    expandActions(aliasMap, keys[i], mergeAliasesAndDetectCycles);
  }
}

function createAliasResolver(aliasMap, options) {
  if (!options || options.skipValidate !== false) {
    validateForCycles(aliasMap, options && options.anyAction || 'manage');
  }

  return action => expandActions(aliasMap, action, defaultAliasMerge);
}

function copyArrayTo(dest, target, start) {
  for (let i = start; i < target.length; i++) {
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

  let i = 0;
  let j = 0;
  const merged = [];

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
  let value = map.get(key);

  if (!value) {
    value = defaultValue();
    map.set(key, value);
  }

  return value;
}
const identity = x => x;

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

class Rule {
  constructor(rule, options, priority = 0) {
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

  _conditionsMatcher() {
    if (this.conditions && !this._matchConditions) {
      this._matchConditions = this._options.conditionsMatcher(this.conditions);
    }

    return this._matchConditions;
  }

  get ast() {
    const matches = this._conditionsMatcher();

    return matches ? matches.ast : undefined;
  }

  matchesConditions(object) {
    if (!this.conditions) {
      return true;
    }

    if (!object || isSubjectType(object)) {
      return !this.inverted;
    }

    const matches = this._conditionsMatcher();

    return matches(object);
  }

  matchesField(field) {
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
  }

}

function linkedItem(value, prev) {
  const item = {
    value,
    prev,
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
const cloneLinkedItem = item => ({
  value: item.value,
  prev: item.prev,
  next: item.next
});

const defaultActionEntry = () => ({
  rules: [],
  merged: false
});

const defaultSubjectEntry = () => new Map();

const analyze = (index, rule) => {
  if (!index._hasPerFieldRules && rule.fields) {
    index._hasPerFieldRules = true;
  }
};

class RuleIndex {
  constructor(rules = [], options = {}) {
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

  get rules() {
    return this._rules;
  }

  detectSubjectType(object) {
    if (isSubjectType(object)) return object;
    if (!object) return this._anySubjectType;
    return this._detectSubjectType(object);
  }

  update(rules) {
    const event = {
      rules,
      ability: this,
      target: this
    };

    this._emit('update', event);

    this._rules = rules;
    this._indexedRules = this._buildIndexFor(rules);

    this._emit('updated', event);

    return this;
  }

  _buildIndexFor(rawRules) {
    const indexedRules = new Map();

    for (let i = rawRules.length - 1; i >= 0; i--) {
      const priority = rawRules.length - i - 1;
      const rule = new Rule(rawRules[i], this._ruleOptions, priority);
      const actions = wrapArray(rule.action);
      const subjects = wrapArray(rule.subject || this._anySubjectType);
      analyze(this, rule);

      for (let k = 0; k < subjects.length; k++) {
        const subjectRules = getOrDefault(indexedRules, subjects[k], defaultSubjectEntry);

        for (let j = 0; j < actions.length; j++) {
          getOrDefault(subjectRules, actions[j], defaultActionEntry).rules.push(rule);
        }
      }
    }

    return indexedRules;
  }

  possibleRulesFor(action, subjectType = this._anySubjectType) {
    if (!isSubjectType(subjectType)) {
      throw new Error('"possibleRulesFor" accepts only subject types (i.e., string or class) as the 2nd parameter');
    }

    const subjectRules = getOrDefault(this._indexedRules, subjectType, defaultSubjectEntry);
    const actionRules = getOrDefault(subjectRules, action, defaultActionEntry);

    if (actionRules.merged) {
      return actionRules.rules;
    }

    const anyActionRules = action !== this._anyAction && subjectRules.has(this._anyAction) ? subjectRules.get(this._anyAction).rules : undefined;
    let rules = mergePrioritized(actionRules.rules, anyActionRules);

    if (subjectType !== this._anySubjectType) {
      rules = mergePrioritized(rules, this.possibleRulesFor(action, this._anySubjectType));
    }

    actionRules.rules = rules;
    actionRules.merged = true;
    return rules;
  }

  rulesFor(action, subjectType, field) {
    const rules = this.possibleRulesFor(action, subjectType);

    if (field && typeof field !== 'string') {
      throw new Error('The 3rd, `field` parameter is expected to be a string. See https://stalniy.github.io/casl/en/api/casl-ability#can-of-pure-ability for details');
    }

    if (!this._hasPerFieldRules) {
      return rules;
    }

    return rules.filter(rule => rule.matchesField(field));
  }

  on(event, handler) {
    const tail = this._events.get(event) || null;
    const item = linkedItem(handler, tail);

    this._events.set(event, item);

    return () => {
      const currentTail = this._events.get(event);

      if (!item.next && !item.prev && currentTail === item) {
        this._events.delete(event);
      } else if (item === currentTail) {
        this._events.set(event, item.prev);
      }

      unlinkItem(item);
    };
  }

  _emit(name, payload) {
    let current = this._events.get(name) || null;

    while (current !== null) {
      const prev = current.prev ? cloneLinkedItem(current.prev) : null;
      current.value(payload);
      current = prev;
    }
  }

}

class PureAbility extends RuleIndex {
  can(...args) {
    const rule = this.relevantRuleFor(...args);
    return !!rule && !rule.inverted;
  }

  relevantRuleFor(action, subject, field) {
    const subjectType = this.detectSubjectType(subject);
    const rules = this.rulesFor(action, subjectType, field);

    for (let i = 0, length = rules.length; i < length; i++) {
      if (rules[i].matchesConditions(subject)) {
        return rules[i];
      }
    }

    return null;
  }

  cannot(...args) {
    return !this.can(...args);
  }

}

const defaultInstructions = {
  $eq: mongo2js.$eq,
  $ne: mongo2js.$ne,
  $lt: mongo2js.$lt,
  $lte: mongo2js.$lte,
  $gt: mongo2js.$gt,
  $gte: mongo2js.$gte,
  $in: mongo2js.$in,
  $nin: mongo2js.$nin,
  $all: mongo2js.$all,
  $size: mongo2js.$size,
  $regex: mongo2js.$regex,
  $options: mongo2js.$options,
  $elemMatch: mongo2js.$elemMatch,
  $exists: mongo2js.$exists
};
const defaultInterpreters = {
  eq: mongo2js.eq,
  ne: mongo2js.ne,
  lt: mongo2js.lt,
  lte: mongo2js.lte,
  gt: mongo2js.gt,
  gte: mongo2js.gte,
  in: mongo2js.within,
  nin: mongo2js.nin,
  all: mongo2js.all,
  size: mongo2js.size,
  regex: mongo2js.regex,
  elemMatch: mongo2js.elemMatch,
  exists: mongo2js.exists,
  and: mongo2js.and
};
const buildMongoQueryMatcher = (instructions, interpreters, options) => mongo2js.createFactory(Object.assign({}, defaultInstructions, instructions), Object.assign({}, defaultInterpreters, interpreters), options);
const mongoQueryMatcher = mongo2js.createFactory(defaultInstructions, defaultInterpreters);

const REGEXP_SPECIAL_CHARS = /[-/\\^$+?.()|[\]{}]/g;
const REGEXP_ANY = /\.?\*+\.?/g;
const REGEXP_STARS = /\*+/;
const REGEXP_DOT = /\./g;

function detectRegexpPattern(match, index, string) {
  const quantifier = string[0] === '*' || match[0] === '.' && match[match.length - 1] === '.' ? '+' : '*';
  const matcher = match.indexOf('**') === -1 ? '[^.]' : '.';
  const pattern = match.replace(REGEXP_DOT, '\\$&').replace(REGEXP_STARS, matcher + quantifier);
  return index + match.length === string.length ? `(?:${pattern})?` : pattern;
}

function escapeRegexp(match, index, string) {
  if (match === '.' && (string[index - 1] === '*' || string[index + 1] === '*')) {
    return match;
  }

  return `\\${match}`;
}

function createPattern(fields) {
  const patterns = fields.map(field => field.replace(REGEXP_SPECIAL_CHARS, escapeRegexp).replace(REGEXP_ANY, detectRegexpPattern));
  const pattern = patterns.length > 1 ? `(?:${patterns.join('|')})` : patterns[0];
  return new RegExp(`^${pattern}$`);
}

const fieldPatternMatcher = fields => {
  let pattern;
  return field => {
    if (typeof pattern === 'undefined') {
      pattern = fields.every(f => f.indexOf('*') === -1) ? null : createPattern(fields);
    }

    return pattern === null ? fields.indexOf(field) !== -1 : pattern.test(field);
  };
};

class Ability extends PureAbility {
  constructor(rules = [], options = {}) {
    super(rules, Object.assign({
      conditionsMatcher: mongoQueryMatcher,
      fieldMatcher: fieldPatternMatcher
    }, options));
  }

}

class RuleBuilder {
  constructor(rule) {
    this._rule = rule;
  }

  because(reason) {
    this._rule.reason = reason;
    return this;
  }

}

class AbilityBuilder {
  constructor(AbilityType) {
    this.rules = [];
    this._AbilityType = AbilityType;
    this.can = this.can.bind(this);
    this.cannot = this.cannot.bind(this);
    this.build = this.build.bind(this);
  }

  can(action, subject, conditionsOrFields, conditions) {
    const rule = {
      action
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
  }

  cannot(action, subject, conditionsOrFields, conditions) {
    const builder = this.can(action, subject, conditionsOrFields, conditions);
    builder._rule.inverted = true;
    return builder;
  }

  build(options) {
    return new this._AbilityType(this.rules, options);
  }

}
function defineAbility(define, options) {
  const builder = new AbilityBuilder(Ability);
  const result = define(builder.can, builder.cannot);

  if (result && typeof result.then === 'function') {
    return result.then(() => builder.build(options));
  }

  return builder.build(options);
}

const getDefaultErrorMessage = error => `Cannot execute "${error.action}" on "${error.subjectType}"`;

const NativeError = function NError(message) {
  this.message = message;
};

NativeError.prototype = Object.create(Error.prototype);
class ForbiddenError extends NativeError {
  static setDefaultMessage(messageOrFn) {
    this._defaultErrorMessage = typeof messageOrFn === 'string' ? () => messageOrFn : messageOrFn;
  }

  static from(ability) {
    return new this(ability);
  }

  constructor(ability) {
    super('');
    this.ability = ability;

    if (typeof Error.captureStackTrace === 'function') {
      this.name = 'ForbiddenError';
      Error.captureStackTrace(this, this.constructor);
    }
  }

  setMessage(message) {
    this.message = message;
    return this;
  }

  throwUnlessCan(...args) {
    const rule = this.ability.relevantRuleFor(...args);

    if (rule && !rule.inverted) {
      return;
    }

    this.action = args[0];
    this.subject = args[1];
    this.subjectType = getSubjectTypeName(this.ability.detectSubjectType(args[1]));
    this.field = args[2];
    const reason = rule ? rule.reason : ''; // eslint-disable-next-line no-underscore-dangle

    this.message = this.message || reason || this.constructor._defaultErrorMessage(this);
    throw this; // eslint-disable-line
  }

}
ForbiddenError._defaultErrorMessage = getDefaultErrorMessage;

var hkt = /*#__PURE__*/Object.freeze({
  __proto__: null
});

exports.Ability = Ability;
exports.AbilityBuilder = AbilityBuilder;
exports.ForbiddenError = ForbiddenError;
exports.PureAbility = PureAbility;
exports.buildMongoQueryMatcher = buildMongoQueryMatcher;
exports.createAliasResolver = createAliasResolver;
exports.defineAbility = defineAbility;
exports.detectSubjectType = detectSubjectType;
exports.fieldPatternMatcher = fieldPatternMatcher;
exports.getDefaultErrorMessage = getDefaultErrorMessage;
exports.hkt = hkt;
exports.mongoQueryMatcher = mongoQueryMatcher;
exports.subject = setSubjectType;
exports.wrapArray = wrapArray;
//# sourceMappingURL=index.js.map
