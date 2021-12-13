import { PipeTransform } from '@angular/core';
import { Unsubscribe, AnyAbility } from '@casl/ability';
import { Observable } from 'rxjs';
import * as i0 from "@angular/core";
export declare class AblePipe<T extends AnyAbility> implements PipeTransform {
    protected _unsubscribeFromAbility?: Unsubscribe;
    private _ability;
    constructor(ability: T);
    transform(...args: Parameters<T['can']>): boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<AblePipe<any>, never>;
    static ɵpipe: i0.ɵɵPipeDeclaration<AblePipe<any>, "able">;
}
export declare class AblePurePipe<T extends AnyAbility> implements PipeTransform {
    private _ability;
    constructor(ability: T);
    transform(...args: Parameters<T['can']>): Observable<boolean>;
    static ɵfac: i0.ɵɵFactoryDeclaration<AblePurePipe<any>, never>;
    static ɵpipe: i0.ɵɵPipeDeclaration<AblePurePipe<any>, "ablePure">;
}
