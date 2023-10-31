<script lang="ts">
	export let threadId: string | undefined;
</script>

<div class="ogc-comment-thread">
	{#if threadId}
		Display of thread {threadId}
	{:else}
		No thread selected
	{/if}
</div>

<style>
	.ogc-comment-thread {
		color: red;
	}
</style>