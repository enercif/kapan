<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { notificationsStore } from '$lib/state/notifications.state.svelte';
	import Status from './status.svelte';

	const notificationEntries = $derived(notificationsStore.value);
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-25">Date</Table.Head>
			<Table.Head>Title</Table.Head>
			<Table.Head>Message</Table.Head>
			<Table.Head>Level</Table.Head>
			<Table.Head class="text-end">Status</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each notificationEntries as notificationEntry}
			<Table.Row>
				<Table.Cell class="font-medium">{notificationEntry.title}</Table.Cell>
				<Table.Cell>{notificationEntry.message}</Table.Cell>
				<Table.Cell>{notificationEntry.level}</Table.Cell>

				<Table.Cell class="flex justify-end">
					<Status type={notificationEntry.status}>
						{notificationEntry.status}
					</Status>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
