import { App } from './app';

async function main(): Promise<void> {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const app = new App(canvas);

  try {
    await app.init();
    app.start();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

main();
