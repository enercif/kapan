<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { STORE_LOGOS, STORE_NAMES, loginFn, redeemFn } from '$lib/const/maps';
	import { CRON_REGEX } from '$lib/const/regex';
	import { selectDashboard } from '$lib/remote/dashboard.remote';
	import { deleteStore, toggleStore, updateCronStore } from '$lib/remote/stores.remote';
	import type { StoreSelect } from '$lib/types/store.types';
	import { formatDate } from '$lib/utils';
	import { CircleCheckIcon, CircleXIcon, InfoIcon, TrashIcon } from '@lucide/svelte';
	import cronstrue from 'cronstrue/i18n';
	import { toast } from 'svelte-sonner';
	import { backOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import Status from './status.svelte';

	interface Props {
		store: StoreSelect;
	}

	let { store }: Props = $props();

	let active = $derived(store.active);
	let cron = $derived(store.cron);
	let initialCron = $derived(store.cron);

	const storeName = $derived(STORE_NAMES[store.id] ?? store.id);
	const storeLogo = $derived(STORE_LOGOS[store.id]);
	const cronValid = $derived(CRON_REGEX.test(cron));
	const cronChanged = $derived(cron !== initialCron);
	const cronText = $derived(cronToText(cron));

	let open = $state(false);

	const lastUpdate = $derived((await selectDashboard()).history.find((h) => h.store === storeName));

	function cronToText(expr: string): string {
		try {
			return cronstrue.toString(expr, { locale: 'en' });
		} catch {
			return 'Invalid cron expression';
		}
	}

	async function onActiveChange(active: boolean) {
		await toggleStore({ id: store.id, active });
		toast.success(active ? `${storeName} has been activated` : `${storeName} has been deactivated`);
	}

	async function login() {
		await loginFn[store.id]();
	}

	function saveCron() {
		initialCron = cron;
		updateCronStore({ id: store.id, cron });
		toast.success(`Cron updated for ${storeName}`);
	}

	async function redeem() {
		await redeemFn[store.id](true);
	}

	function onDelete() {
		deleteStore(store.id).then(() => {
			open = false;
			toast(`Profile for ${storeName} has been deleted`);
		});
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
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
						<Input
							type="text"
							id="last-update"
							value={lastUpdate ? formatDate(lastUpdate.created_at) : 'Never'}
							disabled
						/>
					</div>

					<div class="z-10 flex w-full flex-col gap-1.5">
						<Label for="last-status" class="ml-1.5">Last Status</Label>
						<Status type={lastUpdate?.status}>
							{lastUpdate?.status || 'Unknown'}
						</Status>
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
					<Button class="z-10 grow" disabled={!active || store.redeeming} onclick={redeem}>
						{#if store.redeeming}
							<Spinner />
							Redeeming...
						{:else}
							Redeem Now
						{/if}
					</Button>
				{:else}
					<Button class="z-10 grow" onclick={login} disabled={store.logging}>
						{#if store.logging}
							<Spinner />
							Logging in...
						{:else}
							Login
						{/if}
					</Button>
				{/if}
			</Card.Footer>
		</Card.Root>
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item onclick={() => (open = true)}>
			Delete Profile
			<TrashIcon class="text-destructive" />
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
			<Dialog.Description>
				This action will delete your current profile for {storeName}. You will have to login again
				if you want to use this store.
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
				Cancel
			</Dialog.Close>
			<Button variant="destructive" onclick={onDelete}>Delete Profile</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
