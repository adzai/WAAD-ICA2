<script>
    /* import url from './url' */
    import { Router, Link, Route } from "svelte-routing";
    import Home from './routes/Home.svelte'
    import ViewQuestion from './routes/ViewQuestion.svelte'
    import CreateQuestion from './routes/CreateQuestion.svelte'
// Routing issues: https://github.com/sveltejs/kit/issues/2664

     export let url = "";
</script>

<main>
    <Router url="{url}">
      <div>
        <Route path="/"><Home /></Route>
         <Route path="question/:id" let:params>
          <ViewQuestion questionId="{params.id}" />
        </Route>
        <Route path="create" component="{CreateQuestion}" />
      </div>
    </Router>
</main>
