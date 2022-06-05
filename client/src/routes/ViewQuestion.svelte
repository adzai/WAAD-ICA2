<script>
    import Graph from "./Graph.svelte";
    export let id;
    async function getQuestion() {
        const response = await fetch(`/questions/${id}`);
        return await response.json();
    }
    async function getStats() {
        const response = await fetch(`/stats/${id}`);
        return await response.json();
    }
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
    function vote(answerId) {
        fetch(`/answers/${answerId}`, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            method: "POST",
        })
            .then(function (_) {
                fetchStats = getStats();
                changeColor();
            })
            .catch(function (res) {
                console.log(res);
            });
    }
</script>

{#await fetchQuestion}
    <p>...waiting</p>
{:then data}
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
{#await fetchStats}
    <p>...waiting</p>
{:then data}
    {#each Object.keys(data) as dd}
        {#if data[dd].voted}
            {changeColor() || ""}
            <p id="userVote">You voted for {data[dd].name}</p>
            <p>
                <Graph stats={data} />
            </p>{/if}
    {/each}
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}

<style>
    #userVote {
        font-size: 2em;
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
