<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { notificationsStore } from '$lib/state/notifications.state.svelte';
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
		{#each notificationsStore.value as notification}
			<Table.Row>
				<Table.Cell class="font-medium">{notification.title}</Table.Cell>
				<Table.Cell>{notification.message}</Table.Cell>
				<Table.Cell>{notification.level}</Table.Cell>
				<Table.Cell class="text-end">{notification.status}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
