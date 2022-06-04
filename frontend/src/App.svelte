<script>
    import url from './url'
    import Home from './Home.svelte'
    import CreateQuestion from './CreateQuestion.svelte'
</script>

<main>
    {#if $url.hash === '' || $url.hash === '#/'}
      <Home/>
    {:else if $url.hash === '#/create-question'}
      <CreateQuestion/>
    {:else}
      <h1>404</h1>
    {/if}
</main>
