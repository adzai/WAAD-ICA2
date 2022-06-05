<script>
    import { Router, Route } from "svelte-routing";
    import Home from "./routes/Home.svelte";
    import ViewQuestion from "./routes/ViewQuestion.svelte";
    import CreateQuestion from "./routes/CreateQuestion.svelte";
    // Routing issues: https://github.com/sveltejs/kit/issues/2664
    let url = "";
</script>

<main>
    <Router {url}>
        <div>
            <Route path="/"><Home /></Route>
            <Route path="question/:id" component={ViewQuestion} />
            <Route path="create" component={CreateQuestion} />
        </div>
    </Router>
</main>
