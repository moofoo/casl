import * as i0 from '@angular/core';
import { Pipe, Inject, NgModule } from '@angular/core';
import { PureAbility } from '@casl/ability';
import { Observable } from 'rxjs';

class AblePipe {
    constructor(ability) {
        this._ability = ability;
    }
    transform(...args) {
        return this._ability.can(...args);
    }
}
AblePipe.ɵfac = function AblePipe_Factory(t) { return new (t || AblePipe)(i0.ɵɵdirectiveInject(PureAbility, 16)); };
AblePipe.ɵpipe = /*@__PURE__*/ i0.ɵɵdefinePipe({ name: "able", type: AblePipe, pure: false });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AblePipe, [{
        type: Pipe,
        args: [{ name: 'able', pure: false }]
    }], function () { return [{ type: undefined, decorators: [{
                type: Inject,
                args: [PureAbility]
            }] }]; }, null); })();
class AblePurePipe {
    constructor(ability) {
        this._ability = ability;
    }
    // TODO: `Observable` can be removed after https://github.com/angular/angular/issues/15041
    transform(...args) {
        return new Observable((s) => {
            const emit = () => s.next(this._ability.can(...args));
            emit();
            return this._ability.on('updated', emit);
        });
    }
}
AblePurePipe.ɵfac = function AblePurePipe_Factory(t) { return new (t || AblePurePipe)(i0.ɵɵdirectiveInject(PureAbility, 16)); };
AblePurePipe.ɵpipe = /*@__PURE__*/ i0.ɵɵdefinePipe({ name: "ablePure", type: AblePurePipe, pure: true });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AblePurePipe, [{
        type: Pipe,
        args: [{ name: 'ablePure' }]
    }], function () { return [{ type: undefined, decorators: [{
                type: Inject,
                args: [PureAbility]
            }] }]; }, null); })();

class AbilityModule {
}
AbilityModule.ɵfac = function AbilityModule_Factory(t) { return new (t || AbilityModule)(); };
AbilityModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: AbilityModule });
AbilityModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({});
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
//# sourceMappingURL=index.mjs.map
