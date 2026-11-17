
import {
  registerDecorator,
  type ValidationOptions,
  type ValidationArguments,
} from 'class-validator';

export function NoLeadingSpecialChars(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    registerDecorator({
      name: 'NoLeadingSpecialChars',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          return /^[\p{L}\p{N}]/u.test(value.trim());
        },

        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must start with a letter or number.`;
        },
      },
    });
  };
}
