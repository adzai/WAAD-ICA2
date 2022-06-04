<script>
    import ViewQuestion from "./ViewQuestion.svelte"
    import { Link } from "svelte-routing";
    /* import url from './url' */
    const fetchQuestions = (async () => {
    const response = await fetch('http://localhost:3000/questions')
    return await response.json()
	})()
</script>

<h1>Q&A app</h1>
<div class=buttonDiv>
    <Link getProps={() => ({ class: "link createButton button" })} to="/create"> Create a new question</Link>
</div>
<h2>List of active questions</h2>
{#await fetchQuestions}
    <p>...waiting</p>
{:then questions}
    <ul>
        {#each questions as question}
          <li>
                    <Link to={`/question/${question.id}`}
                   getProps={() => ({ class: "link button roundButton",
                   id: "question"})}>
                <strong>Question {question.id}: </strong>
                   {question.name}</Link>
         {#if question.canDelete === 1}
                <button class="button roundButton">Delete</button>
         {/if}
          </li>
        {/each}
      </ul>
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}

<style>
    .link {
        text-decoration: none;
        color: red;
    }

    #question {
        color: white;
    }
</style>
