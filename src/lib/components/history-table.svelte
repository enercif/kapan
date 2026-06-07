<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { historyStore } from '$lib/state/history.state.svelte';
	import { formatDate } from '$lib/utils';

	const historyEntries = $derived(historyStore.value);
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Date</Table.Head>
			<Table.Head>Store</Table.Head>
			<Table.Head>Header</Table.Head>
			<Table.Head>Body</Table.Head>
			<Table.Head class="text-end">Status</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each historyEntries as historyEntry}
			<Table.Row>
				<Table.Cell class="font-medium">{formatDate(historyEntry.created_at)}</Table.Cell>
				<Table.Cell>{historyEntry.store}</Table.Cell>
				<Table.Cell>{historyEntry.header}</Table.Cell>
				<Table.Cell>{historyEntry.body}</Table.Cell>
				<Table.Cell class="text-end">{historyEntry.status}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
