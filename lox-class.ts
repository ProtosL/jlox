export class LoxClass {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    public toString(): string {
        return this.name;
    }
}