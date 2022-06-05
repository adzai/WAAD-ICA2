<script>
    import ViewQuestion from "./ViewQuestion.svelte"
    import { Link } from "svelte-routing";
    /* import url from './url' */
    const fetchQuestions = (async () => {
    const response = await fetch('/questions')
    return await response.json()
	})()
    function deleteItem(questionId) {
        fetch(`/questions/${questionId}`,
        {
            method: "DELETE",
        })
        .then(function(res){ window.location.href = "/"})
        .catch(function(res){ console.log(res) })
    }
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
                   getProps={() => ({ class: "link button roundButton question"})}>
                <strong>{question.name}</strong>
                   </Link>
         {#if question.canDelete === 1}
                <button class="button" id="deleteButton" on:click={() => deleteItem(question.id)}>Delete</button>
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

    .question {
        color: white;

    }

    #deleteButton {
        border-radius: 8px;
        background-color: red;
    }
</style>
