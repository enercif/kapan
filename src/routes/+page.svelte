<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { insertStore, selectStores, updateStore } from '$lib/remote/stores.remote';
	import type { StoreUpdate } from '$lib/types/store.types';
	import type { Store } from '$lib/types/stores.type';
	import { CircleCheckIcon, CircleXIcon, InfoIcon, StoreIcon } from '@lucide/svelte';
	import cronstrue from 'cronstrue';

	let stores = $state(await selectStores());

	const cronCheckRegex =
		/^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([01]?\d|2[0-3])) (\*|([1-9]|[12]\d|3[01])) (\*|(0?[1-9]|1[0-2]))$/;

	function validateCron(cron: string) {
		return cronCheckRegex.test(cron);
	}

	function cronToText(cron: string) {
		return cronstrue.toString(cron);
	}

	function addSteamStore() {
		insertStore({ id: 'steam' });
	}

	function addEpicStore() {
		insertStore({ id: 'epic' });
	}

	function mapIdToName(id: Store) {
		switch (id) {
			case 'steam':
				return 'Steam';
			case 'epic':
				return 'Epic Games';
			default:
				return 'Unknown Store';
		}
	}

	function mapIdToLogo(id: Store) {
		switch (id) {
			case 'steam':
				return 'steam_logo.png';
			case 'epic':
				return 'epic_logo.png';
			default:
				return 'default_logo.png';
		}
	}

	function loginIntoStore(store: StoreUpdate) {
		store.login = true;
		updateStore(store);
	}

	function toggleStoreActive(store: StoreUpdate) {
		store.active = !store.active;
		updateStore(store);
	}
</script>

<svelte:head>
	<title>Kapan - Dashboard</title>
</svelte:head>

<div class="flex size-full flex-col">
	<h1 class="text-4xl font-semibold">Dashboard</h1>

	<div class="grid grow gap-2 py-8">
		{#if stores.length > 0}
			<div class="flex flex-col items-start gap-4">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props}>Link new Store</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							<DropdownMenu.Item onclick={addSteamStore}>Steam</DropdownMenu.Item>
							<DropdownMenu.Item onclick={addEpicStore}>Epic Games</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<div class="flex w-full flex-row items-start gap-10">
					{#each stores as store}
						<Card.Root class="group relative w-90">
							<Card.Header>
								<Card.Title class="flex flex-row items-center gap-2">
									{#if store.login}
										<Switch
											class="cursor-pointer"
											checked={store.active}
											onCheckedChange={() => toggleStoreActive(store)}
										/>
										{mapIdToName(store.id)}
										<Badge class="z-10 ml-auto">Logged In</Badge>
									{:else}
										{mapIdToName(store.id)}
										<Badge variant="destructive" class="z-10 ml-auto">Not Logged In</Badge>
									{/if}
								</Card.Title>
							</Card.Header>
							<Card.Content class="grid grid-cols-3 gap-3 gap-y-6 py-2">
								<img
									src={mapIdToLogo(store.id)}
									alt={mapIdToName(store.id) + ' logo'}
									class="absolute top-0 right-0 h-full translate-x-1/3 py-3 opacity-50 transition-transform duration-200 group-hover:translate-x-full"
									class:grayscale={!store.active}
								/>

								{#if store.login}
									<div class="z-10 col-span-2 flex w-full flex-col gap-1.5">
										<Label for="last-redeem" class="ml-1.5">Last Update</Label>
										<Input
											type="text"
											id="last-redeem"
											placeholder="Last Update"
											disabled
											value="2026-01-01 12:00:00"
										/>
									</div>

									<div class="z-10 flex w-full flex-col gap-1.5">
										<Label for="last-status" class="ml-1.5">Last Status</Label>
										<Input
											type="text"
											id="last-status"
											placeholder="Last Status"
											disabled
											value="Error"
										/>
									</div>

									<div class="z-10 col-span-3 flex w-full flex-col gap-1.5">
										<Label for="last-status" class="ml-1.5">Cron</Label>

										<InputGroup.Root class="backdrop-blur-2xl">
											<InputGroup.Input
												id="last-status"
												placeholder="0 9 * * *"
												bind:value={store.cron}
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
														<a href="https://crontab.guru/">What is a cron?</a>
													</Tooltip.Content>
												</Tooltip.Root>
											</InputGroup.Addon>
											<InputGroup.Addon align="inline-end">
												{#if validateCron(store.cron)}
													<CircleCheckIcon class="text-green-500" />
												{:else}
													<CircleXIcon class="text-red-500" />
												{/if}
											</InputGroup.Addon>
										</InputGroup.Root>

										{#if !validateCron(store.cron)}
											<p class="ml-1.5 text-sm text-red-500">Invalid cron expression</p>
										{:else}
											<p class="ml-1.5 text-sm">{cronToText(store.cron)}</p>
										{/if}
									</div>
								{/if}
							</Card.Content>
							{#if store.login}
								<Card.Footer class="grid grid-cols-2 gap-2">
									<Button class="z-10">Redeem Now</Button>
									<Button class="z-10" variant="outline">Re-Login</Button>
								</Card.Footer>
							{:else}
								<Card.Footer>
									<Button class="z-10 w-full" onclick={() => loginIntoStore(store)}>Login</Button>
								</Card.Footer>
							{/if}
						</Card.Root>
					{/each}
				</div>
			</div>
		{:else}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<StoreIcon />
					</Empty.Media>
					<Empty.Title>No Stores Yet</Empty.Title>
					<Empty.Description>
						You haven't created linked stores yet. Get started by linking your first store.
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props}>Link Store</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Item onclick={addSteamStore}>Steam</DropdownMenu.Item>
								<DropdownMenu.Item onclick={addEpicStore}>Epic Games</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Empty.Content>
			</Empty.Root>
		{/if}

		<Tabs.Root value="history">
			<Tabs.List>
				<Tabs.Trigger value="history">History</Tabs.Trigger>
				<Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="history">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-25">Invoice</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Method</Table.Head>
							<Table.Head class="text-end">Amount</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row>
							<Table.Cell class="font-medium">INV001</Table.Cell>
							<Table.Cell>Paid</Table.Cell>
							<Table.Cell>Credit Card</Table.Cell>
							<Table.Cell class="text-end">$250.00</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</Tabs.Content>
			<Tabs.Content value="notifications">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-25">Invoice</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Method</Table.Head>
							<Table.Head class="text-end">Amount</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row>
							<Table.Cell class="font-medium">INV001</Table.Cell>
							<Table.Cell>Paid</Table.Cell>
							<Table.Cell>Credit Card</Table.Cell>
							<Table.Cell class="text-end">$250.00</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
