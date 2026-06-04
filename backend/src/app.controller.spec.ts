import { AppController } from './app.controller';

describe('AppController', () => {
  const controller = new AppController();

  it('health() reports ok', () => {
    expect(controller.health().status).toBe('ok');
  });

  it('root() identifies the service', () => {
    expect(controller.root().name).toBe('kari-backend');
  });
});
