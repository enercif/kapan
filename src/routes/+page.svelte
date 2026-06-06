<script lang="ts">
	import HistoryTable from '$lib/components/history-table.svelte';
	import NotificationsTable from '$lib/components/notifications-table.svelte';
	import StorefrontCard from '$lib/components/storefront-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { STORE_NAMES } from '$lib/const/maps';
	import { AVAILABLE_STORES } from '$lib/const/store-ids';
	import { insertStore, selectStores } from '$lib/remote/stores.remote';
	import type { StoreID } from '$lib/types/store-id.type';
	import { StoreIcon } from '@lucide/svelte';

	let stores = $state(await selectStores());

	async function insertStoreWithId(id: StoreID) {
		const result = await insertStore({ id });
		stores.push(result);
	}

	const storeIds = $derived(stores.map((s) => s.id));
	const availableToAdd = $derived(AVAILABLE_STORES.filter((s) => !storeIds.includes(s)));
</script>

<svelte:head>
	<title>Kapan - Dashboard</title>
</svelte:head>

<div class="flex size-full flex-col">
	<h1 class="text-4xl font-semibold">Dashboard</h1>

	<div class="grid grow gap-2 py-8">
		{#if stores.length > 0}
			<div class="flex flex-col items-start gap-4">
				{@render storeDropdown()}

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
					{@render storeDropdown()}
				</Empty.Content>
			</Empty.Root>
		{/if}

		<Tabs.Root value="history" class="h-60">
			<Tabs.List>
				<Tabs.Trigger value="history">History</Tabs.Trigger>
				<Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="history">
				<HistoryTable />
			</Tabs.Content>
			<Tabs.Content value="notifications">
				<NotificationsTable />
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>

{#snippet storeDropdown()}
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
						{STORE_NAMES[storeId]}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}
