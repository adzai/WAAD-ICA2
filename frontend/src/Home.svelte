<script>
    import ViewQuestion from "./ViewQuestion.svelte"
    const fetchQuestions = (async () => {
    const response = await fetch('http://localhost:3000/questions')
    return await response.json()
	})()
</script>

<h1>Q&A app</h1>
<div class=buttonDiv>
    <a href="#/create-question" class="button createButton link" >Create a new question</a>
</div>
<h2>List of active questions</h2>
{#await fetchQuestions}
    <p>...waiting</p>
{:then questions}
    <ul>
        {#each questions as question}
          <li>
            <button class="button roundButton">
                <strong>Question {question.id}: </strong>
                    <a class="link" id="question" href={`#/question/${question.id}`}>{question.name}</a>
            </button>
         {#if question.canDelete}
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
    }

    #question {
        color: white;
    }
</style>
