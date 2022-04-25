import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';

export type DecorateIfHandler = (value: any, data: any) => boolean;

export const DECORATE_IF = 'decorateIf';

export function decorateIf(
  value: unknown,
  data: any,
  condition: DecorateIfHandler,
  decorate: DecorateIfHandler,
): boolean {
  const shouldDecorate = condition(value, data);
  console.log(value, data, shouldDecorate);

  return !shouldDecorate || (shouldDecorate && decorate(value, data));
}

export function DecorateIf(
  condition: DecorateIfHandler,
  decorate: DecorateIfHandler,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: DECORATE_IF,
      constraints: [condition, decorate],
      validator: {
        validate: (value, args) => {
          console.log(value, args);
          return decorateIf(
            value,
            args.object,
            args.constraints[0],
            args.constraints[1],
          );
        },
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property is invalid',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
