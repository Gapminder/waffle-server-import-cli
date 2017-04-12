export abstract class DefaultStep {
    readonly data: any = {};
    public question: any = {};

    abstract choices(): any;

    public constructor(data?: any) {
        this.data = Object.assign(this.data, data);
    }

    public abstract run(): void;
}