import { spawn, type ChildProcess } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { setTimeout as sleep } from 'timers/promises';

const DISPLAY_NUM = 99;
const X_SOCKET = `/tmp/.X11-unix/X${DISPLAY_NUM}`;
const VNC_PORT = 6080;

let procs: ChildProcess[] = [];

export async function startDisplay(): Promise<void> {
	if (procs.length) return;

	rmSync(`/tmp/.X${DISPLAY_NUM}-lock`, { force: true });

	const run = (cmd: string, args: string[]) => {
		const proc = spawn(cmd, args, { stdio: 'ignore' });
		proc.on('error', (err) => console.error(`${cmd} failed:`, err.message));
		procs.push(proc);
		return proc;
	};

	run('Xvfb', [`:${DISPLAY_NUM}`, '-screen', '0', '1920x1080x24']);

	for (let i = 0; i < 50 && !existsSync(X_SOCKET); i++) await sleep(100);
	if (!existsSync(X_SOCKET)) {
		stopDisplay();
		throw new Error(`Xvfb did not come up on :${DISPLAY_NUM}`);
	}

	run('x11vnc', ['-display', `:${DISPLAY_NUM}`, '-forever', '-nopw', '-quiet']);
	run('websockify', ['--web', '/usr/share/novnc', String(VNC_PORT), 'localhost:5900']);
}

export function stopDisplay(): void {
	for (const proc of procs) proc.kill();
	procs = [];
}
