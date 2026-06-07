<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		selectSettings,
		upsertNtfySettings,
		upsertTelegramSettings
	} from '$lib/remote/settings.remote';
	import { toast } from 'svelte-sonner';

	let settings = $state(await selectSettings());
	let ntfySaving = $state(false);
	let telegramSaving = $state(false);

	async function saveNtfy() {
		ntfySaving = true;
		try {
			await upsertNtfySettings({
				ntfy_server_url: settings.ntfy_server_url,
				ntfy_topic: settings.ntfy_topic,
				ntfy_token: settings.ntfy_token,
				ntfy_enabled: settings.ntfy_enabled
			});
			toast.success('Ntfy settings saved.');
		} catch {
			toast.error('Failed to save Ntfy settings.');
		} finally {
			ntfySaving = false;
		}
	}

	async function saveTelegram() {
		telegramSaving = true;
		try {
			await upsertTelegramSettings({
				telegram_chat_id: settings.telegram_chat_id,
				telegram_bot_token: settings.telegram_bot_token,
				telegram_enabled: settings.telegram_enabled
			});
			toast.success('Telegram settings saved.');
		} catch {
			toast.error('Failed to save Telegram settings.');
		} finally {
			telegramSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Kapan - Settings</title>
</svelte:head>

<h1 class="text-4xl font-semibold">Settings</h1>

<section class="mt-6 ml-4 flex max-w-2xl flex-col gap-8">
	<h2 class="text-2xl font-semibold">Notifications</h2>

	<div class="ml-4 flex flex-col gap-10">
		<section class="flex flex-col gap-4 border-l pl-4">
			<div class="flex flex-row items-center justify-between gap-3">
				<Label for="ntfy-enabled" class="text-lg font-medium">Ntfy</Label>
				<Switch id="ntfy-enabled" bind:checked={settings.ntfy_enabled} />
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="ntfy-server-url">Server URL</Label>
				<Input
					id="ntfy-server-url"
					type="text"
					placeholder="https://ntfy.sh"
					bind:value={settings.ntfy_server_url}
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="ntfy-topic">Topic</Label>
				<Input
					id="ntfy-topic"
					type="text"
					placeholder="my-topic"
					bind:value={settings.ntfy_topic}
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="ntfy-token">Token</Label>
				<Input
					id="ntfy-token"
					type="password"
					placeholder="••••••••"
					bind:value={settings.ntfy_token}
				/>
			</div>

			<Button onclick={saveNtfy} disabled={ntfySaving} class="mt-2 self-end">
				{ntfySaving ? 'Saving...' : 'Save'}
			</Button>
		</section>

		<section class="flex flex-col gap-4 border-l pl-4">
			<div class="flex flex-row items-center justify-between gap-3">
				<Label for="telegram-enabled" class="text-lg font-medium">Telegram</Label>
				<Switch id="telegram-enabled" bind:checked={settings.telegram_enabled} />
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="telegram-chat-id">Chat ID</Label>
				<Input
					id="telegram-chat-id"
					type="text"
					placeholder="123456789"
					bind:value={settings.telegram_chat_id}
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="telegram-bot-token">Bot Token</Label>
				<Input
					id="telegram-bot-token"
					type="password"
					placeholder="••••••••"
					bind:value={settings.telegram_bot_token}
				/>
			</div>

			<Button onclick={saveTelegram} disabled={telegramSaving} class="mt-2 self-end">
				{telegramSaving ? 'Saving...' : 'Save'}
			</Button>
		</section>
	</div>
</section>
