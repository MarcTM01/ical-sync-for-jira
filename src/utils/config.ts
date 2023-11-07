import assert from 'assert';

export type SystemEnvs = { readonly [key: string]: string | undefined };

type IsRequiredAndDefaultValue<ConfigurationValueType> =
  | {
      isRequired: true;
    }
  | {
      // You must specify a default value if the field is not required
      isRequired: false;
      defaultValue: ConfigurationValueType;
    };

type ConfigurationValueConfigurationBase<ConfigurationValueType> = {
  name: string;
  stringValidator?: (rawValue: string) => boolean;
  convertedValidator?: (converted: ConfigurationValueType) => boolean;
  converter?: (rawValue: string) => ConfigurationValueType;
} & IsRequiredAndDefaultValue<ConfigurationValueType>;

type ConfigurationValueConfiguration<ConfigurationValueType> =
  string extends ConfigurationValueType
    ? ConfigurationValueConfigurationBase<ConfigurationValueType>
    : ConfigurationValueConfigurationBase<ConfigurationValueType> & {
        // You must specify a converter, if a string is not assignable to the output type
        converter: (rawValue: string) => ConfigurationValueType;
      };

export function getConfigurationValueFromEnv<ConfigurationValueType>(
  env: SystemEnvs,
  config: ConfigurationValueConfiguration<ConfigurationValueType>,
): ConfigurationValueType {
  const value = env[config.name];

  if (value === undefined) {
    if (config.isRequired) {
      throw new Error(`The config option '${config.name}' is required`);
    } else {
      return config.defaultValue;
    }
  }

  if (config.stringValidator) {
    assert(
      config.stringValidator(value),
      `Invalid value '${value}' for configuration property '${config.name}'`,
    );
  }

  const convertedValue: ConfigurationValueType = config.converter
    ? config.converter(value)
    : (value as ConfigurationValueType);

  if (config.convertedValidator) {
    assert(
      config.convertedValidator(convertedValue),
      `Invalid value '${value}' for configuration property '${config.name}'`,
    );
  }

  return convertedValue;
}
