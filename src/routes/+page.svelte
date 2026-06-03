<script lang="ts">
	import StorefrontCard from '$lib/components/storefront-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { AVAILABLE_STORES } from '$lib/const/available-stores';
	import { insertStore, selectStores } from '$lib/remote/stores.remote';
	import type { Store } from '$lib/types/stores.type';
	import { StoreIcon } from '@lucide/svelte';

	let stores = $state(await selectStores());

	async function insertStoreWithId(id: Store) {
		const result = await insertStore({ id });
		stores.push(result);
	}

	const storeIds = $derived(stores.map((s) => s.id));
	const availableToAdd = $derived(AVAILABLE_STORES.filter((s) => !storeIds.includes(s)));

	function idToLabel(id: Store) {
		switch (id) {
			case 'steam':
				return 'Steam';
			case 'epic':
				return 'Epic Games';
			default:
				return id;
		}
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
							<Button {...props} disabled={availableToAdd.length === 0}>Link new Store</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							{#each availableToAdd as storeId}
								<DropdownMenu.Item onclick={() => insertStoreWithId(storeId)}>
									{idToLabel(storeId)}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<div class="flex w-full flex-row items-start gap-10">
					{#each stores as store}
						<StorefrontCard {store} />
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
								<DropdownMenu.Item onclick={() => insertStoreWithId('steam')}
									>Steam</DropdownMenu.Item
								>
								<DropdownMenu.Item onclick={() => insertStoreWithId('epic')}
									>Epic Games</DropdownMenu.Item
								>
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
