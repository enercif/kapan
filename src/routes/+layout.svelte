<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import logo from '$lib/assets/logo.png';
	import Button from '$lib/components/ui/button/button.svelte';
	import ModeToggle from '$lib/components/ui/mode-toggle/mode-toggle.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { navigation } from '$lib/navigation';
	import { selectDashboard } from '$lib/remote/dashboard.remote';
	import { MonitorIcon } from '@lucide/svelte';
	import { ModeWatcher } from 'mode-watcher';
	import './layout.css';

	let { children } = $props();

	const stores = $derived(selectDashboard().current?.stores ?? []);
	const sessionActive = $derived(stores.some((s) => s.logging || s.redeeming));
	const vncUrl = $derived(`http://${page.url.hostname}:6080/vnc.html`);
</script>

<svelte:head><link rel="icon" href={logo} /></svelte:head>

<Toaster richColors position="top-center" closeButton />
<ModeWatcher />
<Tooltip.Provider delayDuration={200}>
	<main class="flex h-screen w-screen flex-col gap-0 bg-sidebar">
		<div class="relative flex flex-row items-center justify-between px-6 py-2">
			<a class="flex flex-row items-center" href={resolve('/')}>
				<img src={logo} alt="SvelteKit logo" class="size-10" />
			</a>

			<div class="flex flex-row items-center gap-4">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							href={sessionActive ? vncUrl : undefined}
							disabled={!sessionActive}
							target="_blank"
							variant="outline"
							size="icon"
						>
							<MonitorIcon />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>{sessionActive ? 'Open noVNC' : 'Only available during login or redeem'}</p>
					</Tooltip.Content>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger>
						<ModeToggle />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Toggle Mode</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>

			<div class="absolute top-1/2 right-1/2 flex translate-x-1/2 -translate-y-1/2 flex-row gap-4">
				{#each navigation as navItem}
					<Button
						href={navItem.href}
						aria-current={page.url.pathname === navItem.href}
						variant="ghost"
						class="text-sidebar-foreground aria-current:text-primary"
					>
						{navItem.name}
					</Button>
				{/each}
			</div>
		</div>

		<div class="m-2.5 mt-0 grow rounded-l-2xl rounded-r-lg bg-background px-4 py-6">
			{@render children()}
		</div>
	</main>
</Tooltip.Provider>
