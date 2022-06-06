<script>
    import { Link } from "svelte-routing";
    // Fetches list of questions asynchronously
    const fetchQuestions = (async () => {
        const response = await fetch("/questions");
        return await response.json();
    })();
    // Handles deletion of items through the backend API
    function deleteItem(questionId) {
        fetch(`/questions/${questionId}`, {
            method: "DELETE",
        })
            .then(function (_) {
                window.location.href = "/"; // Reloads the home page after deletion
            })
            .catch(function (res) {
                console.log(res);
            });
    }
</script>

<h1>Q&A app</h1>
<div class="buttonDiv">
    <Link getProps={() => ({ class: "link createButton button" })} to="/create">
        Create a new question</Link
    >
</div>
<h2>List of active questions</h2>
<!-- Awaits the promise  and creates a list of questions from the received JSON -->
{#await fetchQuestions}
    <p>...waiting</p>
{:then questions}
    <ul>
        {#each questions as question}
            <li>
                <!-- Create a link with question id from JSON -->
                <Link
                    to={`/question/${question.id}`}
                    getProps={() => ({
                        class: "link button roundButton question",
                    })}
                >
                    <strong>{question.name}</strong>
                </Link>
                <!-- If JSON has canDelete === 1, the user owns the question and can delete it
                    so a delete button is created -->
                {#if question.canDelete === 1}
                    <br /><button
                        class="button"
                        id="deleteButton"
                        on:click={() => deleteItem(question.id)}>Delete</button
                    >
                {/if}
            </li>
        {/each}
    </ul>
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}

<style>
    strong {
        font-size: 1.5em;
    }
    @media (max-width: 600px) {
        strong {
            font-size: 70%;
        }
    }

    #deleteButton {
        border-radius: 8px;
        background-color: red;
    }
</style>
