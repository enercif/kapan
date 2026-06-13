<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { selectHistory } from '$lib/remote/history.remote';
	import type { History } from '$lib/types/history.type';
	import { formatDate } from '$lib/utils';
	import { FileIcon, LinkIcon } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import Status from './status.svelte';
	import { Button } from './ui/button';
	import { buttonVariants } from './ui/button/button.svelte';

	let selectedHistoryEntry: History | null = $state(null);
	let open = $state(false);

	function handleRowClick(historyEntry: History) {
		selectedHistoryEntry = historyEntry;
		open = true;
	}

	function copyToClipboard() {
		if (selectedHistoryEntry) {
			navigator.clipboard.writeText(JSON.stringify(selectedHistoryEntry.log, null, 2));
			toast.success('Log copied to clipboard!');
		}
	}
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Date</Table.Head>
			<Table.Head>Store</Table.Head>
			<Table.Head>Header</Table.Head>
			<Table.Head>Body</Table.Head>
			<Table.Head>Status</Table.Head>
			<Table.Cell class="w-0" />
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each await selectHistory() as row}
			<Table.Row>
				<Table.Cell class="font-medium">{formatDate(row.created_at)}</Table.Cell>
				<Table.Cell>{row.store}</Table.Cell>
				<Table.Cell>{row.header}</Table.Cell>
				<Table.Cell>{row.body}</Table.Cell>
				<Table.Cell>
					<div class="w-fit">
						<Status type={row.status}>
							{row.status}
						</Status>
					</div>
				</Table.Cell>
				<Table.Cell>
					<Tooltip.Root>
						<Tooltip.Trigger
							class={buttonVariants({ variant: 'outline', size: 'icon' })}
							onclick={() => handleRowClick(row)}
						>
							<FileIcon />
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Show Logs</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<Dialog.Root bind:open>
	<Dialog.Content class="w-2xl">
		<Dialog.Header>
			<Dialog.Title>Log details</Dialog.Title>
			{#if selectedHistoryEntry}
				<Dialog.Description>
					{selectedHistoryEntry.store} — {formatDate(selectedHistoryEntry.created_at)}
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		<div class="flex max-h-100 flex-col gap-4 overflow-y-auto py-1 mb-5">
			{#if selectedHistoryEntry}
				{#if selectedHistoryEntry.log.type === 'login'}
					{#if selectedHistoryEntry.log.error}
						<div class="flex flex-col gap-1">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Error</p>
							<div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{selectedHistoryEntry.log.error}
							</div>
						</div>
					{:else}
						<div class="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
							No error message
						</div>
					{/if}
				{:else}
					<div class="flex flex-col gap-1">
						<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Found links
						</p>
						{#each selectedHistoryEntry.log.foundLinks as link}
							<a
								href={link}
								target="_blank"
								class="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm justify-between"
							>
								<span class="truncate">{link}</span>
								<LinkIcon class="size-4" />
							</a>
						{/each}
					</div>

					{#if selectedHistoryEntry.log.processedGames.length > 0}
						<div class="flex flex-col gap-1">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Processed games
							</p>
							{#each selectedHistoryEntry.log.processedGames as item}
								<div
									class="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2 text-sm"
								>
									<span class="truncate">{item.title}</span>
									{#if item.status === 'redeemed'}
										<span
											class="shrink-0 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
										>
											Redeemed
										</span>
									{:else}
										<span
											class="shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground"
										>
											In Library
										</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					{#if selectedHistoryEntry.log.error}
						<div class="flex flex-col gap-1">
							<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Error</p>
							<div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{selectedHistoryEntry.log.error}
							</div>
						</div>
					{/if}
				{/if}
			{:else}
				<p class="text-sm text-muted-foreground">No log details available.</p>
			{/if}
		</div>

		{#if selectedHistoryEntry}
			<Dialog.Footer>
				<Button onclick={copyToClipboard}>Copy log</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
