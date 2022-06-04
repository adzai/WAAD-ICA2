<script>
    import router from "page";

    import Home from './routes/Home.svelte'
    import ViewQuestion from './routes/ViewQuestion.svelte'
    import CreateQuestion from './routes/CreateQuestion.svelte'
// Routing issues: https://github.com/sveltejs/kit/issues/2664
let page;
let params;
router('/', () => page = Home)
router('/questions/:id', (ctx, next) => {
  	params = ctx.params
  	next()},  () => page = ViewQuestion)
router('/create', () => page = CreateQuestion)

router.start()

</script>

<main>
    {#if page === Home}
    <Home/>
    {:else if page === CreateQuestion}
    <CreateQuestion/>
    {:else if page === ViewQuestion}
    <ViewQuestion {params}/>
    {/if}
</main>
