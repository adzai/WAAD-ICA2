<script>
    export let id;
    async function getQuestion () {
        const response = await fetch(`http://localhost:3000/questions/${id}`)
        return await response.json()
	}
    async function getStats () {
        const response = await fetch(`http://localhost:3000/stats/${id}`)
        return await response.json()
	}
    let fetchQuestion = getQuestion();
    let fetchStats = getStats();
    function vote(answerId) {
        fetch(`/answers/${answerId}`,
{
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: "POST",
})
    .then(function(res){
        fetchQuestion = getQuestion();
        fetchStats = getStats();
        })
    .catch(function(res){ console.log(res) })
    }
</script>

{#await fetchQuestion}
    <p>...waiting</p>
{:then data}
<h1>{Object.keys(data)[0]}</h1>
    <ul>
        {#each data[Object.keys(data)[0]] as answer}
          <li>
          <button on:click={() => vote (answer.id)}>{answer.name}</button>
          {#if answer.voted}
          <span>Voted</span>
          {/if}
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
        <h3 style="color: red">{data[dd].name}: {data[dd].counter}</h3>
        {:else}
        <h3>{data[dd].name}: {data[dd].counter}</h3>
        {/if}
        {/each}
{:catch error}
    <p style="color: red">{error.message}</p>
{/await}
