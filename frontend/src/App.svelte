<script>
    import url from './url'
    import Home from './Home.svelte'
    import ViewQuestion from './ViewQuestion.svelte'
    import CreateQuestion from './CreateQuestion.svelte'
</script>

<main>
    {#if $url.hash === '' || $url.hash === '#/'}
      <Home/>
    {:else if $url.hash === '#/create-question'}
      <CreateQuestion/>
    {:else if $url.hash.includes('#/question/')}
      <ViewQuestion questionId={$url.hash.split("/").pop()}/>
    {:else}
      <h1>404</h1>
    {/if}
</main>
