<script module lang="ts">
	import type { Store } from '$lib/types/stores.type';

	const CRON_REGEX =
		/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})|(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)$/;

	const STORE_NAMES: Record<Store, string> = {
		steam: 'Steam',
		epic: 'Epic Games'
	};

	const STORE_LOGOS: Record<Store, string> = {
		steam: 'steam_logo.png',
		epic: 'epic_logo.png'
	};
</script>

<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { updateStore } from '$lib/remote/stores.remote';
	import type { StoreSelect } from '$lib/types/store.types';
	import { CircleCheckIcon, CircleXIcon, InfoIcon } from '@lucide/svelte';
	import cronstrue from 'cronstrue/i18n';
	import { toast } from 'svelte-sonner';
	import { backOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';

	interface Props {
		store: StoreSelect;
	}

	let { store }: Props = $props();

	let active = $derived(store.active);
	let cron = $derived(store.cron);
	let savedCron = $derived(store.cron);

	const storeName = $derived(STORE_NAMES[store.id] ?? store.id);
	const storeLogo = $derived(STORE_LOGOS[store.id]);
	const cronValid = $derived(CRON_REGEX.test(cron));
	const cronChanged = $derived(cron !== savedCron);
	const cronText = $derived(cronToText(cron));

	function cronToText(expr: string): string {
		try {
			return cronstrue.toString(expr, { locale: 'en' });
		} catch {
			return 'Invalid cron expression';
		}
	}

	function onActiveChange(newActive: boolean) {
		active = newActive;
		updateStore({ ...store, active: newActive });
		toast(newActive ? 'Store activated' : 'Store deactivated', {
			description: `Cron updates and redeeming has been ${newActive ? 'enabled' : 'disabled'} for ${storeName}`
		});
	}

	function loginIntoStore() {
		updateStore({ ...store, login: true });
	}

	function saveCron() {
		savedCron = cron;
		updateStore({ ...store, cron });
		toast.success(`Cron updated for ${storeName}`);
	}

	function redeemNow() {
		// TODO: implement redeem logic
	}
</script>

<Card.Root class="group relative w-90">
	<Card.Header>
		<Card.Title class="flex flex-row items-center gap-2">
			{#if store.login}
				<Switch class="cursor-pointer" checked={active} onCheckedChange={onActiveChange} />
			{/if}
			{storeName}
			<Badge variant={store.login ? 'default' : 'destructive'} class="z-10 ml-auto">
				{store.login ? 'Logged In' : 'Not Logged In'}
			</Badge>
		</Card.Title>
	</Card.Header>

	<Card.Content class="grid grid-cols-3 gap-3 gap-y-6 py-2">
		<img
			src={storeLogo}
			alt="{storeName} logo"
			class={[
				'absolute top-0 right-0 h-full translate-x-1/3 py-3 opacity-50 transition-transform duration-200 group-hover:translate-x-full',
				!active && 'grayscale'
			]}
		/>

		{#if store.login}
			<div class="z-10 col-span-2 flex w-full flex-col gap-1.5">
				<Label for="last-update" class="ml-1.5">Last Update</Label>
				<Input type="text" id="last-update" placeholder="Never" disabled />
			</div>

			<div class="z-10 flex w-full flex-col gap-1.5">
				<Label for="last-status" class="ml-1.5">Last Status</Label>
				<Input type="text" id="last-status" placeholder="Unknown" disabled />
			</div>

			<div class="z-10 col-span-3 flex w-full flex-col gap-1.5">
				<Label for="cron-input" class="ml-1.5">Cron</Label>

				<div class="flex w-full flex-row items-center gap-2">
					<InputGroup.Root class="grow backdrop-blur-2xl">
						<InputGroup.Input
							id="cron-input"
							placeholder="0 9 * * *"
							bind:value={cron}
							disabled={!active}
						/>
						<InputGroup.Addon>
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<InputGroup.Button {...props} class="rounded-full" size="icon-xs">
											<InfoIcon />
										</InputGroup.Button>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>
									<a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer">
										What is a cron?
									</a>
								</Tooltip.Content>
							</Tooltip.Root>
						</InputGroup.Addon>
						<InputGroup.Addon align="inline-end">
							{#if active}
								{#if cronValid}
									<CircleCheckIcon class="text-green-500" />
								{:else}
									<CircleXIcon class="text-red-500" />
								{/if}
							{/if}
						</InputGroup.Addon>
					</InputGroup.Root>

					{#if cronChanged}
						<span
							in:scale={{ duration: 200, start: 0.75, easing: backOut }}
							out:scale={{ duration: 120, start: 0.75 }}
						>
							<Button disabled={!cronValid} onclick={saveCron}>Save</Button>
						</span>
					{/if}
				</div>

				<p class="ml-1.5 text-sm" class:text-red-500={!cronValid}>
					{cronText}
				</p>
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="flex flex-row gap-2">
		{#if store.login}
			<Button class="z-10 grow" disabled={!active} onclick={redeemNow}>Redeem Now</Button>
		{:else}
			<Button class="z-10 grow" onclick={loginIntoStore}>Login</Button>
		{/if}
	</Card.Footer>
</Card.Root>
