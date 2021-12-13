(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@ucast/mongo2js')) :
  typeof define === 'function' && define.amd ? define(['exports', '@ucast/mongo2js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.casl = global.casl || {}, global.casl.extra = {}), global.ucast.mongo2js));
})(this, (function (exports, mongo2js) { 'use strict';

  function wrapArray(value) {
    return Array.isArray(value) ? value : [value];
  }
  function setByPath(object, path, value) {
    var ref = object;
    var lastKey = path;

    if (path.indexOf('.') !== -1) {
      var keys = path.split('.');
      lastKey = keys.pop();
      ref = keys.reduce(function (res, prop) {
        res[prop] = res[prop] || {};
        return res[prop];
      }, object);
    }

    ref[lastKey] = value;
  }

  function rulesToQuery(ability, action, subjectType, convert) {
    var query = {};
    var rules = ability.rulesFor(action, subjectType);

    for (var i = 0; i < rules.length; i++) {
      var _rule = rules[i];
      var op = _rule.inverted ? '$and' : '$or';

      if (!_rule.conditions) {
        if (_rule.inverted) {
          break;
        } else {
          delete query[op];
          return query;
        }
      } else {
        query[op] = query[op] || [];
        query[op].push(convert(_rule));
      }
    }

    return query.$or ? query : null;
  }

  function ruleToAST(rule) {
    if (!rule.ast) {
      throw new Error("Ability rule \"" + JSON.stringify(rule) + "\" does not have \"ast\" property. So, cannot be used to generate AST");
    }

    return rule.ast;
  }

  function rulesToAST(ability, action, subjectType) {
    var query = rulesToQuery(ability, action, subjectType, ruleToAST);

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
    return ability.rulesFor(action, subjectType).reduce(function (values, rule) {
      if (rule.inverted || !rule.conditions) {
        return values;
      }

      return Object.keys(rule.conditions).reduce(function (fields, fieldName) {
        var value = rule.conditions[fieldName];

        if (!value || value.constructor !== Object) {
          setByPath(fields, fieldName, value);
        }

        return fields;
      }, values);
    }, {});
  }
  function permittedFieldsOf(ability, action, subject, options) {
    var subjectType = ability.detectSubjectType(subject);
    var rules = ability.possibleRulesFor(action, subjectType);
    var uniqueFields = new Set();
    var deleteItem = uniqueFields.delete.bind(uniqueFields);
    var addItem = uniqueFields.add.bind(uniqueFields);
    var i = rules.length;

    while (i--) {
      var _rule2 = rules[i];

      if (_rule2.matchesConditions(subject)) {
        var toggle = _rule2.inverted ? deleteItem : addItem;
        options.fieldsFrom(_rule2).forEach(toggle);
      }
    }

    return Array.from(uniqueFields);
  }

  var joinIfArray = function joinIfArray(value) {
    return Array.isArray(value) ? value.join(',') : value;
  };

  function packRules(rules, packSubject) {
    return rules.map(function (rule) {
      // eslint-disable-line
      var packedRule = [joinIfArray(rule.action || rule.actions), typeof packSubject === 'function' ? wrapArray(rule.subject).map(packSubject).join(',') : joinIfArray(rule.subject), rule.conditions || 0, rule.inverted ? 1 : 0, rule.fields ? joinIfArray(rule.fields) : 0, rule.reason || ''];

      while (!packedRule[packedRule.length - 1]) {
        packedRule.pop();
      }

      return packedRule;
    });
  }
  function unpackRules(rules, unpackSubject) {
    return rules.map(function (_ref) {
      var action = _ref[0],
          subject = _ref[1],
          conditions = _ref[2],
          inverted = _ref[3],
          fields = _ref[4],
          reason = _ref[5];
      var subjects = subject.split(',');
      var rule = {
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

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=extra.js.map
