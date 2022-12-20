import { Nullable } from "./type";

export class Return extends Error {
    readonly value: Nullable<Object>;

    constructor(value: Nullable<Object>) {
        super();
        this.value = value;
    }
}