import * as i0 from '@angular/core';
import { Pipe, Inject, NgModule } from '@angular/core';
import { PureAbility } from '@casl/ability';
import { Observable } from 'rxjs';

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
    AblePipe.ɵfac = function AblePipe_Factory(t) { return new (t || AblePipe)(i0.ɵɵdirectiveInject(PureAbility, 16)); };
    AblePipe.ɵpipe = /*@__PURE__*/ i0.ɵɵdefinePipe({ name: "able", type: AblePipe, pure: false });
    return AblePipe;
}());
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AblePipe, [{
        type: Pipe,
        args: [{ name: 'able', pure: false }]
    }], function () { return [{ type: undefined, decorators: [{
                type: Inject,
                args: [PureAbility]
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
        return new Observable(function (s) {
            var emit = function () {
                var _a;
                return s.next((_a = _this._ability).can.apply(_a, args));
            };
            emit();
            return _this._ability.on('updated', emit);
        });
    };
    AblePurePipe.ɵfac = function AblePurePipe_Factory(t) { return new (t || AblePurePipe)(i0.ɵɵdirectiveInject(PureAbility, 16)); };
    AblePurePipe.ɵpipe = /*@__PURE__*/ i0.ɵɵdefinePipe({ name: "ablePure", type: AblePurePipe, pure: true });
    return AblePurePipe;
}());
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AblePurePipe, [{
        type: Pipe,
        args: [{ name: 'ablePure' }]
    }], function () { return [{ type: undefined, decorators: [{
                type: Inject,
                args: [PureAbility]
            }] }]; }, null); })();

var AbilityModule = /** @class */ (function () {
    function AbilityModule() {
    }
    AbilityModule.ɵfac = function AbilityModule_Factory(t) { return new (t || AbilityModule)(); };
    AbilityModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: AbilityModule });
    AbilityModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({});
    return AbilityModule;
}());
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AbilityModule, [{
        type: NgModule,
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
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(AbilityModule, { declarations: [AblePipe,
        AblePurePipe], exports: [AblePipe,
        AblePurePipe] }); })();

export { AbilityModule, AblePipe, AblePurePipe };
//# sourceMappingURL=index.js.map
