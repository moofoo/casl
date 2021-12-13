(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@casl/ability'), require('rxjs')) :
    typeof define === 'function' && define.amd ? define(['exports', '@angular/core', '@casl/ability', 'rxjs'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.casl = global.casl || {}, global.casl.ng = {}), global.ng.core, global.casl, global.rxjs));
})(this, (function (exports, i0, ability, rxjs) { 'use strict';

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n["default"] = e;
        return Object.freeze(n);
    }

    var i0__namespace = /*#__PURE__*/_interopNamespace(i0);

    var AblePipe = /** @class */ (function () {
        function AblePipe(ability) {
            this._ability = ability;
        }
        AblePipe.prototype.transform = function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = this._ability).can.apply(_a, args);
        };
        AblePipe.ɵfac = function AblePipe_Factory(t) { return new (t || AblePipe)(i0__namespace.ɵɵdirectiveInject(ability.PureAbility, 16)); };
        AblePipe.ɵpipe = /*@__PURE__*/ i0__namespace.ɵɵdefinePipe({ name: "able", type: AblePipe, pure: false });
        return AblePipe;
    }());
    (function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0__namespace.ɵsetClassMetadata(AblePipe, [{
            type: i0.Pipe,
            args: [{ name: 'able', pure: false }]
        }], function () { return [{ type: undefined, decorators: [{
                    type: i0.Inject,
                    args: [ability.PureAbility]
                }] }]; }, null); })();
    var AblePurePipe = /** @class */ (function () {
        function AblePurePipe(ability) {
            this._ability = ability;
        }
        // TODO: `Observable` can be removed after https://github.com/angular/angular/issues/15041
        AblePurePipe.prototype.transform = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new rxjs.Observable(function (s) {
                var emit = function () {
                    var _a;
                    return s.next((_a = _this._ability).can.apply(_a, args));
                };
                emit();
                return _this._ability.on('updated', emit);
            });
        };
        AblePurePipe.ɵfac = function AblePurePipe_Factory(t) { return new (t || AblePurePipe)(i0__namespace.ɵɵdirectiveInject(ability.PureAbility, 16)); };
        AblePurePipe.ɵpipe = /*@__PURE__*/ i0__namespace.ɵɵdefinePipe({ name: "ablePure", type: AblePurePipe, pure: true });
        return AblePurePipe;
    }());
    (function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0__namespace.ɵsetClassMetadata(AblePurePipe, [{
            type: i0.Pipe,
            args: [{ name: 'ablePure' }]
        }], function () { return [{ type: undefined, decorators: [{
                    type: i0.Inject,
                    args: [ability.PureAbility]
                }] }]; }, null); })();

    var AbilityModule = /** @class */ (function () {
        function AbilityModule() {
        }
        AbilityModule.ɵfac = function AbilityModule_Factory(t) { return new (t || AbilityModule)(); };
        AbilityModule.ɵmod = /*@__PURE__*/ i0__namespace.ɵɵdefineNgModule({ type: AbilityModule });
        AbilityModule.ɵinj = /*@__PURE__*/ i0__namespace.ɵɵdefineInjector({});
        return AbilityModule;
    }());
    (function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0__namespace.ɵsetClassMetadata(AbilityModule, [{
            type: i0.NgModule,
            args: [{
                    declarations: [
                        AblePipe,
                        AblePurePipe,
                    ],
                    exports: [
                        AblePipe,
                        AblePurePipe,
                    ],
                }]
        }], null, null); })();
    (function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0__namespace.ɵɵsetNgModuleScope(AbilityModule, { declarations: [AblePipe,
            AblePurePipe], exports: [AblePipe,
            AblePurePipe] }); })();

    exports.AbilityModule = AbilityModule;
    exports.AblePipe = AblePipe;
    exports.AblePurePipe = AblePurePipe;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
