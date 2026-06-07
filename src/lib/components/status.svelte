<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		type: string | undefined;
	}
	let { children, type }: Props = $props();

	function getStatusColor(status: string | undefined): string {
		switch (status) {
			case 'success':
				return 'border-green-500 bg-green-400/50';
			case 'failure':
				return 'border-red-500 bg-red-400/50';
			default:
				return 'border-gray-500 bg-gray-400/50';
		}
	}
</script>

<div class="rounded-lg border {getStatusColor(type)} px-3 py-1 backdrop-blur-2xl">
	{@render children()}
</div>
