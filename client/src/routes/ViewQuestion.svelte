<script>
    import Graph from "./Graph.svelte";
    export let id; // collects id passed from Home.svelte

    // asynchronous fetch of question details
    async function getQuestion() {
        const response = await fetch(`/questions/${id}`);
        return await response.json();
    }
    // asynchronous fetch of voting stats
    async function getStats() {
        const response = await fetch(`/stats/${id}`);
        return await response.json();
    }
    // Changes color of answers and disables them if
    // the user has voted on current question
    function changeColor() {
        let elems = document.getElementsByClassName("answerOption");
        for (let elem of elems) {
            elem.disabled = "disabled";
            elem.style.color = "gray";
            elem.style.background = "lightgray";
            elem.style.color = "gray";
            elem.classList.remove("answerOptionHover");
        }
    }
    let fetchQuestion = getQuestion();
    let fetchStats = getStats();
    // POST to backend API with the vote
    function vote(answerId) {
        fetch(`/answers/${answerId}`, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            method: "POST",
        })
            .then(function (_) {
                // Reloads stats since the user has voted and can see them now
                fetchStats = getStats();
                // change questions to disabled since the user has successfully voted
                changeColor();
            })
            .catch(function (res) {
                console.log(res);
            });
    }
</script>

<!-- Wait on question and answers JSON -->
{#await fetchQuestion}
    <p>...waiting</p>
{:then data}
    <!-- Dynamically create Question and its answers -->
    <h1>{Object.keys(data)[0]}</h1>
    <ul>
        {#each data[Object.keys(data)[0]] as answer}
            <li>
                <button
                    class="answerOption answerOptionHover"
                    on:click={() => vote(answer.id)}
                >
                    {answer.name}
                </button>
            </li>
        {/each}
    </ul>
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}
<!-- Wait on voting stats JSON -->
{#await fetchStats}
    <p>...waiting</p>
{:then data}
    <!-- Dynamically add info about user vote and show result button
         if the user hasn't voted yet, data will be empty and none of
         the elements will get created -->
    {#each Object.keys(data) as dd}
        {#if data[dd].voted}
            {changeColor() || ""}
            <p id="userVote">You voted for {data[dd].name}</p>
            <p>
                <Graph stats={data} />
                <!-- pass voting data to Graph component and create it -->
            </p>{/if}
    {/each}
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}

<style>
    #userVote {
        font-size: 2em;
        word-break: break-word;
    }
    li {
        padding: 1em 1em;
    }
    .answerOption {
        word-break: break-word;
        border-radius: 25px;
        background: #b4c3da;
        font-size: 1em;
        padding: 20px;
        width: 30%;
        overflow: hidden;
    }
    .answerOptionHover:hover {
        cursor: pointer;
        background: #44697a;
    }
</style>
