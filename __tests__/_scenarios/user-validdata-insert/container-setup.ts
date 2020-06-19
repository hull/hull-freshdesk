import { AwilixContainer, asValue } from "awilix";

const setupContainer = (container: AwilixContainer): void => {
  container.register("logger", asValue(console));
};

export default setupContainer;
