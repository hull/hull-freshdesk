import { AwilixContainer, asValue } from "awilix";

const setupContainer = (container: AwilixContainer): void => {
  const logger = {
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  container.register("logger", asValue(logger));
};

export default setupContainer;
