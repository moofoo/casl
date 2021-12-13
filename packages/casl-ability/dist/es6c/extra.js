'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var mongo2js = require('@ucast/mongo2js');

function wrapArray(value) {
  return Array.isArray(value) ? value : [value];
}
function setByPath(object, path, value) {
  let ref = object;
  let lastKey = path;

  if (path.indexOf('.') !== -1) {
    const keys = path.split('.');
    lastKey = keys.pop();
    ref = keys.reduce((res, prop) => {
      res[prop] = res[prop] || {};
      return res[prop];
    }, object);
  }

  ref[lastKey] = value;
}

function rulesToQuery(ability, action, subjectType, convert) {
  const query = {};
  const rules = ability.rulesFor(action, subjectType);

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const op = rule.inverted ? '$and' : '$or';

    if (!rule.conditions) {
      if (rule.inverted) {
        break;
      } else {
        delete query[op];
        return query;
      }
    } else {
      query[op] = query[op] || [];
      query[op].push(convert(rule));
    }
  }

  return query.$or ? query : null;
}

function ruleToAST(rule) {
  if (!rule.ast) {
    throw new Error(`Ability rule "${JSON.stringify(rule)}" does not have "ast" property. So, cannot be used to generate AST`);
  }

  return rule.ast;
}

function rulesToAST(ability, action, subjectType) {
  const query = rulesToQuery(ability, action, subjectType, ruleToAST);

  if (query === null) {
    return null;
  }

  if (!query.$and) {
    return query.$or ? mongo2js.buildOr(query.$or) : mongo2js.buildAnd([]);
  }

  if (query.$or) {
    query.$and.push(mongo2js.buildOr(query.$or));
  }

  return mongo2js.buildAnd(query.$and);
}
function rulesToFields(ability, action, subjectType) {
  return ability.rulesFor(action, subjectType).reduce((values, rule) => {
    if (rule.inverted || !rule.conditions) {
      return values;
    }

    return Object.keys(rule.conditions).reduce((fields, fieldName) => {
      const value = rule.conditions[fieldName];

      if (!value || value.constructor !== Object) {
        setByPath(fields, fieldName, value);
      }

      return fields;
    }, values);
  }, {});
}
function permittedFieldsOf(ability, action, subject, options) {
  const subjectType = ability.detectSubjectType(subject);
  const rules = ability.possibleRulesFor(action, subjectType);
  const uniqueFields = new Set();
  const deleteItem = uniqueFields.delete.bind(uniqueFields);
  const addItem = uniqueFields.add.bind(uniqueFields);
  let i = rules.length;

  while (i--) {
    const rule = rules[i];

    if (rule.matchesConditions(subject)) {
      const toggle = rule.inverted ? deleteItem : addItem;
      options.fieldsFrom(rule).forEach(toggle);
    }
  }

  return Array.from(uniqueFields);
}

const joinIfArray = value => Array.isArray(value) ? value.join(',') : value;

function packRules(rules, packSubject) {
  return rules.map(rule => {
    // eslint-disable-line
    const packedRule = [joinIfArray(rule.action || rule.actions), typeof packSubject === 'function' ? wrapArray(rule.subject).map(packSubject).join(',') : joinIfArray(rule.subject), rule.conditions || 0, rule.inverted ? 1 : 0, rule.fields ? joinIfArray(rule.fields) : 0, rule.reason || ''];

    while (!packedRule[packedRule.length - 1]) packedRule.pop();

    return packedRule;
  });
}
function unpackRules(rules, unpackSubject) {
  return rules.map(([action, subject, conditions, inverted, fields, reason]) => {
    const subjects = subject.split(',');
    const rule = {
      inverted: !!inverted,
      action: action.split(','),
      subject: typeof unpackSubject === 'function' ? subjects.map(unpackSubject) : subjects
    };

    if (conditions) {
      rule.conditions = conditions;
    }

    if (fields) {
      rule.fields = fields.split(',');
    }

    if (reason) {
      rule.reason = reason;
    }

    return rule;
  });
}

exports.packRules = packRules;
exports.permittedFieldsOf = permittedFieldsOf;
exports.rulesToAST = rulesToAST;
exports.rulesToFields = rulesToFields;
exports.rulesToQuery = rulesToQuery;
exports.unpackRules = unpackRules;
//# sourceMappingURL=extra.js.map
