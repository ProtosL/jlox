import { Interpreter } from './interpreter';
import { Nullable } from './type';
import { LoxInstance } from './lox-instance';
import { LoxCallable } from './lox-callable';
import { LoxFunction } from './lox-function';

export class LoxClass implements LoxCallable {
    readonly name: string;
    private readonly methods: Map<string, LoxFunction>;

    constructor(name: string, methods: Map<string, LoxFunction>) {
        this.name = name;
        this.methods = methods;
    }

    findMethod(name: string): Nullable<LoxFunction> {
        if (this.methods.has(name)) {
            return this.methods.get(name) ?? null;
        }

        return null;
    }

    public toString(): string {
        return this.name;
    }

    public call(interpreter: Interpreter, argumentList: Nullable<Object>[]) {
        const instance: LoxInstance = new LoxInstance(this);
        const initializer: Nullable<LoxFunction> = this.findMethod("init");
        if (initializer !== null) {
            initializer.bind(instance).call(interpreter, argumentList);
        }
        
        return instance;
    }

    public arity(): number {
        const initializer: Nullable<LoxFunction> = this.findMethod("init");
        if (initializer === null) {
            return 0;
        }
        return initializer.arity();
    }
}