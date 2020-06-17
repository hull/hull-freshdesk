export default interface IFieldsSchema {
    ok: boolean;
    error: null | string;
    options: IFieldsSchemaOption[];
}

interface IFieldsSchemaOption {
    value: string;
    label: string;
}