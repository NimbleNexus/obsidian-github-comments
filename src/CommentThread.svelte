<script lang="ts">
	import { type Comments } from "./stores/comments";

	export let comments: Comments;
</script>

<div class="ogc-comment-thread">
	{#if comments.length}
		<h3>Comments for {comments[0].path}</h3>
		{#each comments as comment}
			<!-- User Info -->
			<div class="ogc-comment-user-info">
				<img src={comment?.user?.avatar_url} class="avatar circle" alt={`@${comment?.user?.login}`} width="24" height="24" />
				<span>{comment?.user?.login}</span>
			</div>
			<!-- Comment -->
			<div class="ogc-comment">
				{comment?.body}
			</div>
		{/each}
	{:else}
		No comments to show.
	{/if}
</div>

<style>
	.avatar {
		background-color: var(--avatar-bgColor, var(--color-avatar-bg));
		border-radius: var(--borderRadius-medium, 0.375rem);
		box-shadow: 0 0 0 1px var(--avatar-borderColor, var(--color-avatar-border));
		display: inline-block;
		flex-shrink: 0;
		line-height: 1;
		overflow: hidden;
		vertical-align: middle;
	}
	.circle {
		border-radius: var(--borderRadius-full, 50%) !important;
	}

	.ogc-comment-user-info {
		font-weight: bold;
	}
	.ogc-comment {
		margin-left: 24px;
		margin-bottom: 12px;
	}
</style>