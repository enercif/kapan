<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import type { Notification } from '$lib/types/notification.type';
	import { formatDate } from '$lib/utils';
	import Status from './status.svelte';

	interface Props {
		notificationEntries: Notification[];
	}

	let { notificationEntries }: Props = $props();
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
				<Table.Cell class="font-medium">{formatDate(notificationEntry.created_at)}</Table.Cell>
				<Table.Cell>{notificationEntry.title}</Table.Cell>
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
