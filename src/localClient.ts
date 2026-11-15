import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { OsojiVacuumPlatformConfig } from './config';

type LocalResponse = { ok: boolean; cleaning?: boolean; status?: string; battery?: number; error?: string };

export class OsojiLocalClient {
  constructor(private readonly config: OsojiVacuumPlatformConfig) {}

  async execute(action: 'status' | 'start' | 'dock'): Promise<LocalResponse> {
    const python = this.config.pythonPath || '/home/homebridge/tinytuya-env/bin/python';
    const script = resolve(__dirname, '../scripts/local_bridge.py');
    const input = JSON.stringify({
      action,
      deviceId: this.config.deviceId,
      ip: this.config.localIp,
      localKey: this.config.localKey,
      version: this.config.localVersion || '3.4',
    });
    return new Promise((resolveResult, reject) => {
      const child = spawn(python, [script], { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let settled = false;
      const finish = (err?: Error, value?: LocalResponse) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) reject(err);
        else resolveResult(value!);
      };
      const timer = setTimeout(() => {
        child.kill();
        finish(new Error('Local Tuya request timed out'));
      }, 10000);
      child.on('error', () => finish(new Error('Cannot start TinyTuya Python transport')));
      child.stdout.on('data', chunk => { stdout += chunk.toString(); if (stdout.length > 65536) child.kill(); });
      child.stderr.on('data', chunk => { stderr += chunk.toString(); if (stderr.length > 65536) child.kill(); });
      child.on('close', code => {
        try {
          const response = JSON.parse(stdout.trim()) as LocalResponse;
          if (code !== 0 || !response.ok) return finish(new Error('TinyTuya local operation failed: ' + (response.error || 'transport')));
          finish(undefined, response);
        } catch {
          finish(new Error('Invalid response from TinyTuya local transport'));
        }
      });
      child.stdin.on('error', () => { /* close/error handler handles process failure */ });
      child.stdin.end(input);
    });
  }

  async getCleaning(): Promise<boolean> {
    const response = await this.execute('status');
    return response.cleaning === true;
  }

  async setCleaning(isOn: boolean): Promise<void> {
    await this.execute(isOn ? 'start' : 'dock');
  }
}
