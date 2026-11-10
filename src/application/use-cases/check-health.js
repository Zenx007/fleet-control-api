export class CheckHealth {
  constructor({ healthIndicator }) {
    this.healthIndicator = healthIndicator;
  }

  async execute() {
    return this.healthIndicator.isHealthy();
  }
}
