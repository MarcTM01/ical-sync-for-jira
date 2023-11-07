import { getConfigurationValueFromEnv } from '@utils/config';

const configName = 'TEST_CONFIG';

describe('Unit test for the environment configuration parser', () => {
  it('Should parse integers correctly', () => {
    const parsedNumber = getConfigurationValueFromEnv(
      { [configName]: '42' },
      {
        name: configName,
        isRequired: true,
        converter: parseInt,
        convertedValidator: (it) => it > 0,
      },
    );
    expect(parsedNumber).toBe(42);
  });

  it('Should parse strings without requiring a converter', () => {
    const parsedString = getConfigurationValueFromEnv(
      { [configName]: 'TEST' },
      {
        name: configName,
        isRequired: true,
      },
    );
    expect(parsedString).toBe('TEST');
  });

  it('Should return a default value if the config is not present', () => {
    const parsedString = getConfigurationValueFromEnv(
      {},
      {
        name: configName,
        isRequired: false,
        defaultValue: 'DEFAULT',
      },
    );
    expect(parsedString).toBe('DEFAULT');
  });

  it('Should throw an error if a required config option is not present', () => {
    expect(() => {
      getConfigurationValueFromEnv(
        {},
        {
          name: configName,
          isRequired: true,
        },
      );
    }).toThrow("The config option 'TEST_CONFIG' is required");
  });

  it('Should throw an error if the string validator does not pass', () => {
    expect(() => {
      getConfigurationValueFromEnv(
        { [configName]: 'TEST' },
        {
          name: configName,
          stringValidator: () => false,
          isRequired: true,
        },
      );
    }).toThrow("Invalid value 'TEST' for configuration property 'TEST_CONFIG'");
  });

  it('Should throw an error if the parsed validator does not pass', () => {
    expect(() => {
      getConfigurationValueFromEnv(
        { [configName]: '-1' },
        {
          name: configName,
          isRequired: true,
          converter: parseInt,
          convertedValidator: (it) => it > 0,
        },
      );
    }).toThrow("Invalid value '-1' for configuration property 'TEST_CONFIG'");
  });
});
